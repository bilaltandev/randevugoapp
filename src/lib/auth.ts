import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { cookies, headers } from "next/headers";
import prisma from "./prisma";
import { authenticateMobileAccessToken, getBearerToken } from "./mobileAuth";

export const SESSION_COOKIE_NAME = "randevugo_session";

const JWT_ALGORITHM = "HS256";
const MIN_JWT_SECRET_LENGTH = 32;

// Read lazily so `next build` doesn't need the secret; fail loudly (never with a fallback) at first use.
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(`JWT_SECRET is missing or shorter than ${MIN_JWT_SECRET_LENGTH} characters.`);
  }
  return secret;
}

export interface SessionPayload {
  userId: string;
  email: string;
  role: string;
  businessId?: string;
  businessSlug?: string;
  /** Password stamp at sign-in (see passwordStamp); set by setSessionCookie. */
  pwd?: string;
}

/**
 * Short keyed fingerprint of the stored password hash. Web sessions carry it, so changing or resetting a
 * password ends every existing web session without a session table. Keyed with the JWT secret so the
 * cookie reveals nothing about the hash.
 */
function passwordStamp(passwordHash: string): string {
  return crypto.createHmac("sha256", getJwtSecret()).update(passwordHash, "utf8").digest("base64url").slice(0, 16);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: SessionPayload): string {
  return jwt.sign(payload, getJwtSecret(), { algorithm: JWT_ALGORITHM, expiresIn: "30d" });
}

export function verifyToken(token: string): SessionPayload | null {
  // Outside the try: a misconfigured secret must surface as an error, not as a silent logout.
  const secret = getJwtSecret();
  try {
    return jwt.verify(token, secret, { algorithms: [JWT_ALGORITHM] }) as SessionPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  // Mobile app: an `Authorization: Bearer` header switches to mobile access tokens only. The cookie is then
  // ignored entirely (no fallback), so one request can never mix the two credentials. Browsers never send
  // this header on their own, so the web cookie flow below is unchanged.
  const authorization = (await headers()).get("authorization");
  if (authorization && /^bearer\b/i.test(authorization)) {
    const token = getBearerToken(new Headers({ authorization }));
    if (!token) return null;
    try {
      const auth = await authenticateMobileAccessToken(token);
      return auth ? auth.user : null;
    } catch (error) {
      // e.g. MOBILE_JWT_SECRET not configured: deny instead of failing the whole request.
      console.error("[auth] mobile bearer authentication unavailable", { name: (error as Error)?.name });
      return null;
    }
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload || !payload.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      businesses: {
        include: {
          subscription: true,
        },
      },
    },
  });

  // A deactivated account loses every existing session immediately, not when its token expires,
  // and so does a session signed in with a password that has since been changed or reset.
  if (!user || !user.isActive) return null;
  if (payload.pwd !== passwordStamp(user.password)) return null;
  // Team members use the mobile app only (web login refuses them); never give them a web session.
  if (user.role === "TEAM_MEMBER") return null;

  const activeBusiness = user.businesses[0] || null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    business: activeBusiness,
  };
}

export async function setSessionCookie(payload: SessionPayload) {
  const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { password: true } });
  if (!user) throw new Error("Cannot start a session for an unknown user.");
  const token = signToken({ ...payload, pwd: passwordStamp(user.password) });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
