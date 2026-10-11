import { test } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import "./helpers";
import { signToken, verifyToken } from "../../src/lib/auth";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  getBearerToken,
  hashRefreshToken,
  signAccessToken,
  verifyAccessToken,
} from "../../src/lib/mobileAuth";
import { getClientIp, rateLimitKey } from "../../src/lib/rateLimit";

const withEnv = (patch: Record<string, string | undefined>, fn: () => void) => {
  const saved = Object.fromEntries(Object.keys(patch).map((k) => [k, process.env[k]]));
  Object.assign(process.env, patch);
  for (const [k, v] of Object.entries(patch)) if (v === undefined) delete process.env[k];
  try { fn(); } finally {
    for (const [k, v] of Object.entries(saved)) if (v === undefined) delete process.env[k]; else process.env[k] = v;
  }
};

test("MOBILE_JWT_SECRET is required, long enough and distinct from JWT_SECRET", () => {
  withEnv({ MOBILE_JWT_SECRET: undefined }, () => assert.throws(() => signAccessToken("u", "s"), /MOBILE_JWT_SECRET/));
  withEnv({ MOBILE_JWT_SECRET: "short" }, () => assert.throws(() => signAccessToken("u", "s"), /MOBILE_JWT_SECRET/));
  withEnv({ MOBILE_JWT_SECRET: process.env.JWT_SECRET }, () => assert.throws(() => signAccessToken("u", "s"), /differ/));
  // A missing secret must not look like an invalid token.
  withEnv({ MOBILE_JWT_SECRET: undefined }, () => assert.throws(() => verifyAccessToken("x"), /MOBILE_JWT_SECRET/));
});

test("access token round-trips and expires in 15 minutes", () => {
  const { accessToken, accessTokenExpiresAt } = signAccessToken("user-1", "session-1");
  assert.deepEqual(verifyAccessToken(accessToken), { userId: "user-1", sessionId: "session-1" });
  const decoded = jwt.decode(accessToken, { complete: true }) as jwt.Jwt & { payload: jwt.JwtPayload };
  assert.equal(decoded.header.alg, "HS256");
  assert.equal(decoded.payload.exp! - decoded.payload.iat!, ACCESS_TOKEN_TTL_SECONDS);
  assert.ok(Math.abs(accessTokenExpiresAt.getTime() - (Date.now() + 15 * 60 * 1000)) < 5000);
});

test("web cookie tokens and mobile access tokens are not interchangeable", () => {
  const webToken = signToken({ userId: "user-1", email: "a@b.c", role: "BUSINESS_OWNER" });
  assert.equal(verifyAccessToken(webToken), null, "web token must not authenticate as mobile");
  const { accessToken } = signAccessToken("user-1", "session-1");
  assert.equal(verifyToken(accessToken), null, "mobile token must not authenticate as web cookie");
});

test("forged, mis-scoped and expired access tokens are rejected", () => {
  const secret = process.env.MOBILE_JWT_SECRET!;
  const base = { typ: "access", sid: "s" };
  const opts = { issuer: "randevugo", audience: "randevugo-mobile", subject: "u" };
  assert.equal(verifyAccessToken(jwt.sign(base, secret, { ...opts, audience: "other" })), null, "wrong audience");
  assert.equal(verifyAccessToken(jwt.sign(base, secret, { ...opts, issuer: "other" })), null, "wrong issuer");
  assert.equal(verifyAccessToken(jwt.sign({ ...base, typ: "refresh" }, secret, opts)), null, "wrong typ");
  assert.equal(verifyAccessToken(jwt.sign({ typ: "access" }, secret, opts)), null, "missing sid");
  assert.equal(verifyAccessToken(jwt.sign(base, secret, { ...opts, algorithm: "HS512" })), null, "other algorithm");
  assert.equal(verifyAccessToken(jwt.sign(base, secret, { ...opts, expiresIn: -10 })), null, "expired");
  assert.equal(verifyAccessToken(jwt.sign(base, "x".repeat(48), opts)), null, "other secret");
  const none = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString("base64url")}.${Buffer.from(JSON.stringify({ ...base, sub: "u", iss: "randevugo", aud: "randevugo-mobile" })).toString("base64url")}.`;
  assert.equal(verifyAccessToken(none), null, "alg=none");
});

test("Bearer header parsing", () => {
  assert.equal(getBearerToken(new Headers({ Authorization: "Bearer abc.def" })), "abc.def");
  assert.equal(getBearerToken(new Headers({ authorization: "bearer abc" })), "abc");
  assert.equal(getBearerToken(new Headers({ Authorization: "Basic abc" })), null);
  assert.equal(getBearerToken(new Headers({ Authorization: "Bearer a b" })), null);
  assert.equal(getBearerToken(new Headers()), null);
});

test("refresh token hashing is a deterministic SHA-256 hex digest", () => {
  assert.match(hashRefreshToken("abc"), /^[0-9a-f]{64}$/);
  assert.equal(hashRefreshToken("abc"), hashRefreshToken("abc"));
  assert.notEqual(hashRefreshToken("abc"), hashRefreshToken("abd"));
});

test("rate-limit keys never contain the raw email", () => {
  const key = rateLimitKey("mlogin", "email", "  Owner@Example.COM ");
  assert.equal(key, rateLimitKey("mlogin", "email", "owner@example.com"), "normalized");
  assert.ok(!key.toLowerCase().includes("owner"), "hashed");
});

test("client IP: proxy headers trusted only on Vercel; IPv6 grouped by /64", () => {
  const h = new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1", "x-real-ip": "5.6.7.8" });
  withEnv({ VERCEL: undefined }, () => assert.equal(getClientIp(h), "unknown"));
  withEnv({ VERCEL: "1" }, () => {
    assert.equal(getClientIp(h), "5.6.7.8");
    assert.equal(getClientIp(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" })), "1.2.3.4");
    assert.equal(getClientIp(new Headers({ "x-real-ip": "2001:db8:abcd:12:1:2:3:4" })), "2001:db8:abcd:12::/64");
    assert.equal(getClientIp(new Headers({ "x-real-ip": "2001:db8::1" })), "2001:db8:0:0::/64");
    assert.equal(getClientIp(new Headers({ "x-real-ip": "::ffff:9.8.7.6" })), "9.8.7.6");
    assert.equal(getClientIp(new Headers()), "unknown");
  });
});
