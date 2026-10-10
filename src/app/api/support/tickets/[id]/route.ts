import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSupportAgent, isValidOption, TICKET_PRIORITIES, TICKET_STATUSES } from "@/lib/support";

// Support agent: change status / priority, take over or release a ticket
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const body = await req.json();
    const data: {
      status?: string;
      priority?: string;
      assignedToId?: string | null;
      assignedToName?: string | null;
    } = {};

    if (body.status !== undefined) {
      if (!isValidOption(TICKET_STATUSES, body.status)) {
        return NextResponse.json({ error: "Geçersiz durum." }, { status: 400 });
      }
      data.status = body.status;
    }

    if (body.priority !== undefined) {
      if (!isValidOption(TICKET_PRIORITIES, body.priority)) {
        return NextResponse.json({ error: "Geçersiz öncelik." }, { status: 400 });
      }
      data.priority = body.priority;
    }

    if (body.assign === "me") {
      data.assignedToId = agent.id;
      data.assignedToName = agent.name;
      if (ticket.status === "OPEN" && !data.status) data.status = "IN_PROGRESS";
    } else if (body.assign === "none") {
      data.assignedToId = null;
      data.assignedToName = null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Güncellenecek alan yok." }, { status: 400 });
    }

    const updated = await prisma.supportTicket.update({ where: { id }, data });
    return NextResponse.json({ success: true, ticket: updated });
  } catch (error: unknown) {
    console.error("Support ticket update error:", error);
    return NextResponse.json({ error: "Talep güncellenirken bir hata oluştu." }, { status: 500 });
  }
}
