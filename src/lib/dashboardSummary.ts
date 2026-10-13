import prisma from "./prisma";
import { businessNow } from "./appointmentRules";

const appointmentInclude = { service: true, employee: true } as const;

/**
 * Data of the panel overview ("Özet"), shared by the web dashboard page and GET /api/dashboard/summary
 * (mobile). "Today" is Türkiye time; appointment dates are "YYYY-MM-DD" strings, so a month is a prefix.
 * With `employeeId` (a team member's own overview) every figure counts only that staff member's bookings.
 */
export async function getDashboardSummary(businessId: string, employeeId?: string) {
  const scope = employeeId ? { businessId, employeeId } : { businessId };
  const todayStr = businessNow().dateKey;
  const monthPrefix = todayStr.slice(0, 7);

  // Last 7 days (today included) for the small trend lines.
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(`${todayStr}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });

  const [
    todayAppointments,
    pendingAppointments,
    pendingCount,
    upcomingAppointments,
    completedThisMonth,
    reviewStats,
    lastWeek,
  ] = await Promise.all([
    prisma.appointment.findMany({
      where: { ...scope, date: todayStr },
      include: appointmentInclude,
      orderBy: { startTime: "asc" },
    }),
    prisma.appointment.findMany({
      where: { ...scope, status: "PENDING", isBlockedSlot: false, date: { gte: todayStr } },
      include: appointmentInclude,
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      take: 6,
    }),
    prisma.appointment.count({
      where: { ...scope, status: "PENDING", isBlockedSlot: false, date: { gte: todayStr } },
    }),
    prisma.appointment.findMany({
      where: {
        ...scope,
        date: { gt: todayStr },
        status: { in: ["PENDING", "CONFIRMED"] },
        isBlockedSlot: false,
      },
      include: appointmentInclude,
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      take: 5,
    }),
    prisma.appointment.findMany({
      where: { ...scope, status: "COMPLETED", isBlockedSlot: false, date: { startsWith: monthPrefix } },
      select: { price: true },
    }),
    prisma.review.aggregate({
      where: scope,
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.appointment.findMany({
      where: { ...scope, isBlockedSlot: false, date: { gte: last7[0], lte: todayStr }, status: { not: "CANCELLED" } },
      select: { date: true, status: true, price: true },
    }),
  ]);

  return {
    todayStr,
    last7,
    todayAppointments,
    pendingAppointments,
    pendingCount,
    upcomingAppointments,
    completedThisMonthCount: completedThisMonth.length,
    monthRevenue: completedThisMonth.reduce((acc, a) => acc + a.price, 0),
    reviewCount: reviewStats._count._all,
    avgRating: reviewStats._avg.rating,
    bookingsPerDay: last7.map((day) => lastWeek.filter((a) => a.date === day).length),
    revenuePerDay: last7.map((day) =>
      lastWeek.filter((a) => a.date === day && a.status === "COMPLETED").reduce((acc, a) => acc + a.price, 0)
    ),
  };
}

/** Days left of a trial; same rule as the web overview banner. */
export function trialDaysRemaining(subscription: { status: string; trialEndDate: Date | string | null } | null | undefined, now = new Date()) {
  if (subscription?.status === "trial" && subscription.trialEndDate) {
    const diff = new Date(subscription.trialEndDate).getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }
  return 3;
}
