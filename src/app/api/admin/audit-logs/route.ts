import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
    }

    let logs: any[] = [];
    if ((prisma as any).auditLog) {
      logs = await (prisma as any).auditLog.findMany({
        take: 100,
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("GET /api/admin/audit-logs error:", error);
    return NextResponse.json({ error: "Audit loglar yüklenemedi." }, { status: 500 });
  }
}
