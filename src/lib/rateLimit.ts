import crypto from "crypto";
import prisma from "./prisma";

/**
 * Fixed-window rate limiting backed by the AuthRateLimit table, so limits hold across serverless instances.
 * Each hit is a single atomic upsert (no read-then-write race): the window resets in the same statement.
 */

export type RateLimitPolicy = { limit: number; windowSeconds: number };

export const RATE_LIMITS = {
  /** Every mobile login attempt from one client IP (generous: mobile carriers share IPs via CGNAT). */
  mobileLoginIp: { limit: 50, windowSeconds: 15 * 60 },
  /** Mobile login attempts per account; cleared on a successful login, so it effectively counts failures. */
  mobileLoginEmail: { limit: 5, windowSeconds: 15 * 60 },
  /** Token refreshes per mobile session. */
  mobileRefresh: { limit: 30, windowSeconds: 60 },
  /** Refresh/logout calls per IP with a token that matches no session (guessing or stale clients). */
  mobileUnknownTokenIp: { limit: 60, windowSeconds: 60 },
  /** Team invite page lookups and accept attempts per client IP (links are unguessable; this caps abuse). */
  teamInviteIp: { limit: 30, windowSeconds: 15 * 60 },
  /** Invite e-mails one business may send (Gmail caps the whole account at ~500 a day). */
  teamInviteEmail: { limit: 20, windowSeconds: 60 * 60 },
} satisfies Record<string, RateLimitPolicy>;

export type RateLimitResult = { allowed: boolean; count: number; retryAfterSeconds: number };

/** Records one hit for `key` and reports whether it is within `policy`. */
export async function hitRateLimit(key: string, policy: RateLimitPolicy): Promise<RateLimitResult> {
  const rows = await prisma.$queryRaw<{ count: number; windowStart: Date }[]>`
    INSERT INTO "AuthRateLimit" ("key", "count", "windowStart")
    VALUES (${key}, 1, now())
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "AuthRateLimit"."windowStart" <= now() - make_interval(secs => ${policy.windowSeconds}) THEN 1
        ELSE "AuthRateLimit"."count" + 1 END,
      "windowStart" = CASE
        WHEN "AuthRateLimit"."windowStart" <= now() - make_interval(secs => ${policy.windowSeconds}) THEN now()
        ELSE "AuthRateLimit"."windowStart" END
    RETURNING "count", "windowStart"`;
  const { count, windowStart } = rows[0];

  // Occasionally drop long-expired rows so the table stays small; failures here never block a request.
  if (Math.random() < 0.01) void pruneRateLimits().catch(() => {});

  const windowEndsAt = windowStart.getTime() + policy.windowSeconds * 1000;
  return {
    allowed: count <= policy.limit,
    count,
    retryAfterSeconds: Math.max(1, Math.ceil((windowEndsAt - Date.now()) / 1000)),
  };
}

export async function resetRateLimit(key: string) {
  await prisma.authRateLimit.deleteMany({ where: { key } });
}

/** Deletes counters whose window ended more than a day ago (longer than any policy window). */
export async function pruneRateLimits() {
  await prisma.authRateLimit.deleteMany({ where: { windowStart: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } });
}

/** Keys never contain raw emails: the address is normalized and hashed. */
export function rateLimitKey(scope: string, kind: "ip" | "email" | "session" | "business", value: string) {
  const v = kind === "email" ? crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex") : value;
  return `${scope}:${kind}:${v}`;
}

/**
 * Client IP for rate limiting. Proxy headers are trusted only on Vercel, whose edge overwrites them;
 * anywhere else they are client-controlled, so every request shares one "unknown" bucket.
 * IPv6 addresses are grouped by /64, since one client usually controls a whole /64.
 */
export function getClientIp(headers: Headers): string {
  if (!process.env.VERCEL) return "unknown";
  const raw = headers.get("x-real-ip") || headers.get("x-forwarded-for")?.split(",")[0];
  const ip = raw?.trim();
  if (!ip) return "unknown";
  if (!ip.includes(":")) return ip;
  // IPv4-mapped IPv6 (::ffff:1.2.3.4) is really the IPv4 address.
  const mapped = ip.match(/:(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (mapped) return mapped[1];
  return ipv6Prefix64(ip);
}

function ipv6Prefix64(ip: string): string {
  const [head, tail] = ip.toLowerCase().split("::");
  const h = head ? head.split(":") : [];
  const t = tail ? tail.split(":") : [];
  const groups = tail === undefined ? h : [...h, ...Array(Math.max(0, 8 - h.length - t.length)).fill("0"), ...t];
  return groups.slice(0, 4).map((g) => parseInt(g || "0", 16).toString(16)).join(":") + "::/64";
}
