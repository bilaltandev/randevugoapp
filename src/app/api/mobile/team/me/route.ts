import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getStaffActor } from "@/lib/staffActor";

// Team member (mobile Bearer): their own staff record and the services they offer, for the
// "Yeni randevu" screen. Same service rule as employeesForService: no assignments → every service.
export async function GET() {
  try {
    const actor = await getStaffActor();
    if (!actor || actor.kind !== "member") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const employee = await prisma.employee.findUniqueOrThrow({
      where: { id: actor.employeeId },
      select: { id: true, name: true, specialty: true, photo: true, isActive: true, employeeServices: { select: { serviceId: true } } },
    });
    const assigned = employee.employeeServices.map((es) => es.serviceId);
    const services = await prisma.service.findMany({
      where: { businessId: actor.businessId, isActive: true, ...(assigned.length ? { id: { in: assigned } } : {}) },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(
      {
        employee: { id: employee.id, name: employee.name, specialty: employee.specialty, photo: employee.photo, isActive: employee.isActive, employeeServices: employee.employeeServices },
        services,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("GET team member context error:", error);
    return NextResponse.json({ error: "Bilgiler alınamadı." }, { status: 500 });
  }
}
