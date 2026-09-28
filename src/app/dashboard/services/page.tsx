import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import ServicesClient from "./ServicesClient";

export default async function ServicesPage() {
  const user = await getCurrentUser();
  if (!user || !user.business) return null;

  const services = await prisma.service.findMany({
    where: { businessId: user.business.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <ServicesClient
        businessId={user.business.id}
        businessSector={user.business.sector}
        initialServices={services}
      />
    </div>
  );
}
