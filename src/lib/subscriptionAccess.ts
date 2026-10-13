// Whether a business may use the product right now: during the trial or a paid period, nothing else.
// When it may not, the owner and team members can only see the subscription page, and customers can't book.
//
// Worked out from the dates every time (never only the stored `status`), so an expired trial locks at once
// even if nobody opened the subscription page to flip the status.
import { NextResponse } from "next/server";

type SubscriptionDates = {
  status: string;
  trialEndDate: Date | string | null;
  subscriptionEndDate?: Date | string | null;
} | null | undefined;

export type SubscriptionAccess =
  | { active: true; kind: "trial" | "paid"; endsAt: Date | null }
  | { active: false; kind: "expired" };

export function subscriptionAccess(subscription: SubscriptionDates, now = new Date()): SubscriptionAccess {
  if (!subscription) return { active: false, kind: "expired" };
  if (subscription.status === "active") {
    const end = subscription.subscriptionEndDate ? new Date(subscription.subscriptionEndDate) : null;
    if (!end || end > now) return { active: true, kind: "paid", endsAt: end };
    return { active: false, kind: "expired" };
  }
  if (subscription.status === "trial" && subscription.trialEndDate) {
    const end = new Date(subscription.trialEndDate);
    if (end > now) return { active: true, kind: "trial", endsAt: end };
  }
  return { active: false, kind: "expired" };
}

/** Whole days left until `endsAt` (0 when past or unknown). */
export function daysUntil(endsAt: Date | null | undefined, now = new Date()): number {
  return endsAt ? Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))) : 0;
}

export const SUBSCRIPTION_REQUIRED = "SUBSCRIPTION_REQUIRED";

/** 402 for owner/member actions while the business has no trial or paid period left; null when allowed. */
export function subscriptionLock(subscription: SubscriptionDates): NextResponse | null {
  if (subscriptionAccess(subscription).active) return null;
  return NextResponse.json(
    {
      error: "Deneme süreniz veya aboneliğiniz sona erdi. Devam etmek için bir paket satın alın.",
      code: SUBSCRIPTION_REQUIRED,
    },
    { status: 402 }
  );
}
