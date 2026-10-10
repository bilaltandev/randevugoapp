import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { DEFAULT_MONTHLY_PRICE, getActiveRedemption } from "@/lib/coupons";
import SubscriptionClient from "./SubscriptionClient";

export default async function SubscriptionPage() {
  const user = await getCurrentUser();
  if (!user || !user.business) return null;

  const subscription = await prisma.subscription.findUnique({
    where: { businessId: user.business.id },
  });
  const activeRedemption = await getActiveRedemption(user.business.id);

  return (
    <div className="space-y-6">
      <SubscriptionClient
        business={user.business}
        initialSubscription={subscription}
        basePrice={subscription?.monthlyPrice ?? DEFAULT_MONTHLY_PRICE}
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
