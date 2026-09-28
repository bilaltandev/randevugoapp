import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import CustomersClient from "./CustomersClient";

export default async function CustomersPage() {
  const user = await getCurrentUser();
  if (!user || !user.business) return null;

  const customers = await prisma.customer.findMany({
    where: { businessId: user.business.id },
    include: {
      appointments: {
        orderBy: { date: "desc" },
        take: 3,
        include: { service: true },
      },
    },
    orderBy: { totalSpent: "desc" },
  });

  return (
    <div className="space-y-6">
      <CustomersClient
        businessId={user.business.id}
        initialCustomers={customers}
      />
    </div>
  );
}
