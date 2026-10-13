// Unit tests for the Expo app's auth client (mobile/src/api/authClient.ts) with a fake server.
// No network, no database:  npx tsx --test tests/mobile-client/*.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ApiError,
  NetworkError,
  SessionExpiredError,
  createAuthClient,
  type RefreshTokenStore,
} from "../../mobile/src/api/authClient";
import { loginErrorMessage } from "../../mobile/src/auth/messages";

const b64url = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
/** Unsigned token with a 15-minute iat/exp, enough for the client's expiry math. */
const access = (n: number) => `${b64url({ alg: "HS256" })}.${b64url({ iat: 1000, exp: 1900, n })}.sig`;
const profile = {
  user: { id: "u1", name: "Test", email: "t@test.invalid", role: "BUSINESS_OWNER" },
  business: { id: "b1", name: "İşletme", slug: "s", sector: null, logo: null, isActive: true, subscription: null },
};
const pair = (n: number) => ({ accessToken: access(n), accessTokenExpiresAt: "", refreshToken: `refresh-${n}`, ...profile });

type Call = { path: string; method: string; body: Record<string, unknown> | undefined; auth: string | null; credentials?: string };
type Reply = { status: number; body?: unknown; headers?: Record<string, string> } | "network-error";

function fakeServer(handler: (call: Call) => Reply | Promise<Reply>) {
  const calls: Call[] = [];
  const fetchFn = (async (url: string, init: RequestInit) => {
    const headers = init.headers as Record<string, string>;
    const call: Call = {
      path: url.replace("https://test.invalid", ""),
      method: init.method ?? "GET",
      body: init.body ? JSON.parse(init.body as string) : undefined,
      auth: headers.Authorization ?? null,
      credentials: init.credentials,
    };
    calls.push(call);
    const reply = await handler(call);
    if (reply === "network-error") throw new TypeError("Network request failed");
    return new Response(reply.body === undefined ? null : JSON.stringify(reply.body), { status: reply.status, headers: reply.headers });
  }) as typeof fetch;
  return { calls, fetchFn };
}

function memoryStore(initial: string | null = null) {
  let value = initial;
  const log: string[] = [];
  const store: RefreshTokenStore = {
    get: async () => value,
    set: async (t) => { log.push(`set:${t}`); value = t; },
    clear: async () => { log.push("clear"); value = null; },
  };
  return { store, log, peek: () => value };
}

function setup(handler: (call: Call) => Reply | Promise<Reply>, storeInit: string | null = null) {
  let clock = 1_000_000;
  const server = fakeServer(handler);
  const mem = memoryStore(storeInit);
  let expired = 0;
  const client = createAuthClient({
    baseUrl: "https://test.invalid/",
    store: mem.store,
    fetch: server.fetchFn,
    device: { platform: "ios", appVersion: "1.0.0" },
    onSessionExpired: () => { expired++; },
    now: () => clock,
  });
  return { client, ...server, ...mem, expiredCount: () => expired, advance: (ms: number) => { clock += ms; } };
}

test("login persists the refresh token, then authenticated requests use the Bearer token without cookies", async () => {
  const s = setup((c) => (c.path.endsWith("/login") ? { status: 200, body: pair(1) } : { status: 200, body: { ok: true } }));
  const p = await s.client.login("t@test.invalid", "pw");
  assert.equal(p.business.name, "İşletme");
  assert.equal(s.peek(), "refresh-1");
  assert.deepEqual(s.calls[0].body, { email: "t@test.invalid", password: "pw", platform: "ios", appVersion: "1.0.0" });
  await s.client.request("/api/x");
  assert.equal(s.calls[1].auth, `Bearer ${access(1)}`);
  assert.ok(s.calls.every((c) => c.credentials === "omit"), "never sends cookies");
});

