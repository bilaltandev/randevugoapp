import crypto from "crypto";
import jwt from "jsonwebtoken";
import prisma from "./prisma";

/**
 * Mobile (Expo) authentication: short-lived Bearer access tokens + rotating opaque refresh tokens.
 *
 * Kept strictly apart from the web cookie session in ./auth:
 * - signed with MOBILE_JWT_SECRET (must differ from JWT_SECRET), so neither token verifies as the other;
 * - access tokens carry iss/aud/typ/sid, which web tokens lack, and are only ever read from a Bearer header.
 *
 * Refresh tokens are 32 random bytes; only their SHA-256 hash is stored (MobileSession.refreshTokenHash).
 * Every refresh rotates the token. Presenting the previous token again is either a concurrent refresh
 * (inside RACE_GRACE_MS → "RACE", nothing revoked) or a replay (→ that one session is revoked as "REUSE").
 *
 * Never log tokens, hashes or passwords from here; session ids are the only identifiers logged.
 */

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const SESSION_ABSOLUTE_TTL_MS = 90 * 24 * 60 * 60 * 1000;
export const RACE_GRACE_MS = 30 * 1000;

const JWT_ALGORITHM = "HS256";
const MIN_SECRET_LENGTH = 32;
const ISSUER = "randevugo";
const AUDIENCE = "randevugo-mobile";
const ACCESS_TOKEN_TYPE = "access";
const OWNER_ROLE = "BUSINESS_OWNER";
const MEMBER_ROLE = "TEAM_MEMBER";

export type RevokeReason = "LOGOUT" | "REUSE" | "PASSWORD_CHANGED" | "DEACTIVATED" | "NOT_ELIGIBLE";

// Read lazily so builds don't need the secret; fail loudly (never with a fallback) at first use.
function getMobileJwtSecret(): string {
  const secret = process.env.MOBILE_JWT_SECRET;
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`MOBILE_JWT_SECRET is missing or shorter than ${MIN_SECRET_LENGTH} characters.`);
  }
  if (secret === process.env.JWT_SECRET) {
    throw new Error("MOBILE_JWT_SECRET must differ from JWT_SECRET.");
  }
  return secret;
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}

function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function signAccessToken(userId: string, sessionId: string) {
  const token = jwt.sign({ typ: ACCESS_TOKEN_TYPE, sid: sessionId }, getMobileJwtSecret(), {
    algorithm: JWT_ALGORITHM,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    issuer: ISSUER,
    audience: AUDIENCE,
    subject: userId,
  });
  return { accessToken: token, accessTokenExpiresAt: new Date(Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000) };
}

export function verifyAccessToken(token: string): { userId: string; sessionId: string } | null {
  // Outside the try: a misconfigured secret must surface as an error, not as "invalid token".
  const secret = getMobileJwtSecret();
  try {
    const payload = jwt.verify(token, secret, {
      algorithms: [JWT_ALGORITHM],
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (typeof payload !== "object" || payload.typ !== ACCESS_TOKEN_TYPE) return null;
    if (typeof payload.sub !== "string" || typeof payload.sid !== "string") return null;
    return { userId: payload.sub, sessionId: payload.sid };
  } catch {
    return null;
  }
}

/** The token from an `Authorization: Bearer <token>` header, or null. */
export function getBearerToken(headers: Headers): string | null {
  const value = headers.get("authorization");
  const match = value?.match(/^Bearer\s+(\S+)$/i);
  return match ? match[1] : null;
}

/**
 * Whether a user may use the mobile app at all (checked at login, refresh and on every request):
 * - an active business owner with a business → `business` set, as in getCurrentUser();
 * - an active TEAM_MEMBER linked to an active staff record of an active business → `member` set and
 *   `business` null, so every owner route (which requires `user.business`) keeps refusing members.
 */
export async function getEligibleMobileUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      businesses: { include: { subscription: true } },
      employee: { include: { business: { include: { subscription: true } } } },
    },
  });
  if (!user || !user.isActive) return null;
  const base = { id: user.id, name: user.name, email: user.email, role: user.role };

  if (user.role === OWNER_ROLE && user.businesses.length > 0) {
    return { ...base, business: user.businesses[0], member: null };
  }
  const employee = user.employee;
  if (user.role === MEMBER_ROLE && employee && employee.isActive && employee.business.isActive) {
    return {
      ...base,
      business: null,
      member: { employeeId: employee.id, employeeName: employee.name, business: employee.business },
    };
  }
  return null;
}

