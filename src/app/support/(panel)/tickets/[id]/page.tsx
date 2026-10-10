import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSupportAgent } from "@/lib/support";
import SupportTicketClient from "./SupportTicketClient";

export const dynamic = "force-dynamic";

export default async function SupportTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const agent = await getSupportAgent();
  if (!agent) return null;

  const { id } = await params;
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      business: {
        select: {
          id: true,
          name: true,
          slug: true,
          sector: true,
          phone: true,
          isActive: true,
          user: { select: { name: true, email: true, phone: true } },
          subscription: { select: { status: true, trialEndDate: true, subscriptionEndDate: true } },
        },
      },
    },
  });
  if (!ticket) notFound();

  const sub = ticket.business.subscription;
  return (
    <SupportTicketClient
      agentId={agent.id}
      ticket={{
        id: ticket.id,
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        createdAt: ticket.createdAt.toISOString(),
        assignedToId: ticket.assignedToId,
        assignedToName: ticket.assignedToName,
      }}
      business={{
        id: ticket.business.id,
        name: ticket.business.name,
        slug: ticket.business.slug,
        sector: ticket.business.sector,
        phone: ticket.business.phone,
        isActive: ticket.business.isActive,
        ownerName: ticket.business.user.name,
        ownerEmail: ticket.business.user.email,
        ownerPhone: ticket.business.user.phone,
        subscriptionStatus: sub?.status ?? null,
        subscriptionEnd: (sub?.status === "active" ? sub.subscriptionEndDate : sub?.trialEndDate)?.toISOString() ?? null,
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
