import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { MAX_MESSAGE_LENGTH } from "@/lib/support";

async function getOwnTicket(id: string) {
  const user = await getCurrentUser();
  if (!user || !user.business) return { user: null, ticket: null };
  const ticket = await prisma.supportTicket.findFirst({
    where: { id, businessId: user.business.id },
  });
  return { user, ticket };
}

// Business owner: one own ticket with its conversation (same fields as the web ticket page)
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.business) {
      return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
    }
    const { id } = await params;
    const ticket = await prisma.supportTicket.findFirst({
      where: { id, businessId: user.business.id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!ticket) {
      return NextResponse.json({ error: "Destek talebi bulunamadı." }, { status: 404 });
    }

    return NextResponse.json({
      ticket: {
        id: ticket.id,
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        createdAt: ticket.createdAt.toISOString(),
        assignedToName: ticket.assignedToName,
      },
      messages: ticket.messages.map((m) => ({
        id: m.id,
        authorName: m.authorName,
        authorRole: m.authorRole,
        body: m.body,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (error: unknown) {
    console.error("Get ticket error:", error);
    return NextResponse.json({ error: "Destek talebi alınırken bir hata oluştu." }, { status: 500 });
  }
}

// Business owner reply; a reply on a resolved/closed ticket reopens it
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { user, ticket } = await getOwnTicket(id);
    if (!user) {
      return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
    }
    if (!ticket) {
      return NextResponse.json({ error: "Destek talebi bulunamadı." }, { status: 404 });
    }

    const { body } = await req.json();
    const text = typeof body === "string" ? body.trim() : "";
    if (!text) {
      return NextResponse.json({ error: "Mesaj boş olamaz." }, { status: 400 });
    }
    if (text.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ error: `Mesaj en fazla ${MAX_MESSAGE_LENGTH} karakter olabilir.` }, { status: 400 });
    }

    const reopen = ticket.status === "RESOLVED" || ticket.status === "CLOSED";
    const [message] = await prisma.$transaction([
      prisma.supportMessage.create({
        data: {
          ticketId: id,
          authorId: user.id,
          authorName: user.name,
          authorRole: "OWNER",
          body: text,
        },
      }),
      prisma.supportTicket.update({
        where: { id },
        data: { status: reopen ? (ticket.assignedToId ? "IN_PROGRESS" : "OPEN") : ticket.status },
      }),
    ]);

    return NextResponse.json({ success: true, message });
  } catch (error: unknown) {
    console.error("Ticket reply error:", error);
    return NextResponse.json({ error: "Mesaj gönderilirken bir hata oluştu." }, { status: 500 });
  }
}

// Business owner closes their own ticket
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { user, ticket } = await getOwnTicket(id);
    if (!user) {
      return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
    }
    if (!ticket) {
      return NextResponse.json({ error: "Destek talebi bulunamadı." }, { status: 404 });
    }

    const { status } = await req.json();
    if (status !== "CLOSED") {
      return NextResponse.json({ error: "Talep yalnızca kapatılabilir." }, { status: 400 });
    }

    const updated = await prisma.supportTicket.update({ where: { id }, data: { status: "CLOSED" } });
    return NextResponse.json({ success: true, ticket: updated });
  } catch (error: unknown) {
    console.error("Ticket close error:", error);
    return NextResponse.json({ error: "Talep kapatılırken bir hata oluştu." }, { status: 500 });
  }
}
