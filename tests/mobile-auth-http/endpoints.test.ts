import { after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import { cleanup, createUser, prisma, resetAuthRateLimits } from "../mobile-auth/helpers";
import { RACE_GRACE_MS, hashRefreshToken } from "../../src/lib/mobileAuth";
import { signToken } from "../../src/lib/auth";
import { RATE_LIMITS, rateLimitKey } from "../../src/lib/rateLimit";

const BASE = process.env.MOBILE_API_BASE;
if (!BASE) throw new Error("Run via `node scripts/test-env/run-http-tests.mjs`.");

after(cleanup);
beforeEach(resetAuthRateLimits);

type Res = { status: number; body: Record<string, unknown>; headers: Headers; raw: string };
async function call(method: string, path: string, opts: { body?: unknown; token?: string; cookie?: string; rawBody?: string } = {}): Promise<Res> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  if (opts.cookie) headers.Cookie = opts.cookie;
  const r = await fetch(BASE + path, { method, headers, body: opts.rawBody ?? (opts.body === undefined ? undefined : JSON.stringify(opts.body)) });
  const raw = await r.text();
  let body: Record<string, unknown> = {};
  try { body = JSON.parse(raw); } catch {}
  return { status: r.status, body, headers: r.headers, raw };
}
const login = (email: string, password: string, extra: object = {}) => call("POST", "/api/mobile/auth/login", { body: { email, password, ...extra } });
const refresh = (refreshToken: string) => call("POST", "/api/mobile/auth/refresh", { body: { refreshToken } });
const me = (token: string) => call("GET", "/api/mobile/auth/me", { token });
const password = () => crypto.randomBytes(12).toString("base64url");

async function owner() {
  const pw = password();
  const user = await createUser({ password: pw });
  return { user, pw };
}

test("login: an active business owner gets a token pair and a safe profile", async () => {
  const { user, pw } = await owner();
  const r = await login(user.email.toUpperCase(), pw, { deviceName: "Test iPhone", platform: "ios", appVersion: "1.0.0" });
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("cache-control"), "no-store");
  assert.equal(typeof r.body.accessToken, "string");
  assert.equal(typeof r.body.refreshToken, "string");
  assert.ok(r.body.accessTokenExpiresAt);
  assert.deepEqual(Object.keys(r.body.user as object).sort(), ["email", "id", "name", "role"]);
  assert.ok((r.body.business as { id?: string }).id);
  assert.ok(!r.raw.includes("password") && !r.raw.includes("$2"), "no password hash in the response");
  const row = await prisma.mobileSession.findFirstOrThrow({ where: { userId: user.id } });
  assert.equal(row.refreshTokenHash, hashRefreshToken(r.body.refreshToken as string), "only the hash is stored");
  assert.equal(row.platform, "ios");
});

test("login: wrong password and unknown email get the same 401", async () => {
  const { user } = await owner();
  const wrong = await login(user.email, "definitely-wrong");
  const unknown = await login(`nobody-${crypto.randomBytes(4).toString("hex")}@test.invalid`, "whatever");
  assert.equal(wrong.status, 401);
  assert.equal(unknown.status, 401);
  assert.deepEqual(wrong.body, unknown.body);
});

test("login: inactive, admin, support and business-less accounts are refused", async () => {
  const pw = password();
  const inactive = await createUser({ password: pw, isActive: false });
  assert.deepEqual([(await login(inactive.email, pw)).status, (await login(inactive.email, pw)).body.code], [403, "ACCOUNT_INACTIVE"]);
  for (const opts of [{ role: "ADMIN", withBusiness: false }, { role: "SUPER_ADMIN", withBusiness: false }, { role: "SUPPORT", withBusiness: false }, { withBusiness: false }]) {
    const u = await createUser({ password: pw, ...opts });
    const r = await login(u.email, pw);
    assert.deepEqual([r.status, r.body.code], [403, "NOT_ELIGIBLE"], JSON.stringify(opts));
  }
  assert.equal(await prisma.mobileSession.count({ where: { userId: inactive.id } }), 0, "no session for refused logins");
});

test("login: malformed requests get 400", async () => {
  assert.equal((await call("POST", "/api/mobile/auth/login", { rawBody: "not json" })).status, 400);
  assert.equal((await call("POST", "/api/mobile/auth/login", { body: [] })).status, 400);
  assert.equal((await call("POST", "/api/mobile/auth/login", { body: { email: "a@b.c" } })).status, 400);
  assert.equal((await call("POST", "/api/mobile/auth/login", { body: { email: 1, password: 2 } })).status, 400);
});