test("login errors surface the API code and map to clear Turkish messages", async () => {
  const s = setup(() => ({ status: 401, body: { error: "Geçersiz e-posta veya şifre.", code: "INVALID_CREDENTIALS" } }));
  const err = await s.client.login("a@b.c", "wrong").catch((e) => e);
  assert.ok(err instanceof ApiError && err.code === "INVALID_CREDENTIALS");
  assert.equal(loginErrorMessage(err), "E-posta veya şifre hatalı.");
  assert.equal(s.peek(), null);

  const limited = setup(() => ({ status: 429, body: { code: "RATE_LIMITED" }, headers: { "Retry-After": "130" } }));
  assert.match(loginErrorMessage(await limited.client.login("a@b.c", "x").catch((e) => e)), /3 dakika/);
  const offline = setup(() => "network-error");
  const net = await offline.client.login("a@b.c", "x").catch((e) => e);
  assert.ok(net instanceof NetworkError);
  assert.match(loginErrorMessage(net), /Sunucuya ulaşılamadı/);
  assert.match(loginErrorMessage(new ApiError(403, "NOT_ELIGIBLE", "")), /işletme sahibi/);
  assert.match(loginErrorMessage(new ApiError(500, "SERVER_ERROR", "")), /Şu anda giriş yapılamıyor/);
});

test("concurrent requests with an expired access token trigger exactly one refresh", async () => {
  let refreshes = 0;
  const s = setup(async (c) => {
    if (c.path.endsWith("/login")) return { status: 200, body: pair(1) };
    if (c.path.endsWith("/refresh")) {
      refreshes++;
      await new Promise((r) => setTimeout(r, 20));
      return { status: 200, body: pair(2) };
    }
    return { status: 200, body: { ok: true } };
  });
  await s.client.login("a", "b");
  s.advance(15 * 60 * 1000);
  await Promise.all(Array.from({ length: 5 }, () => s.client.request("/api/x")));
  assert.equal(refreshes, 1);
  assert.ok(s.calls.filter((c) => c.path === "/api/x").every((c) => c.auth === `Bearer ${access(2)}`));
  assert.equal(s.peek(), "refresh-2");
});

test("refreshes ahead of expiry (1-minute margin) and not before", async () => {
  const s = setup((c) => (c.path.endsWith("/login") ? { status: 200, body: pair(1) } : c.path.endsWith("/refresh") ? { status: 200, body: pair(2) } : { status: 200, body: {} }));
  await s.client.login("a", "b");
  s.advance(13 * 60 * 1000);
  await s.client.request("/api/x");
  assert.equal(s.calls.filter((c) => c.path.endsWith("/refresh")).length, 0);
  s.advance(60 * 1000 + 1);
  await s.client.request("/api/x");
  assert.equal(s.calls.filter((c) => c.path.endsWith("/refresh")).length, 1);
});

test("a 401 on a request refreshes once and retries", async () => {
  let first = true;
  const s = setup((c) => {
    if (c.path.endsWith("/login")) return { status: 200, body: pair(1) };
    if (c.path.endsWith("/refresh")) return { status: 200, body: pair(2) };
    if (first) { first = false; return { status: 401, body: {} }; }
    return { status: 200, body: { ok: true } };
  });
  await s.client.login("a", "b");
  assert.deepEqual(await s.client.request("/api/x"), { ok: true });
  assert.deepEqual(s.calls.filter((c) => c.path === "/api/x").map((c) => c.auth), [`Bearer ${access(1)}`, `Bearer ${access(2)}`]);
});

test("a route that refuses even a fresh token is an error, not a sign-out (owner-only route for a team member)", async () => {
  const s = setup((c) => {
    if (c.path.endsWith("/login")) return { status: 200, body: pair(1) };
    if (c.path.endsWith("/refresh")) return { status: 200, body: pair(2) };
    return { status: 401, body: { error: "Yetkisiz erişim." } };
  });
  await s.client.login("a", "b");
  await assert.rejects(s.client.request("/api/owner-only"), (e: unknown) => e instanceof ApiError && e.status === 401);
  assert.equal(s.expiredCount(), 0);
  assert.equal(s.peek(), "refresh-2", "the refreshed session is kept");
  assert.ok(!s.calls.some((c) => c.path.endsWith("/logout")));
});