export type MobileUser = NonNullable<Awaited<ReturnType<typeof getEligibleMobileUser>>>;

function isExpired(session: { expiresAt: Date; absoluteExpiresAt: Date }, now: Date) {
  return session.expiresAt <= now || session.absoluteExpiresAt <= now;
}

type DeviceInfo = { deviceName?: string | null; platform?: string | null; appVersion?: string | null };

const clip = (value: string | null | undefined, max: number) =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;

/** Starts a session for an already-authenticated, eligible user and returns the first token pair. */
export async function createMobileSession(userId: string, device: DeviceInfo = {}) {
  const now = new Date();
  const refreshToken = generateRefreshToken();
  const absoluteExpiresAt = new Date(now.getTime() + SESSION_ABSOLUTE_TTL_MS);
  const session = await prisma.mobileSession.create({
    data: {
      userId,
      refreshTokenHash: hashRefreshToken(refreshToken),
      deviceName: clip(device.deviceName, 100),
      platform: device.platform === "ios" || device.platform === "android" ? device.platform : null,
      appVersion: clip(device.appVersion, 30),
      expiresAt: new Date(Math.min(now.getTime() + REFRESH_TOKEN_TTL_MS, absoluteExpiresAt.getTime())),
      absoluteExpiresAt,
    },
  });
  return { sessionId: session.id, refreshToken, ...signAccessToken(userId, session.id) };
}

export type RotateResult =
  | {
      ok: true;
      sessionId: string;
      user: MobileUser;
      refreshToken: string;
      accessToken: string;
      accessTokenExpiresAt: Date;
    }
  /**
   * INVALID: unknown token. EXPIRED / REVOKED: session over. NOT_ELIGIBLE: user deactivated or no longer an owner.
   * RACE: the previous token, just rotated by a concurrent request; client should re-read its stored token.
   * REUSE: the previous token replayed after the grace window; the session has been revoked.
   */
  | { ok: false; reason: "INVALID" | "EXPIRED" | "REVOKED" | "NOT_ELIGIBLE" | "RACE" | "REUSE" };

/** Exchanges a refresh token for a new pair. Each refresh token works exactly once. */
export async function rotateRefreshToken(presentedToken: string): Promise<RotateResult> {
  const now = new Date();
  const presentedHash = hashRefreshToken(presentedToken);

  const session = await prisma.mobileSession.findUnique({ where: { refreshTokenHash: presentedHash } });
  if (session) {
    if (session.revokedAt) return { ok: false, reason: "REVOKED" };
    if (isExpired(session, now)) return { ok: false, reason: "EXPIRED" };

    const user = await getEligibleMobileUser(session.userId);
    if (!user) {
      await revokeMobileSession(session.id, "NOT_ELIGIBLE");
      return { ok: false, reason: "NOT_ELIGIBLE" };
    }

    const refreshToken = generateRefreshToken();
    // Atomic compare-and-swap: only the request still holding the current hash wins.
    const { count } = await prisma.mobileSession.updateMany({
      where: { id: session.id, refreshTokenHash: presentedHash, revokedAt: null },
      data: {
        refreshTokenHash: hashRefreshToken(refreshToken),
        previousTokenHash: presentedHash,
        rotatedAt: now,
        lastUsedAt: now,
        expiresAt: new Date(Math.min(now.getTime() + REFRESH_TOKEN_TTL_MS, session.absoluteExpiresAt.getTime())),
      },
    });
    if (count === 0) return { ok: false, reason: "RACE" };

    return { ok: true, sessionId: session.id, user, refreshToken, ...signAccessToken(user.id, session.id) };
  }

  const rotatedOut = await prisma.mobileSession.findUnique({ where: { previousTokenHash: presentedHash } });
  if (rotatedOut) {
    if (rotatedOut.revokedAt) return { ok: false, reason: "REVOKED" };
    if (rotatedOut.rotatedAt && now.getTime() - rotatedOut.rotatedAt.getTime() < RACE_GRACE_MS) {
      return { ok: false, reason: "RACE" };
    }
    await revokeMobileSession(rotatedOut.id, "REUSE");
    console.warn("[mobile-auth] refresh token reuse detected; session revoked", { sessionId: rotatedOut.id });
    return { ok: false, reason: "REUSE" };
  }

  return { ok: false, reason: "INVALID" };
}