test("login: 5 attempts per account, then 429 with Retry-After even for the right password", async () => {
  const { user, pw } = await owner();
  for (let i = 0; i < 5; i++) assert.equal((await login(user.email, "wrong")).status, 401, `attempt ${i + 1}`);
  const blocked = await login(user.email, pw);
  assert.equal(blocked.status, 429);
  assert.ok(Number(blocked.headers.get("retry-after")) > 0);
  assert.equal(blocked.body.code, "RATE_LIMITED");
});

test("login: a successful login clears the per-account failure counter", async () => {
  const { user, pw } = await owner();
  for (let i = 0; i < 4; i++) await login(user.email, "wrong");
  assert.equal((await login(user.email, pw)).status, 200);
  for (let i = 0; i < 4; i++) assert.equal((await login(user.email, "wrong")).status, 401, "counter restarted");
});

test("me: Bearer access token works; missing, garbage and web cookie tokens do not", async () => {
  const { user, pw } = await owner();
  const { accessToken } = (await login(user.email, pw)).body as { accessToken: string };
  const ok = await me(accessToken);
  assert.equal(ok.status, 200);
  assert.equal((ok.body.user as { id: string }).id, user.id);
  assert.ok(!ok.raw.includes("$2"));

  assert.equal((await call("GET", "/api/mobile/auth/me")).status, 401);
  assert.equal((await me("garbage")).status, 401);
  const webToken = signToken({ userId: user.id, email: user.email, role: "BUSINESS_OWNER" });
  assert.equal((await me(webToken)).status, 401, "web cookie token as Bearer");
  assert.equal((await call("GET", "/api/mobile/auth/me", { cookie: `randevugo_session=${webToken}` })).status, 401, "cookies are ignored");
});

test("web: the mobile access token is not accepted as the web session cookie", async () => {
  const { user, pw } = await owner();
  const { accessToken } = (await login(user.email, pw)).body as { accessToken: string };
  assert.equal((await call("GET", "/api/auth/me", { cookie: `randevugo_session=${accessToken}` })).status, 401);
  // (Bearer on business APIs is intended and covered in bearer.test.ts.)
});

