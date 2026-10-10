import prisma from "@/lib/prisma";
import { getSupportAgent } from "@/lib/support";
import TicketQueueClient from "./TicketQueueClient";

export const dynamic = "force-dynamic";

export default async function SupportTicketsPage() {
  const agent = await getSupportAgent();
  if (!agent) return null;

  const tickets = await prisma.supportTicket.findMany({
    include: {
      business: { select: { id: true, name: true, user: { select: { name: true } } } },
      _count: { select: { messages: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { authorRole: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 500,
  });

  return (
    <TicketQueueClient
      agentId={agent.id}
      tickets={tickets.map((t) => ({
        id: t.id,
        subject: t.subject,
        category: t.category,
        priority: t.priority,
        status: t.status,
        updatedAt: t.updatedAt.toISOString(),
        businessName: t.business.name,
        ownerName: t.business.user.name,
        assignedToId: t.assignedToId,
        assignedToName: t.assignedToName,
        messageCount: t._count.messages,
        awaitingSupport: t.messages[0]?.authorRole === "OWNER" && (t.status === "OPEN" || t.status === "IN_PROGRESS"),
      }))}
    />
  );
}
