import type { MobileUser } from "@/lib/mobileAuth";
import { onFreeTier, planOf } from "@/lib/plans";
import { subscriptionAccess } from "@/lib/subscriptionAccess";
import type { RateLimitResult } from "@/lib/rateLimit";

// Shared response helpers for /api/mobile/auth/*. Not a route (only route.ts files are routes).

const NO_STORE = { "Cache-Control": "no-store" };

/** JSON response that is never cached: every mobile auth response may carry tokens or account state. */
export function mobileJson(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { ...NO_STORE, ...headers } });
}

export function tooManyRequests(limit: RateLimitResult) {
  return mobileJson(
    { error: "Çok fazla deneme yaptınız. Lütfen biraz sonra tekrar deneyin.", code: "RATE_LIMITED" },
    429,
    { "Retry-After": String(limit.retryAfterSeconds) }
  );
}

export function serverError() {
  return mobileJson({ error: "Beklenmeyen bir hata oluştu.", code: "SERVER_ERROR" }, 500);
}

/** Logs only the error class/code; Prisma and JWT messages can echo request data. */
export function logMobileAuthError(route: string, error: unknown) {
  const e = error as { name?: string; code?: string } | null;
  console.error(`[mobile-auth] ${route} failed`, { name: e?.name ?? "Error", code: e?.code });
}

/** Reads a JSON object body; anything else (invalid JSON, arrays, primitives) becomes null. */
export async function readJsonObject(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/**
 * The profile a mobile client may see: no password hash, no internal flags. A team member gets their
 * business here too (for its name and plan) plus `member`, which tells the app to show the member view.
 */
export function toMobileProfile(user: MobileUser) {
  const business = user.business ?? user.member!.business;
  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    member: user.member ? { employeeId: user.member.employeeId, employeeName: user.member.employeeName } : null,
    business: {
      id: business.id,
      name: business.name,
      slug: business.slug,
      sector: business.sector,
      logo: business.logo,
      isActive: business.isActive,
      subscription: business.subscription
        ? {
            status: business.subscription.status,
            planType: business.subscription.planType,
            plan: planOf(business.subscription),
            trialEndDate: business.subscription.trialEndDate,
            subscriptionEndDate: business.subscription.subscriptionEndDate,
            // False when the app should show only the lock screen: a closed account, or a team member
            // whose business dropped to the free tier (it has no team).
            active: subscriptionAccess(business.subscription).active && !(user.member && onFreeTier(business.subscription)),
            // The free plan: the app shows ads.
            free: onFreeTier(business.subscription),
          }
        : null,
    },
  };
}