/**
 * Resolves a Bearer access token to an eligible user. The session is checked on every call, so logout,
 * reuse detection and deactivation take effect immediately rather than when the 15-minute token expires.
 */
export async function authenticateMobileAccessToken(token: string) {
  const claims = verifyAccessToken(token);
  if (!claims) return null;

  const session = await prisma.mobileSession.findUnique({
    where: { id: claims.sessionId },
    select: { id: true, userId: true, revokedAt: true, expiresAt: true, absoluteExpiresAt: true },
  });
  if (!session || session.userId !== claims.userId || session.revokedAt || isExpired(session, new Date())) {
    return null;
  }

  const user = await getEligibleMobileUser(session.userId);
  return user ? { user, sessionId: session.id } : null;
}

/** Session id owning a refresh token (current or just-rotated), e.g. to rate-limit refreshes per session. */
export async function findSessionIdByRefreshToken(refreshToken: string): Promise<string | null> {
  const hash = hashRefreshToken(refreshToken);
  const session = await prisma.mobileSession.findFirst({
    where: { OR: [{ refreshTokenHash: hash }, { previousTokenHash: hash }] },
    select: { id: true },
  });
  return session?.id ?? null;
}

export async function revokeMobileSession(sessionId: string, reason: RevokeReason) {
  await prisma.mobileSession.updateMany({
    where: { id: sessionId, revokedAt: null },
    data: { revokedAt: new Date(), revokedReason: reason },
  });
}

/** Logout: revokes the session owning this refresh token (current or just-rotated). Idempotent. */
export async function revokeMobileSessionByRefreshToken(refreshToken: string) {
  const hash = hashRefreshToken(refreshToken);
  const { count } = await prisma.mobileSession.updateMany({
    where: { OR: [{ refreshTokenHash: hash }, { previousTokenHash: hash }], revokedAt: null },
    data: { revokedAt: new Date(), revokedReason: "LOGOUT" },
  });
  return count > 0;
}

/** Signs a user out of every device, e.g. after a password change or deactivation. */
export async function revokeAllMobileSessions(userId: string, reason: RevokeReason) {
  const { count } = await prisma.mobileSession.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date(), revokedReason: reason },
  });
  return count;
}

// ---- Web hand-off: open a web panel page inside the app with the app's session ----

const WEB_HANDOFF_TYPE = "web-handoff";
const WEB_HANDOFF_TTL_SECONDS = 60;

/** Short-lived code (60 s) that turns into a normal web session cookie once, for the signed-in owner. */
export function signWebHandoff(userId: string) {
  return jwt.sign({ typ: WEB_HANDOFF_TYPE, jti: crypto.randomBytes(16).toString("hex") }, getMobileJwtSecret(), {
    algorithm: JWT_ALGORITHM,
    expiresIn: WEB_HANDOFF_TTL_SECONDS,
    issuer: ISSUER,
    audience: AUDIENCE,
    subject: userId,
  });
}

export function verifyWebHandoff(code: string): { userId: string; jti: string } | null {
  const secret = getMobileJwtSecret();
  try {
    const payload = jwt.verify(code, secret, { algorithms: [JWT_ALGORITHM], issuer: ISSUER, audience: AUDIENCE });
    if (typeof payload !== "object" || payload.typ !== WEB_HANDOFF_TYPE) return null;
    if (typeof payload.sub !== "string" || typeof payload.jti !== "string") return null;
    return { userId: payload.sub, jti: payload.jti };
  } catch {
    return null;
  }
}
