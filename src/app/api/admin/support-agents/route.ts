import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { WEAK_PASSWORD, isStrongPassword } from "@/lib/passwordPolicy";
import { AGENT_SELECT, getSuperAdmin, SUPPORT_ROLE } from "@/lib/support";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  const admin = await getSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Sadece yöneticiler erişebilir." }, { status: 403 });
  }

  const agents = await prisma.user.findMany({
    where: { role: SUPPORT_ROLE },
    select: AGENT_SELECT,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ agents });
}

// Create a support agent
export async function POST(req: Request) {
  try {
    const admin = await getSuperAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Sadece yöneticiler erişebilir." }, { status: 403 });
    }

    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!name) {
      return NextResponse.json({ error: "Ad soyad zorunludur." }, { status: 400 });
    }
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "Geçerli bir e-posta adresi girin." }, { status: 400 });
    }
    if (!isStrongPassword(password)) {
      return NextResponse.json({ error: WEAK_PASSWORD }, { status: 400 });
    }
    if (await prisma.user.findUnique({ where: { email } })) {
      return NextResponse.json({ error: "Bu e-posta adresi başka bir hesapta kullanılıyor." }, { status: 409 });
    }

    const agent = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        password: await hashPassword(password),
        role: SUPPORT_ROLE,
      },
      select: AGENT_SELECT,
    });

    await createAuditLog({
      adminEmail: admin.email,
      adminName: admin.name,
      action: "SUPPORT_AGENT_CREATE",
      target: agent.name,
      targetId: agent.id,
      newValue: agent.email,
      details: `Yeni yetkili hesabı oluşturuldu: ${agent.email}`,
    });

    return NextResponse.json({ success: true, agent });
  } catch (error: unknown) {
    console.error("Create support agent error:", error);
    return NextResponse.json({ error: "Yetkili oluşturulurken bir hata oluştu." }, { status: 500 });
  }
}
