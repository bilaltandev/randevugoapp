import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { AGENT_SELECT, getSuperAdmin, MIN_AGENT_PASSWORD_LENGTH, SUPPORT_ROLE } from "@/lib/support";

async function findAgent(id: string) {
  const agent = await prisma.user.findUnique({ where: { id } });
  return agent && agent.role === SUPPORT_ROLE ? agent : null;
}

// Activate / deactivate an agent or set a new password
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getSuperAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Sadece yöneticiler erişebilir." }, { status: 403 });
    }

    const { id } = await params;
    const agent = await findAgent(id);
    if (!agent) {
      return NextResponse.json({ error: "Yetkili bulunamadı." }, { status: 404 });
    }

    const body = await req.json();
    const data: { isActive?: boolean; password?: string } = {};
    const changes: string[] = [];

    if (typeof body.isActive === "boolean" && body.isActive !== agent.isActive) {
      data.isActive = body.isActive;
      changes.push(body.isActive ? "hesap aktifleştirildi" : "hesap pasife alındı");
    }

    if (body.password !== undefined) {
      if (typeof body.password !== "string" || body.password.length < MIN_AGENT_PASSWORD_LENGTH) {
        return NextResponse.json(
          { error: `Şifre en az ${MIN_AGENT_PASSWORD_LENGTH} karakter olmalıdır.` },
          { status: 400 }
        );
      }
      data.password = await hashPassword(body.password);
      changes.push("şifre sıfırlandı");
    }

    if (changes.length === 0) {
      return NextResponse.json({ error: "Güncellenecek alan yok." }, { status: 400 });
    }

    const updated = await prisma.user.update({ where: { id }, data, select: AGENT_SELECT });

    await createAuditLog({
      adminEmail: admin.email,
      adminName: admin.name,
      action: "SUPPORT_AGENT_UPDATE",
      target: updated.name,
      targetId: updated.id,
      details: `Yetkili (${updated.email}): ${changes.join(", ")}.`,
    });

    return NextResponse.json({ success: true, agent: updated });
  } catch (error: unknown) {
    console.error("Update support agent error:", error);
    return NextResponse.json({ error: "Yetkili güncellenirken bir hata oluştu." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getSuperAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Sadece yöneticiler erişebilir." }, { status: 403 });
    }

    const { id } = await params;
    const agent = await findAgent(id);
    if (!agent) {
      return NextResponse.json({ error: "Yetkili bulunamadı." }, { status: 404 });
    }

    // Free their tickets so they go back to the shared queue; past messages keep the author name.
    await prisma.$transaction([
      prisma.supportTicket.updateMany({
        where: { assignedToId: id },
        data: { assignedToId: null, assignedToName: null },
      }),
      prisma.user.delete({ where: { id } }),
    ]);

    await createAuditLog({
      adminEmail: admin.email,
      adminName: admin.name,
      action: "SUPPORT_AGENT_DELETE",
      target: agent.name,
      targetId: agent.id,
      oldValue: agent.email,
      details: `Yetkili hesabı silindi: ${agent.email}`,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Delete support agent error:", error);
    return NextResponse.json({ error: "Yetkili silinirken bir hata oluştu." }, { status: 500 });
  }
}
