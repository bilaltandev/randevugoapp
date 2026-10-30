import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { planOf } from "@/lib/plans";
import { openCodeSummary } from "@/lib/teamInvites";
import EmployeesClient from "./EmployeesClient";

export default async function EmployeesPage() {
  const user = await getCurrentUser();
  if (!user || !user.business) return null;

  const rows = await prisma.employee.findMany({
    where: { businessId: user.business.id },
    include: {
      employeeServices: {
        include: { service: true },
      },
      _count: {
        select: { appointments: true },
      },
      user: { select: { email: true } },
      teamInvites: {
        where: { acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
        select: { expiresAt: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Same team status as GET /api/employees: who joined, and whose invite link is open.
  const employees = rows.map(({ user: member, teamInvites, ...employee }) => ({
    ...employee,
    userId: undefined,
    memberEmail: member?.email ?? null,
    inviteExpiresAt: member ? null : (teamInvites[0]?.expiresAt ?? null),
  }));

  const services = await prisma.service.findMany({
    where: { businessId: user.business.id, isActive: true },
  });

  const plan = planOf(user.business.subscription);
  const openCodes = plan === "TEAM" ? (await openCodeSummary(user.business.id)).count : 0;

  return (
    <div className="space-y-6">
      <EmployeesClient
        businessId={user.business.id}
        businessName={user.business.name}
        ownerEmail={user.email}
        initialEmployees={employees}
        services={services}
        plan={plan}
        memberLimit={user.business.subscription?.memberLimit ?? 5}
        initialOpenCodes={openCodes}
      />
    </div>
  );
}
