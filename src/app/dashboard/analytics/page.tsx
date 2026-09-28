import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import AnalyticsClient from "./AnalyticsClient";

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user || !user.business) return null;

  const businessId = user.business.id;

  const appointments = await prisma.appointment.findMany({
    where: { businessId },
    include: { service: true, employee: true },
  });

  const customers = await prisma.customer.findMany({
    where: { businessId },
  });

  return (
    <div className="space-y-6">
      <AnalyticsClient
        business={user.business}
        appointments={appointments}
        customers={customers}
      />
    </div>
  );
}
