import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import SubscriptionClient from "./SubscriptionClient";

export default async function SubscriptionPage() {
  const user = await getCurrentUser();
  if (!user || !user.business) return null;

  const subscription = await prisma.subscription.findUnique({
    where: { businessId: user.business.id },
  });

  return (
    <div className="space-y-6">
      <SubscriptionClient
        business={user.business}
        initialSubscription={subscription}
      />
    </div>
  );
}
