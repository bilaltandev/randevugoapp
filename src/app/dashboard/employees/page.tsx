import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import EmployeesClient from "./EmployeesClient";

export default async function EmployeesPage() {
  const user = await getCurrentUser();
  if (!user || !user.business) return null;

  const employees = await prisma.employee.findMany({
    where: { businessId: user.business.id },
    include: {
      employeeServices: {
        include: { service: true },
      },
      _count: {
        select: { appointments: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const services = await prisma.service.findMany({
    where: { businessId: user.business.id, isActive: true },
  });

  return (
    <div className="space-y-6">
      <EmployeesClient
        businessId={user.business.id}
        initialEmployees={employees}
        services={services}
      />
    </div>
  );
}
