import prisma from "@/lib/prisma";
import { getSupportAgent } from "@/lib/support";
import BusinessDirectoryClient from "./BusinessDirectoryClient";

export const dynamic = "force-dynamic";

export default async function SupportBusinessesPage() {
  const agent = await getSupportAgent();
  if (!agent) return null;

  const businesses = await prisma.business.findMany({
    select: {
      id: true,
      name: true,
      sector: true,
      phone: true,
      city: true,
      isActive: true,
      user: { select: { name: true, email: true, phone: true } },
      subscription: { select: { status: true } },
      _count: { select: { supportTickets: { where: { status: { in: ["OPEN", "IN_PROGRESS"] } } } } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <BusinessDirectoryClient
      businesses={businesses.map((b) => ({
        id: b.id,
        name: b.name,
        sector: b.sector,
        phone: b.phone,
        city: b.city,
        isActive: b.isActive,
        ownerName: b.user.name,
        ownerEmail: b.user.email,
        ownerPhone: b.user.phone,
        subscriptionStatus: b.subscription?.status ?? null,
        openTickets: b._count.supportTickets,
      }))}
    />
  );
}
