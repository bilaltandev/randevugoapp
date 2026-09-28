import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import CalendarClient from "./CalendarClient";

export default async function CalendarPage() {
  const user = await getCurrentUser();
  if (!user || !user.business) return null;

  const businessId = user.business.id;

  const appointments = await prisma.appointment.findMany({
    where: { businessId },
    include: {
      service: true,
      employee: true,
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  const services = await prisma.service.findMany({
    where: { businessId, isActive: true },
  });

  const employees = await prisma.employee.findMany({
    where: { businessId, isActive: true },
  });

  return (
    <div className="space-y-6">
      <CalendarClient
        businessId={businessId}
        initialAppointments={appointments}
        services={services}
        employees={employees}
      />
    </div>
  );
}
