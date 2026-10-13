import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import AdminClient from "./AdminClient";
import { DEFAULT_FEATURE_FLAGS } from "../api/admin/route";
import { monthlyEquivalent, periodOf } from "@/lib/plans";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/admin/login");
  }

  // Security Check: Only SUPER_ADMIN (or ADMIN)
  const role = user.role?.toUpperCase();
  const isAuthorized = role === "SUPER_ADMIN" || role === "ADMIN" || role === "SUPERADMIN";
  if (!isAuthorized) {
    redirect("/dashboard");
  }

  // getCurrentUser doesn't select phone; the profile tab needs it.
  const adminProfile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { phone: true },
  });

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Ensure default feature flags exist
  for (const f of DEFAULT_FEATURE_FLAGS) {
    const exists = await prisma.featureFlag.findUnique({ where: { key: f.key } });
    if (!exists) {
      await prisma.featureFlag.create({
        data: {
          key: f.key,
          description: f.description,
          isEnabled: true,
        },
      });
    }
  }

  // 1. Fetch businesses with counts and owner
  const businesses = await prisma.business.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      subscription: true,
      _count: {
        select: {
          appointments: true,
          customers: true,
          services: true,
          employees: true,
          reviews: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // 2. Platform Metrics
  const totalBusinesses = businesses.length;
  const activeBusinesses = businesses.filter((b) => b.isActive !== false).length;
  const passiveBusinesses = businesses.filter((b) => b.isActive === false).length;

  const trialBusinesses = businesses.filter(
    (b) => b.subscription?.status === "trial"
  ).length;

  const activeSubscriptions = businesses.filter(
    (b) => b.subscription?.status === "active"
  ).length;

  const expiredSubscriptions = businesses.filter(
    (b) => b.subscription?.status === "expired"
  ).length;

  const cancelledSubscriptions = businesses.filter(
    (b) => b.subscription?.status === "cancelled"
  ).length;

  const totalUsers = await prisma.user.count();
  const totalAppointments = await prisma.appointment.count();

  const todayAppointmentsCount = await prisma.appointment.count({
    where: { date: todayStr },
  });

  const monthlyAppointmentsCount = await prisma.appointment.count({
    where: {
      createdAt: { gte: firstDayOfMonth },
    },
  });

  const monthlyRecurringRevenue = businesses
    .filter((b) => b.subscription?.status === "active")
    // USD per month: yearly prices count as a twelfth.
    .reduce((sum, b) => sum + monthlyEquivalent(b.subscription?.monthlyPrice ?? 0, periodOf(b.subscription)), 0);

  const completedAppts = await prisma.appointment.findMany({
    where: { status: "COMPLETED" },
    select: { price: true },
  });
  const totalGmv = completedAppts.reduce((acc, a) => acc + a.price, 0);

  // 3. Recent Businesses
  const recentBusinesses = businesses.slice(0, 6);

  // 4. Recent Platform Appointments
  const recentAppointments = await prisma.appointment.findMany({
    take: 8,
    orderBy: { createdAt: "desc" },
    include: {
      business: { select: { id: true, name: true, slug: true, sector: true } },
      service: { select: { id: true, name: true } },
    },
  });

  // 5. Top Businesses by appointments
  const topBusinesses = [...businesses]
    .sort((a, b) => (b._count?.appointments || 0) - (a._count?.appointments || 0))
    .slice(0, 5);

  // 6. Sector Distribution
  const sectorCounts: Record<string, number> = {};
  businesses.forEach((b) => {
    const sec = b.sector || "DIGER";
    sectorCounts[sec] = (sectorCounts[sec] || 0) + 1;
  });

  // 7. Feature Flags
  const featureFlags = await prisma.featureFlag.findMany({
    orderBy: { key: "asc" },
  });

  // 8. Audit Logs
  let auditLogs: any[] = [];
  try {
    if ((prisma as any).auditLog) {
      auditLogs = await (prisma as any).auditLog.findMany({
        take: 50,
        orderBy: { createdAt: "desc" },
      });
    }
  } catch (err) {
    console.error("Audit logs query error:", err);
    auditLogs = [];
  }

  return (
    <div className="min-h-screen bg-[#070A12] text-slate-100 p-3 sm:p-6 lg:p-8">
      <div className="max-w-[1500px] mx-auto space-y-6">
        <AdminClient
          initialBusinesses={businesses}
          metrics={{
            totalBusinesses,
            activeBusinesses,
            passiveBusinesses,
            trialBusinesses,
            activeSubscriptions,
            expiredSubscriptions,
            cancelledSubscriptions,
            totalUsers,
            totalAppointments,
            todayAppointmentsCount,
            monthlyAppointmentsCount,
            monthlyRecurringRevenue,
            totalGmv,
          }}
          recentBusinesses={recentBusinesses}
          recentAppointments={recentAppointments}
          topBusinesses={topBusinesses}
          sectorCounts={sectorCounts}
          initialFeatureFlags={featureFlags}
          initialAuditLogs={auditLogs}
          adminUser={{ ...user, phone: adminProfile?.phone ?? null }}
        />
      </div>
    </div>
  );
}