test("409 REFRESH_RACE: if a newer token is already stored, retry with it once", async () => {
  const s = setup((c) => {
    if (c.body?.refreshToken === "old") return { status: 409, body: { code: "REFRESH_RACE" } };
    if (c.body?.refreshToken === "newer") return { status: 200, body: pair(3) };
    return { status: 500 };
  }, "old");
  // Simulate another flow storing a newer token while our refresh was in flight.
  const originalGet = s.store.get;
  let reads = 0;
  s.store.get = async () => (++reads === 1 ? "old" : "newer");
  assert.ok(await s.client.restore());
  s.store.get = originalGet;
  assert.equal(s.peek(), "refresh-3");
  assert.equal(s.expiredCount(), 0);
});

test("409 REFRESH_RACE with no newer token: the session is unrecoverable → cleared, revoked, user told", async () => {
  const s = setup((c) => (c.path.endsWith("/refresh") ? { status: 409, body: { code: "REFRESH_RACE" } } : { status: 200, body: { success: true } }), "lost");
  await assert.rejects(s.client.request("/api/x"), SessionExpiredError);
  assert.equal(s.peek(), null);
  assert.equal(s.expiredCount(), 1);
  await new Promise((r) => setTimeout(r, 0));
  assert.deepEqual(s.calls.find((c) => c.path.endsWith("/logout"))?.body, { refreshToken: "lost" }, "frees the server session");
});

test("401 on refresh ends the session; network errors and 429 keep it", async () => {
  const dead = setup(() => ({ status: 401, body: { code: "SESSION_INVALID" } }), "t");
  await assert.rejects(dead.client.request("/api/x"), SessionExpiredError);
  assert.equal(dead.peek(), null);
  assert.equal(dead.expiredCount(), 1);

  const offline = setup(() => "network-error", "t");
  await assert.rejects(offline.client.request("/api/x"), NetworkError);
  assert.equal(offline.peek(), "t", "offline never signs out");
  assert.equal(offline.expiredCount(), 0);

  const throttled = setup(() => ({ status: 429, body: { code: "RATE_LIMITED" } }), "t");
  await assert.rejects(throttled.client.request("/api/x"), (e: unknown) => e instanceof ApiError && e.status === 429);
  assert.equal(throttled.peek(), "t");
});

test("restore: null without a stored token or when rejected, throws when offline", async () => {
  assert.equal(await setup(() => ({ status: 500 })).client.restore(), null);
  assert.equal(await setup(() => ({ status: 401, body: {} }), "t").client.restore(), null);
  await assert.rejects(setup(() => "network-error", "t").client.restore(), NetworkError);
  const ok = setup(() => ({ status: 200, body: pair(9) }), "t");
  assert.equal((await ok.client.restore())?.user.id, "u1");
  assert.equal(ok.client.getProfile()?.business.id, "b1");
});

test("the new refresh token is persisted before it is used", async () => {
  const s = setup((c) => (c.path.endsWith("/refresh") ? { status: 200, body: pair(2) } : { status: 200, body: {} }), "t");
  await s.client.request("/api/x");
  assert.deepEqual(s.log, ["set:refresh-2"]);
  assert.equal(s.calls.at(-1)?.auth, `Bearer ${access(2)}`);
});

test("logout clears locally even when the server is unreachable", async () => {
  const online = setup(() => ({ status: 200, body: { success: true } }), "t");
  await online.client.logout();
  assert.equal(online.peek(), null);
  assert.deepEqual(online.calls[0].body, { refreshToken: "t" });

  const offline = setup(() => "network-error", "t");
  await offline.client.logout();
  assert.equal(offline.peek(), null);
  assert.equal(offline.client.getProfile(), null);
});

test("error messages never contain tokens or passwords", async () => {
  const s = setup(() => ({ status: 401, body: { code: "INVALID_CREDENTIALS", error: "Geçersiz e-posta veya şifre." } }));
  const err = (await s.client.login("a@b.c", "s3cret-pass").catch((e) => e)) as Error;
  assert.ok(!err.message.includes("s3cret-pass"));
  assert.ok(!loginErrorMessage(err).includes("s3cret-pass"));
});