test("web: cookie login still works for the same account (regression)", async () => {
  const { user, pw } = await owner();
  const r = await fetch(`${BASE}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: user.email, password: pw }) });
  assert.equal(r.status, 200);
  const cookie = r.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie?.startsWith("randevugo_session="));
  const meWeb = await call("GET", "/api/auth/me", { cookie });
  assert.equal(meWeb.status, 200);
  assert.equal(await prisma.mobileSession.count({ where: { userId: user.id } }), 0, "web login creates no mobile session");
});

test("refresh: rotates the pair; the old token is a 409 race right after, the new one keeps working", async () => {
  const { user, pw } = await owner();
  const first = (await login(user.email, pw)).body as { refreshToken: string; accessToken: string };
  const r1 = await refresh(first.refreshToken);
  assert.equal(r1.status, 200);
  assert.notEqual(r1.body.refreshToken, first.refreshToken);
  assert.equal((await me(r1.body.accessToken as string)).status, 200);

  const race = await refresh(first.refreshToken);
  assert.deepEqual([race.status, race.body.code], [409, "REFRESH_RACE"]);
  assert.equal((await refresh(r1.body.refreshToken as string)).status, 200, "race did not revoke the session");
});

test("refresh: two simultaneous requests with one token → one 200, one 409", async () => {
  const { user, pw } = await owner();
  const { refreshToken } = (await login(user.email, pw)).body as { refreshToken: string };
  const statuses = (await Promise.all([refresh(refreshToken), refresh(refreshToken)])).map((r) => r.status).sort();
  assert.deepEqual(statuses, [200, 409]);
});

test("refresh: replaying the old token after the grace window revokes that session (401 for both tokens)", async () => {
  const { user, pw } = await owner();
  const first = (await login(user.email, pw)).body as { refreshToken: string };
  const other = (await login(user.email, pw)).body as { accessToken: string };
  const rotated = (await refresh(first.refreshToken)).body as { refreshToken: string; accessToken: string };
  await prisma.mobileSession.updateMany({
    where: { refreshTokenHash: hashRefreshToken(rotated.refreshToken) },
    data: { rotatedAt: new Date(Date.now() - RACE_GRACE_MS - 1000) },
  });

  const replay = await refresh(first.refreshToken);
  assert.deepEqual([replay.status, replay.body.code], [401, "SESSION_INVALID"]);
  assert.equal((await refresh(rotated.refreshToken)).status, 401, "current token is dead too");
  assert.equal((await me(rotated.accessToken)).status, 401, "access token is cut off immediately");
  assert.equal((await me(other.accessToken)).status, 200, "the user's other device is unaffected");
  const row = await prisma.mobileSession.findFirstOrThrow({ where: { refreshTokenHash: hashRefreshToken(rotated.refreshToken) } });
  assert.equal(row.revokedReason, "REUSE");
});

test("refresh: unknown or malformed tokens are refused without detail", async () => {
  const r = await refresh("x".repeat(43));
  assert.deepEqual([r.status, r.body.code], [401, "SESSION_INVALID"]);
  assert.equal((await call("POST", "/api/mobile/auth/refresh", { body: {} })).status, 400);
  assert.equal((await call("POST", "/api/mobile/auth/refresh", { body: { refreshToken: "x".repeat(500) } })).status, 400);
});

test("refresh: deactivating the user ends the session at the next refresh and request", async () => {
  const { user, pw } = await owner();
  const s = (await login(user.email, pw)).body as { refreshToken: string; accessToken: string };
  await prisma.user.update({ where: { id: user.id }, data: { isActive: false } });
  assert.equal((await me(s.accessToken)).status, 401);
  assert.equal((await refresh(s.refreshToken)).status, 401);
});

test("refresh: rate limited per session (30/min)", async () => {
  const { user, pw } = await owner();
  const s = (await login(user.email, pw)).body as { refreshToken: string };
  const row = await prisma.mobileSession.findFirstOrThrow({ where: { refreshTokenHash: hashRefreshToken(s.refreshToken) } });
  // Put this session's counter at the limit directly: 30 real round trips to the remote TEST db take
  // longer than the 60s window itself. Counter atomicity is covered in tests/mobile-auth/rateLimit.test.ts.
  const key = rateLimitKey("mrefresh", "session", row.id);
  await prisma.authRateLimit.create({ data: { key, count: RATE_LIMITS.mobileRefresh.limit, windowStart: new Date() } });

  const blocked = await refresh(s.refreshToken);
  assert.deepEqual([blocked.status, blocked.body.code], [429, "RATE_LIMITED"]);
  assert.ok(Number(blocked.headers.get("retry-after")) > 0);
  // Throttled requests do not rotate (the token stays valid once the window passes).
  assert.equal((await prisma.mobileSession.findUniqueOrThrow({ where: { id: row.id } })).refreshTokenHash, row.refreshTokenHash);

  await prisma.authRateLimit.delete({ where: { key } });
  assert.equal((await refresh(s.refreshToken)).status, 200);
});

test("logout: revokes the session, is idempotent, and leaks nothing for unknown tokens", async () => {
  const { user, pw } = await owner();
  const s = (await login(user.email, pw)).body as { refreshToken: string; accessToken: string };
  assert.equal((await call("POST", "/api/mobile/auth/logout", { body: { refreshToken: s.refreshToken } })).status, 200);
  assert.equal((await me(s.accessToken)).status, 401, "access token dies with the session");
  assert.equal((await refresh(s.refreshToken)).status, 401);
  assert.equal((await call("POST", "/api/mobile/auth/logout", { body: { refreshToken: s.refreshToken } })).status, 200, "idempotent");
  assert.equal((await call("POST", "/api/mobile/auth/logout", { body: { refreshToken: "unknown-token" } })).status, 200, "same answer for unknown tokens");
  assert.equal((await call("POST", "/api/mobile/auth/logout", { body: {} })).status, 400);
});

test("logout: works with the previous token when the rotated response was lost", async () => {
  const { user, pw } = await owner();
  const first = (await login(user.email, pw)).body as { refreshToken: string };
  const rotated = (await refresh(first.refreshToken)).body as { accessToken: string };
  assert.equal((await call("POST", "/api/mobile/auth/logout", { body: { refreshToken: first.refreshToken } })).status, 200);
  assert.equal((await me(rotated.accessToken)).status, 401);
});
