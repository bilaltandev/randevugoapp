import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import AppointmentsClient from "./AppointmentsClient";

export default async function AppointmentsPage() {
  const user = await getCurrentUser();
  if (!user || !user.business) return null;

  const appointments = await prisma.appointment.findMany({
    where: { businessId: user.business.id },
    include: {
      service: true,
      employee: true,
      customer: true,
      review: true,
    },
    orderBy: [{ date: "desc" }, { startTime: "asc" }],
  });

  const services = await prisma.service.findMany({
    where: { businessId: user.business.id, isActive: true },
  });

  const employees = await prisma.employee.findMany({
    where: { businessId: user.business.id, isActive: true },
  });

  return (
    <div className="space-y-6">
      <AppointmentsClient
        businessId={user.business.id}
        initialAppointments={appointments}
        services={services}
        employees={employees}
      />
    </div>
  );
}
