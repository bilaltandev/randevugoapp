import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import OwnerTicketClient from "./OwnerTicketClient";

export const dynamic = "force-dynamic";

export default async function OwnerTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !user.business) return null;

  const { id } = await params;
  const ticket = await prisma.supportTicket.findFirst({
    where: { id, businessId: user.business.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!ticket) notFound();

  return (
    <OwnerTicketClient
      ticket={{
        id: ticket.id,
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        createdAt: ticket.createdAt.toISOString(),
        assignedToName: ticket.assignedToName,
      }}
      messages={ticket.messages.map((m) => ({
        id: m.id,
        authorName: m.authorName,
        authorRole: m.authorRole,
        body: m.body,
        createdAt: m.createdAt.toISOString(),
      }))}
    />
  );
}
