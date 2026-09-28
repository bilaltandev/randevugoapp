import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const businesses = await prisma.business.findMany({
    include: {
      user: { select: { name: true, email: true } },
      subscription: true,
      _count: {
        select: {
          appointments: true,
          customers: true,
          services: true,
          employees: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalBusinesses = businesses.length;
  const totalAppointments = await prisma.appointment.count();
  const activeSubscriptions = businesses.filter(
    (b) => b.subscription?.status === "active"
  ).length;
  const trialBusinesses = businesses.filter(
    (b) => b.subscription?.status === "trial"
  ).length;
  const monthlyRecurringRevenue = activeSubscriptions * 89;

  const completedAppts = await prisma.appointment.findMany({
    where: { status: "COMPLETED" },
    select: { price: true },
  });
  const totalGmv = completedAppts.reduce((acc, a) => acc + a.price, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <AdminClient
          initialBusinesses={businesses}
          metrics={{
            totalBusinesses,
            totalAppointments,
            activeSubscriptions,
            trialBusinesses,
            monthlyRecurringRevenue,
            totalGmv,
          }}
          adminUser={user}
        />
      </div>
    </div>
  );
}
