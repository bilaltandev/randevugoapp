// A support agent resetting an owner's password ends the owner's web and mobile sessions.
// Run via `node scripts/test-env/run-http-tests.mjs tests/sessions-http/password-reset.test.ts`.
import { after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import { signToken } from "../../src/lib/auth";
import { cleanup, createUser, prisma, resetAuthRateLimits } from "../mobile-auth/helpers";

const BASE = process.env.MOBILE_API_BASE;
if (!BASE) throw new Error("Run via `node scripts/test-env/run-http-tests.mjs`.");

after(cleanup);
beforeEach(resetAuthRateLimits);

async function post(path: string, body: unknown, cookie?: string) {
  const r = await fetch(BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify(body),
  });
  let json: Record<string, any> = {};
  try { json = await r.json(); } catch {}
  return { status: r.status, body: json, cookie: r.headers.get("set-cookie")?.split(";")[0] };
}

const get = (path: string, auth: { cookie?: string; token?: string }) =>
  fetch(BASE + path, {
    headers: { ...(auth.cookie ? { Cookie: auth.cookie } : {}), ...(auth.token ? { Authorization: `Bearer ${auth.token}` } : {}) },
  }).then((r) => r.status);

async function setup() {
  const ownerPw = crypto.randomBytes(12).toString("base64url");
  const owner = await createUser({ password: ownerPw });
  const business = await prisma.business.findFirstOrThrow({ where: { userId: owner.id } });
  const agentPw = crypto.randomBytes(12).toString("base64url");
  const agent = await createUser({ role: "SUPPORT", withBusiness: false, password: agentPw });

  const web = await post("/api/auth/login", { email: owner.email, password: ownerPw });
  assert.equal(web.status, 200, "owner web login");
  const mobile = await post("/api/mobile/auth/login", { email: owner.email, password: ownerPw });
  assert.equal(mobile.status, 200, "owner mobile login");
  const support = await post("/api/auth/support-login", { email: agent.email, password: agentPw });
  assert.equal(support.status, 200, "support login");

  return { owner, business, web: web.cookie!, mobile: mobile.body, support: support.cookie! };
}

test("support password reset signs the owner out of web and mobile; the new password works", async () => {
  const s = await setup();
  assert.equal(await get("/api/auth/me", { cookie: s.web }), 200, "web session before reset");
  assert.equal(await get("/api/appointments", { token: s.mobile.accessToken }), 200, "mobile session before reset");

  const reset = await post(`/api/support/businesses/${s.business.id}`, { action: "RESET_OWNER_PASSWORD" }, s.support);
  assert.equal(reset.status, 200);
  const temporaryPassword = reset.body.temporaryPassword as string;

  assert.equal(await get("/api/auth/me", { cookie: s.web }), 401, "old web session ends");
  assert.equal(await get("/api/appointments", { token: s.mobile.accessToken }), 401, "mobile access token stops working");
  const refresh = await post("/api/mobile/auth/refresh", { refreshToken: s.mobile.refreshToken });
  assert.equal(refresh.status, 401, "mobile refresh token is revoked");
  const sessions = await prisma.mobileSession.findMany({ where: { userId: s.owner.id } });
  assert.ok(sessions.length > 0 && sessions.every((x) => x.revokedReason === "PASSWORD_CHANGED"));

  const again = await post("/api/auth/login", { email: s.owner.email, password: temporaryPassword });
  assert.equal(again.status, 200, "temporary password signs in");
  assert.equal(await get("/api/auth/me", { cookie: again.cookie }), 200, "new web session works");
  assert.equal(await get("/api/auth/me", { cookie: s.support }), 200, "the agent's own session is untouched");
});

test("web sessions without a matching password stamp are rejected", async () => {
  const s = await setup();
  // The runner gives this process the server's JWT_SECRET, so these tokens verify — only the stamp differs.
  const unstamped = signToken({ userId: s.owner.id, email: s.owner.email, role: "BUSINESS_OWNER" });
  const forged = signToken({ userId: s.owner.id, email: s.owner.email, role: "BUSINESS_OWNER", pwd: "AAAAAAAAAAAAAAAA" });
  assert.equal(await get("/api/auth/me", { cookie: `randevugo_session=${unstamped}` }), 401, "issued before stamps existed");
  assert.equal(await get("/api/auth/me", { cookie: `randevugo_session=${forged}` }), 401, "wrong stamp");
  assert.equal(await get("/api/auth/me", { cookie: s.web }), 200, "the real login cookie works");
});
