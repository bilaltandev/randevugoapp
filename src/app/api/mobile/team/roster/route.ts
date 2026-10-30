import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getStaffActor } from "@/lib/staffActor";
import { buildTeamRoster } from "@/lib/teamRoster";

// Team member (mobile Bearer): read-only view of their team, the owner as manager plus the active staff.
export async function GET() {
  try {
    const actor = await getStaffActor();
    if (!actor || actor.kind !== "member") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const business = await prisma.business.findUniqueOrThrow({
      where: { id: actor.businessId },
      select: { name: true, user: { select: { name: true, email: true } } },
    });
    const staff = await prisma.employee.findMany({
      where: { businessId: actor.businessId, isActive: true },
      select: { id: true, name: true, specialty: true, photo: true, email: true },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(
      { businessName: business.name, ...buildTeamRoster(business.user, staff, actor.employeeId) },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("GET team roster error:", error);
    return NextResponse.json({ error: "Ekip bilgisi alınamadı." }, { status: 500 });
  }
}
