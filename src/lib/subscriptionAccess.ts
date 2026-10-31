// Whether a business may use the product right now. A trial or paid period gives everything; once it ends the
// business drops to the free tier (limited bookings, see freeTier.ts) rather than being locked out. Only a
// cancelled or missing subscription locks: the owner can then see just the subscription page.
//
// Worked out from the dates every time (never only the stored `status`), so an expired trial drops at once
// even if nobody opened the subscription page to flip the status.
import { NextResponse } from "next/server";
import { onFreeTier } from "@/lib/plans";

type SubscriptionDates = {
  status: string;
  trialEndDate: Date | string | null;
  subscriptionEndDate?: Date | string | null;
} | null | undefined;

export type SubscriptionAccess =
  | { active: true; kind: "trial" | "paid" | "free"; endsAt: Date | null }
  | { active: false; kind: "expired" };

export function subscriptionAccess(subscription: SubscriptionDates, now = new Date()): SubscriptionAccess {
  if (!subscription) return { active: false, kind: "expired" };
  if (onFreeTier(subscription, now)) return { active: true, kind: "free", endsAt: null };
  if (subscription.status === "active") {
    return { active: true, kind: "paid", endsAt: subscription.subscriptionEndDate ? new Date(subscription.subscriptionEndDate) : null };
  }
  if (subscription.status === "trial" && subscription.trialEndDate) {
    return { active: true, kind: "trial", endsAt: new Date(subscription.trialEndDate) };
  }
  return { active: false, kind: "expired" };
}

/** Whole days left until `endsAt` (0 when past or unknown). */
export function daysUntil(endsAt: Date | null | undefined, now = new Date()): number {
  return endsAt ? Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))) : 0;
}

export const SUBSCRIPTION_REQUIRED = "SUBSCRIPTION_REQUIRED";

/** 402 for owner/member actions while the business is closed; null when allowed. */
export function subscriptionLock(subscription: SubscriptionDates): NextResponse | null {
  if (subscriptionAccess(subscription).active) return null;
  return NextResponse.json(
    {
      error: "Aboneliğiniz kapalı. Devam etmek için bir paket satın alın.",
      code: SUBSCRIPTION_REQUIRED,
    },
    { status: 402 }
  );
}
