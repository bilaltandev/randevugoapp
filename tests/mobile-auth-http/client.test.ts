// The Expo app's real auth client (mobile/src/api/authClient.ts) against the real API on the TEST database.
// Run via `node scripts/test-env/run-http-tests.mjs`.
import { after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import { cleanup, createUser, prisma, resetAuthRateLimits } from "../mobile-auth/helpers";
import { createAuthClient, SessionExpiredError, type RefreshTokenStore } from "../../mobile/src/api/authClient";
import { RACE_GRACE_MS, hashRefreshToken } from "../../src/lib/mobileAuth";

const BASE = process.env.MOBILE_API_BASE;
if (!BASE) throw new Error("Run via `node scripts/test-env/run-http-tests.mjs`.");

after(cleanup);
beforeEach(resetAuthRateLimits);

function memoryStore(): RefreshTokenStore & { value: string | null } {
  return {
    value: null,
    async get() { return this.value; },
    async set(t) { this.value = t; },
    async clear() { this.value = null; },
  };
}

async function signedInClient() {
  const pw = crypto.randomBytes(12).toString("base64url");
  const user = await createUser({ password: pw });
  const store = memoryStore();
  let clock = Date.now();
  let expired = 0;
  const client = createAuthClient({
    baseUrl: BASE!,
    store,
    device: { platform: "android", appVersion: "test" },
    now: () => clock,
    onSessionExpired: () => { expired++; },
  });
  await client.login(user.email, pw);
  return { user, pw, store, client, advance: (ms: number) => { clock += ms; }, expiredCount: () => expired };
}

test("login → authenticated request → restore after an app restart", async () => {
  const { user, store, client } = await signedInClient();
  const me = await client.request<{ user: { id: string } }>("/api/mobile/auth/me");
  assert.equal(me.user.id, user.id);

  // A fresh client with the same persisted token (= app relaunch) resumes the session.
  const relaunched = createAuthClient({ baseUrl: BASE!, store });
  assert.equal((await relaunched.restore())?.user.id, user.id);
  assert.equal((await relaunched.request<{ user: { id: string } }>("/api/mobile/auth/me")).user.id, user.id);
});

test("an expired access token is refreshed once for many concurrent requests", async () => {
  const { user, store, client, advance } = await signedInClient();
  const before = store.value;
  advance(15 * 60 * 1000);
  const results = await Promise.all(Array.from({ length: 4 }, () => client.request<{ user: { id: string } }>("/api/mobile/auth/me")));
  assert.ok(results.every((r) => r.user.id === user.id));
  assert.notEqual(store.value, before, "rotated");
  const session = await prisma.mobileSession.findFirstOrThrow({ where: { userId: user.id } });
  assert.equal(session.refreshTokenHash, hashRefreshToken(store.value!));
  assert.equal(session.previousTokenHash, hashRefreshToken(before!), "exactly one rotation happened");
});

test("logout revokes the server session and clears the device", async () => {
  const { user, store, client } = await signedInClient();
  await client.logout();
  assert.equal(store.value, null);
  const session = await prisma.mobileSession.findFirstOrThrow({ where: { userId: user.id } });
  assert.equal(session.revokedReason, "LOGOUT");
});

test("a session revoked on the server (reuse detected) signs the app out with a notice", async () => {
  const { user, store, client, advance, expiredCount } = await signedInClient();
  const stolen = store.value!;
  advance(15 * 60 * 1000);
  await client.request("/api/mobile/auth/me"); // app rotates normally
  await prisma.mobileSession.updateMany({ where: { userId: user.id }, data: { rotatedAt: new Date(Date.now() - RACE_GRACE_MS - 1000) } });
  // An attacker replays the stolen (old) token → server revokes the session.
  const replay = await fetch(`${BASE}/api/mobile/auth/refresh`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken: stolen }) });
  assert.equal(replay.status, 401);

  // The app's next request finds its session dead: it is signed out and told why.
  await assert.rejects(client.request("/api/mobile/auth/me"), SessionExpiredError);
  assert.equal(store.value, null);
  assert.equal(expiredCount(), 1);
});

test("wrong password is reported as INVALID_CREDENTIALS and nothing is stored", async () => {
  const user = await createUser({ password: "correct-horse-battery" });
  const store = memoryStore();
  const client = createAuthClient({ baseUrl: BASE!, store });
  await assert.rejects(client.login(user.email, "wrong"), (e: unknown) => (e as { code?: string }).code === "INVALID_CREDENTIALS");
  assert.equal(store.value, null);
});
