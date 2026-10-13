import { after, test } from "node:test";
import assert from "node:assert/strict";
import { cleanup, createUser, prisma } from "./helpers";
import {
  RACE_GRACE_MS,
  authenticateMobileAccessToken,
  createMobileSession,
  getEligibleMobileUser,
  hashRefreshToken,
  revokeAllMobileSessions,
  revokeMobileSessionByRefreshToken,
  rotateRefreshToken,
  signAccessToken,
} from "../../src/lib/mobileAuth";

after(cleanup);

const ageRotation = (sessionId: string) =>
  prisma.mobileSession.update({ where: { id: sessionId }, data: { rotatedAt: new Date(Date.now() - RACE_GRACE_MS - 1000) } });

test("only active business owners with a business are eligible", async () => {
  assert.ok(await getEligibleMobileUser((await createUser()).id));
  assert.equal(await getEligibleMobileUser((await createUser({ isActive: false })).id), null, "inactive");
  assert.equal(await getEligibleMobileUser((await createUser({ role: "ADMIN", withBusiness: false })).id), null, "admin");
  assert.equal(await getEligibleMobileUser((await createUser({ role: "SUPPORT", withBusiness: false })).id), null, "support");
  assert.equal(await getEligibleMobileUser((await createUser({ withBusiness: false })).id), null, "no business");
});

test("a session stores only the refresh token hash, and the access token authenticates", async () => {
  const user = await createUser();
  const s = await createMobileSession(user.id, { deviceName: "Test Phone", platform: "ios", appVersion: "1.0.0" });
  const row = await prisma.mobileSession.findUniqueOrThrow({ where: { id: s.sessionId } });
  assert.equal(row.refreshTokenHash, hashRefreshToken(s.refreshToken));
  assert.notEqual(row.refreshTokenHash, s.refreshToken);
  assert.equal(row.platform, "ios");
  assert.ok(row.absoluteExpiresAt.getTime() - Date.now() > 89 * 24 * 3600 * 1000);

  const auth = await authenticateMobileAccessToken(s.accessToken);
  assert.equal(auth?.user.id, user.id);
  assert.equal(auth?.user.business?.userId, user.id);
});

test("rotation issues a new pair and each refresh token works only once", async () => {
  const user = await createUser();
  const s = await createMobileSession(user.id);
  const r1 = await rotateRefreshToken(s.refreshToken);
  assert.ok(r1.ok);
  assert.notEqual(r1.refreshToken, s.refreshToken);
  assert.equal((await authenticateMobileAccessToken(r1.accessToken))?.sessionId, s.sessionId);

  // Old token right after rotation: a concurrent refresh, not an attack. Nothing is revoked.
  assert.deepEqual(await rotateRefreshToken(s.refreshToken), { ok: false, reason: "RACE" });
  assert.equal((await prisma.mobileSession.findUniqueOrThrow({ where: { id: s.sessionId } })).revokedAt, null);

  // The new token keeps working.
  const r2 = await rotateRefreshToken(r1.refreshToken);
  assert.ok(r2.ok);
});

test("replaying the previous token after the grace window revokes that session only", async () => {
  const user = await createUser();
  const victim = await createMobileSession(user.id);
  const otherDevice = await createMobileSession(user.id);
  const rotated = await rotateRefreshToken(victim.refreshToken);
  assert.ok(rotated.ok);
  await ageRotation(victim.sessionId);

  assert.deepEqual(await rotateRefreshToken(victim.refreshToken), { ok: false, reason: "REUSE" });
  const row = await prisma.mobileSession.findUniqueOrThrow({ where: { id: victim.sessionId } });
  assert.equal(row.revokedReason, "REUSE");
  // The legitimate holder of the newest token is signed out too, immediately.
  assert.deepEqual(await rotateRefreshToken(rotated.refreshToken), { ok: false, reason: "REVOKED" });
  assert.equal(await authenticateMobileAccessToken(rotated.accessToken), null);
  // Other devices of the same user are untouched.
  assert.ok(await authenticateMobileAccessToken(otherDevice.accessToken));
});

