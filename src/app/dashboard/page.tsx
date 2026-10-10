import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import { SubscriptionAlert } from "@/components/SubscriptionAlert";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatStrip } from "@/components/ui/StatStrip";
import DashboardOverviewClient from "./DashboardOverviewClient";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user || !user.business) return null;

  const businessId = user.business.id;
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  // Appointment dates are stored as "YYYY-MM-DD" strings, so a month is a prefix match.
  const monthPrefix = todayStr.slice(0, 7);

  const appointmentInclude = { service: true, employee: true } as const;

  // Last 7 days (today included) for the small trend lines; dates are "YYYY-MM-DD" strings.
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
      where: { businessId, date: todayStr },
      include: appointmentInclude,
      orderBy: { startTime: "asc" },
    }),
    prisma.appointment.findMany({
      where: { businessId, status: "PENDING", isBlockedSlot: false, date: { gte: todayStr } },
      include: appointmentInclude,
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      take: 6,
    }),
    prisma.appointment.count({
      where: { businessId, status: "PENDING", isBlockedSlot: false, date: { gte: todayStr } },
    }),
    prisma.appointment.findMany({
      where: {
        businessId,
        date: { gt: todayStr },
        status: { in: ["PENDING", "CONFIRMED"] },
        isBlockedSlot: false,
      },
      include: appointmentInclude,
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      take: 5,
    }),
    prisma.appointment.findMany({
      where: { businessId, status: "COMPLETED", isBlockedSlot: false, date: { startsWith: monthPrefix } },
      select: { price: true },
    }),
    prisma.review.aggregate({
      where: { businessId },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.appointment.findMany({
      where: { businessId, isBlockedSlot: false, date: { gte: last7[0], lte: todayStr }, status: { not: "CANCELLED" } },
      select: { date: true, status: true, price: true },
    }),
  ]);

  const bookingsPerDay = last7.map((day) => lastWeek.filter((a) => a.date === day).length);
  const revenuePerDay = last7.map((day) =>
    lastWeek.filter((a) => a.date === day && a.status === "COMPLETED").reduce((acc, a) => acc + a.price, 0)
  );
  const firstName = (user.name || "").trim().split(/\s+/)[0];

  const bookingsToday = todayAppointments.filter((a) => !a.isBlockedSlot && a.status !== "CANCELLED");
  const pendingToday = bookingsToday.filter((a) => a.status === "PENDING").length;
  const monthRevenue = completedThisMonth.reduce((acc, a) => acc + a.price, 0);
  const reviewCount = reviewStats._count._all;
  const avgRating = reviewStats._avg.rating;

  // Labels use UTC so they always describe the same day as `todayStr` above.
  const monthName = now.toLocaleDateString("tr-TR", { month: "long", timeZone: "UTC" });
  const todayLabel = now.toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });

  // Subscription calculation
  const subscription = user.business.subscription;
  let daysRemaining = 3;
  if (subscription?.status === "trial" && subscription.trialEndDate) {
    const diff = new Date(subscription.trialEndDate).getTime() - now.getTime();
    daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <SubscriptionAlert status={subscription?.status || "trial"} daysRemaining={daysRemaining} />

      <PageHeader
        title={firstName ? `Merhaba, ${firstName}` : "Bugün"}
        description={`${todayLabel.charAt(0).toLocaleUpperCase("tr-TR")}${todayLabel.slice(1)}`}
      />

      <StatStrip
        stats={[
          {
            label: "Bugünkü randevular",
            value: bookingsToday.length,
            hint:
              bookingsToday.length === 0
                ? "Bugün randevu yok"
                : pendingToday > 0
                ? `${pendingToday} tanesi onay bekliyor`
                : "Hepsi onaylı",
            href: "/dashboard/calendar",
            trend: { values: bookingsPerDay, label: `Son 7 günde günlük randevu: ${bookingsPerDay.join(", ")}` },
          },
          {
            label: "Onay bekleyen",
            value: pendingCount,
            hint: pendingCount > 0 ? "Bugün ve sonrası" : "Bekleyen talep yok",
            href: "/dashboard/appointments",
            attention: pendingCount > 0,
          },
          {
            label: `${monthName.charAt(0).toLocaleUpperCase("tr-TR")}${monthName.slice(1)} geliri`,
            value: formatCurrency(monthRevenue),
            hint: `${completedThisMonth.length} tamamlanan randevudan`,
            trend: { values: revenuePerDay, label: "Son 7 günün günlük geliri" },
          },
          {
            label: "Müşteri puanı",
            value: avgRating != null ? avgRating.toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : "—",
            hint: reviewCount > 0 ? `${reviewCount} yorum` : "Henüz yorum yok",
            href: "/dashboard/reviews",
          },
        ]}
      />

      <DashboardOverviewClient
        todayAppointments={todayAppointments}
        pendingAppointments={pendingAppointments}
        pendingCount={pendingCount}
        upcomingAppointments={upcomingAppointments}
        todayStr={todayStr}
        businessSlug={user.business.slug}
        showStaff={user.business.enableStaffSelection ?? true}
        isRestaurant={user.business.sector === "RESTORAN" || user.business.sector === "RESTAURANT"}
      />
    </div>
  );
}
