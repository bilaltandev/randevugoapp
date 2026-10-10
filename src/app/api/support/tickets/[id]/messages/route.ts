import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSupportAgent, MAX_MESSAGE_LENGTH } from "@/lib/support";

// Support agent reply
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const agent = await getSupportAgent();
    if (!agent) {
      return NextResponse.json({ error: "Bu işlem için yetkili girişi gerekir." }, { status: 403 });
    }

    const { id } = await params;
    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
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

    const [message] = await prisma.$transaction([
      prisma.supportMessage.create({
        data: {
          ticketId: id,
          authorId: agent.id,
          authorName: agent.name,
          authorRole: "SUPPORT",
          body: text,
        },
      }),
      // Replying to an unclaimed ticket claims it; the update also bumps updatedAt for list ordering.
      prisma.supportTicket.update({
        where: { id },
        data: {
          status: ticket.status === "OPEN" ? "IN_PROGRESS" : ticket.status,
          assignedToId: ticket.assignedToId ?? agent.id,
          assignedToName: ticket.assignedToId ? ticket.assignedToName : agent.name,
        },
      }),
      // Let the owner see the reply in their notification bell.
      prisma.notification.create({
        data: {
          businessId: ticket.businessId,
          title: "Destek talebinize yanıt geldi",
          message: `"${ticket.subject}" konulu talebinize destek ekibi yanıt verdi.`,
          type: "SYSTEM",
        },
      }),
    ]);

    return NextResponse.json({ success: true, message });
  } catch (error: unknown) {
    console.error("Support reply error:", error);
    return NextResponse.json({ error: "Yanıt gönderilirken bir hata oluştu." }, { status: 500 });
  }
}