test("two concurrent refreshes with the same token: exactly one wins, the other gets RACE", async () => {
  const user = await createUser();
  const s = await createMobileSession(user.id);
  const results = await Promise.all([rotateRefreshToken(s.refreshToken), rotateRefreshToken(s.refreshToken)]);
  assert.equal(results.filter((r) => r.ok).length, 1);
  assert.deepEqual(results.find((r) => !r.ok), { ok: false, reason: "RACE" });
  assert.equal((await prisma.mobileSession.findUniqueOrThrow({ where: { id: s.sessionId } })).revokedAt, null);
});

test("unknown, expired and over-the-cap sessions are refused", async () => {
  assert.deepEqual(await rotateRefreshToken("not-a-real-token"), { ok: false, reason: "INVALID" });

  const user = await createUser();
  const sliding = await createMobileSession(user.id);
  await prisma.mobileSession.update({ where: { id: sliding.sessionId }, data: { expiresAt: new Date(Date.now() - 1000) } });
  assert.deepEqual(await rotateRefreshToken(sliding.refreshToken), { ok: false, reason: "EXPIRED" });
  assert.equal(await authenticateMobileAccessToken(sliding.accessToken), null);

  const capped = await createMobileSession(user.id);
  await prisma.mobileSession.update({ where: { id: capped.sessionId }, data: { absoluteExpiresAt: new Date(Date.now() - 1000) } });
  assert.deepEqual(await rotateRefreshToken(capped.refreshToken), { ok: false, reason: "EXPIRED" });
});

test("refresh never extends a session past its absolute cap", async () => {
  const user = await createUser();
  const s = await createMobileSession(user.id);
  const cap = new Date(Date.now() + 60 * 60 * 1000);
  await prisma.mobileSession.update({ where: { id: s.sessionId }, data: { absoluteExpiresAt: cap } });
  assert.ok((await rotateRefreshToken(s.refreshToken)).ok);
  const row = await prisma.mobileSession.findUniqueOrThrow({ where: { id: s.sessionId } });
  assert.ok(row.expiresAt.getTime() <= cap.getTime());
});

test("deactivating the user cuts off access tokens and refresh immediately", async () => {
  const user = await createUser();
  const s = await createMobileSession(user.id);
  await prisma.user.update({ where: { id: user.id }, data: { isActive: false } });
  assert.equal(await authenticateMobileAccessToken(s.accessToken), null);
  assert.deepEqual(await rotateRefreshToken(s.refreshToken), { ok: false, reason: "NOT_ELIGIBLE" });
  assert.equal((await prisma.mobileSession.findUniqueOrThrow({ where: { id: s.sessionId } })).revokedReason, "NOT_ELIGIBLE");
});

test("logout accepts the current or the just-rotated token and is idempotent", async () => {
  const user = await createUser();
  const a = await createMobileSession(user.id);
  assert.equal(await revokeMobileSessionByRefreshToken(a.refreshToken), true);
  assert.equal(await revokeMobileSessionByRefreshToken(a.refreshToken), false, "second logout is a no-op");
  assert.equal(await authenticateMobileAccessToken(a.accessToken), null);

  // Client that lost the rotated response can still sign out with the token it has.
  const b = await createMobileSession(user.id);
  assert.ok((await rotateRefreshToken(b.refreshToken)).ok);
  assert.equal(await revokeMobileSessionByRefreshToken(b.refreshToken), true);
  assert.equal((await prisma.mobileSession.findUniqueOrThrow({ where: { id: b.sessionId } })).revokedReason, "LOGOUT");
});

test("revokeAllMobileSessions signs the user out everywhere (password change)", async () => {
  const user = await createUser();
  const [a, b] = [await createMobileSession(user.id), await createMobileSession(user.id)];
  assert.equal(await revokeAllMobileSessions(user.id, "PASSWORD_CHANGED"), 2);
  assert.equal(await authenticateMobileAccessToken(a.accessToken), null);
  assert.deepEqual(await rotateRefreshToken(b.refreshToken), { ok: false, reason: "REVOKED" });
});

test("an access token for another user's session id is rejected", async () => {
  const [u1, u2] = [await createUser(), await createUser()];
  const s1 = await createMobileSession(u1.id);
  const forged = signAccessToken(u2.id, s1.sessionId).accessToken;
  assert.equal(await authenticateMobileAccessToken(forged), null);
});
