import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import SupportClient from "./SupportClient";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const user = await getCurrentUser();
  if (!user || !user.business) return null;

  const tickets = await prisma.supportTicket.findMany({
    where: { businessId: user.business.id },
    include: {
      _count: { select: { messages: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { authorRole: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <SupportClient
      tickets={tickets.map((t) => ({
        id: t.id,
        subject: t.subject,
        category: t.category,
        priority: t.priority,
        status: t.status,
        updatedAt: t.updatedAt.toISOString(),
        messageCount: t._count.messages,
        awaitingOwner: t.messages[0]?.authorRole === "SUPPORT" && t.status !== "CLOSED",
      }))}
    />
  );
}
