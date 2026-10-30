import { BUSINESS_TIME_ZONE } from "@/lib/appointmentRules";
import { getDashboardSummary, trialDaysRemaining } from "@/lib/dashboardSummary";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import { SubscriptionAlert } from "@/components/SubscriptionAlert";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatStrip } from "@/components/ui/StatStrip";
import { CalendarCheck2, Hourglass, Star, Wallet } from "lucide-react";
import DashboardOverviewClient from "./DashboardOverviewClient";
import { TodayHero } from "./TodayHero";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user || !user.business) return null;

  const {
    todayStr,
    todayAppointments,
    pendingAppointments,
    pendingCount,
    upcomingAppointments,
    completedThisMonthCount,
    monthRevenue,
    reviewCount,
    avgRating,
    bookingsPerDay,
    revenuePerDay,
  } = await getDashboardSummary(user.business.id);
  const now = new Date();
  const firstName = (user.name || "").trim().split(/\s+/)[0];

  // Labels use Türkiye time, like `todayStr`.
  const monthName = now.toLocaleDateString("tr-TR", { month: "long", timeZone: BUSINESS_TIME_ZONE });
  const todayLabel = now.toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: BUSINESS_TIME_ZONE,
  });

  // Subscription calculation
  const subscription = user.business.subscription;
  const daysRemaining = trialDaysRemaining(subscription, now);

  return (
    <div className="space-y-5 sm:space-y-6">
      <SubscriptionAlert status={subscription?.status || "trial"} daysRemaining={daysRemaining} />

      <PageHeader
        eyebrow={`${todayLabel.charAt(0).toLocaleUpperCase("tr-TR")}${todayLabel.slice(1)}`}
        title={firstName ? `Merhaba, ${firstName}` : "Bugün"}
      />

      <TodayHero appointments={todayAppointments} nextDayBooking={upcomingAppointments[0]} bookingsPerDay={bookingsPerDay} />

      <StatStrip
        variant="tiles"
        stats={[
          {
            label: "Onay bekleyen",
            value: pendingCount,
            hint: pendingCount > 0 ? "Bugün ve sonrası" : "Bekleyen talep yok",
            href: "/dashboard/appointments",
            icon: Hourglass,
            accent: "amber",
          },
          {
            label: `${monthName.charAt(0).toLocaleUpperCase("tr-TR")}${monthName.slice(1)} geliri`,
            value: formatCurrency(monthRevenue),
            hint: `${completedThisMonthCount} tamamlanan randevudan`,
            trend: { values: revenuePerDay, label: "Son 7 günün günlük geliri" },
            icon: Wallet,
            accent: "blue",
          },
          {
            label: "Son 7 gün",
            value: bookingsPerDay.reduce((sum, n) => sum + n, 0),
            hint: "Randevu",
            href: "/dashboard/calendar",
            trend: { values: bookingsPerDay, label: `Son 7 günde günlük randevu: ${bookingsPerDay.join(", ")}` },
            icon: CalendarCheck2,
            accent: "brand",
          },
          {
            label: "Müşteri puanı",
            value: avgRating != null ? avgRating.toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : "—",
            hint: reviewCount > 0 ? `${reviewCount} yorum` : "Henüz yorum yok",
            href: "/dashboard/reviews",
            icon: Star,
            accent: "violet",
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
