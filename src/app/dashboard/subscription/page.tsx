import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getActiveRedemption } from "@/lib/coupons";
import { daysUntil, subscriptionAccess } from "@/lib/subscriptionAccess";
import { bankDetails, paymentReference, planPrice } from "@/lib/subscriptionPayments";
import { getUsdTryRate } from "@/lib/exchangeRate";
import { BILLING_PERIODS, PLANS, type BillingPeriod, type Plan } from "@/lib/plans";
import SubscriptionClient from "./SubscriptionClient";

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await getCurrentUser();
  if (!user || !user.business) return null;
  const businessId = user.business.id;

  const [subscription, activeRedemption, params, rate] = await Promise.all([
    prisma.subscription.findUnique({ where: { businessId } }),
    getActiveRedemption(businessId),
    searchParams,
    getUsdTryRate(),
  ]);
  const prices = Object.fromEntries(
    PLANS.map((plan) => [plan, Object.fromEntries(BILLING_PERIODS.map((period) => [period, planPrice(subscription, plan, period)]))])
  ) as Record<Plan, Record<BillingPeriod, number>>;
  const access = subscriptionAccess(subscription);

  return (
    <div className="space-y-6">
      <SubscriptionClient
        // Right after sign-up: plan cards first, "3 gün ücretsiz deneyin" under them.
        welcome={params.hosgeldin === "1" && access.active && access.kind === "trial"}
        initialSubscription={subscription ? JSON.parse(JSON.stringify(subscription)) : null}
        access={access.active ? { active: true, kind: access.kind, endsAt: access.endsAt?.toISOString() ?? null } : { active: false }}
        daysLeft={access.active ? daysUntil(access.endsAt) : 0}
        bank={bankDetails()}
        prices={prices}
        rate={rate}
        reference={paymentReference(businessId)}
        initialActiveDiscount={
          activeRedemption
            ? {
                code: activeRedemption.coupon.code,
                percentOff: activeRedemption.percentOff,
                monthsRemaining: activeRedemption.monthsRemaining,
              }
            : null
        }
      />
    </div>
  );
}
