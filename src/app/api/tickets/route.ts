import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  isValidOption,
  MAX_MESSAGE_LENGTH,
  MAX_SUBJECT_LENGTH,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
} from "@/lib/support";

// Business owner: own tickets, newest activity first (same fields as the web support page)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.business) {
      return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
    }

    const tickets = await prisma.supportTicket.findMany({
      where: { businessId: user.business.id },
      include: {
        _count: { select: { messages: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { authorRole: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      tickets: tickets.map((t) => ({
        id: t.id,
        subject: t.subject,
        category: t.category,
        priority: t.priority,
        status: t.status,
        updatedAt: t.updatedAt.toISOString(),
        messageCount: t._count.messages,
        awaitingOwner: t.messages[0]?.authorRole === "SUPPORT" && t.status !== "CLOSED",
      })),
    });
  } catch (error: unknown) {
    console.error("List tickets error:", error);
    return NextResponse.json({ error: "Destek talepleri alınırken bir hata oluştu." }, { status: 500 });
  }
}

// Business owner: open a new support ticket with its first message
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.business) {
      return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
    }

    const body = await req.json();
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const category = isValidOption(TICKET_CATEGORIES, body.category) ? body.category : "GENERAL";
    const priority = isValidOption(TICKET_PRIORITIES, body.priority) ? body.priority : "NORMAL";

    if (!subject || !message) {
      return NextResponse.json({ error: "Konu ve mesaj zorunludur." }, { status: 400 });
    }
    if (subject.length > MAX_SUBJECT_LENGTH) {
      return NextResponse.json({ error: `Konu en fazla ${MAX_SUBJECT_LENGTH} karakter olabilir.` }, { status: 400 });
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ error: `Mesaj en fazla ${MAX_MESSAGE_LENGTH} karakter olabilir.` }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        businessId: user.business.id,
        subject,
        category,
        priority,
        messages: {
          create: {
            authorId: user.id,
            authorName: user.name,
            authorRole: "OWNER",
            body: message,
          },
        },
      },
    });

    return NextResponse.json({ success: true, ticket });
  } catch (error: unknown) {
    console.error("Create ticket error:", error);
    return NextResponse.json({ error: "Destek talebi oluşturulurken bir hata oluştu." }, { status: 500 });
  }
}
