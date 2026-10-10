import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import prisma from "./prisma";

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

  // A deactivated account loses every existing session immediately, not when its token expires.
  if (!user || !user.isActive) return null;

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
  const token = signToken(payload);
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
