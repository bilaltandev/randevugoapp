"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  MessageSquare,
  Palette,
  Scissors,
  UtensilsCrossed,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { getSectorDetails } from "@/lib/appointmentStatus";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button, buttonClasses } from "@/components/ui/Button";

interface DashboardOverviewClientProps {
  todayAppointments: any[];
  pendingAppointments: any[];
  pendingCount: number;
  upcomingAppointments: any[];
  todayStr: string;
  businessSlug: string;
  showStaff: boolean;
  isRestaurant: boolean;
}

const toMinutes = (hhmm: string) => {
  const [h, m] = (hhmm || "0:0").split(":").map(Number);
  return h * 60 + (m || 0);
};

export default function DashboardOverviewClient({
  todayAppointments: initialToday,
  pendingAppointments: initialPending,
  pendingCount: initialPendingCount,
  upcomingAppointments: initialUpcoming,
  todayStr,
  businessSlug,
  showStaff,
  isRestaurant,
}: DashboardOverviewClientProps) {
  const [todayAppts, setTodayAppts] = useState(initialToday);
  const [pendingAppts, setPendingAppts] = useState(initialPending);
  const [pendingCount, setPendingCount] = useState(initialPendingCount);
  const [upcomingAppts, setUpcomingAppts] = useState(initialUpcoming);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  // Read the clock only after mount so server and client markup match.
  const [nowMinutes, setNowMinutes] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setNowMinutes(d.getHours() * 60 + d.getMinutes());
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  const handleUpdateStatus = async (appointmentId: string, newStatus: string) => {
    setLoadingId(appointmentId);
    try {
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: appointmentId, status: newStatus }),
      });
      if (res.ok) {
        const update = (list: any[]) => list.map((a) => (a.id === appointmentId ? { ...a, status: newStatus } : a));
        setTodayAppts(update);
        setUpcomingAppts(update);
        if (pendingAppts.some((a) => a.id === appointmentId) && newStatus !== "PENDING") {
          setPendingAppts((prev) => prev.filter((a) => a.id !== appointmentId));
          setPendingCount((c) => Math.max(0, c - 1));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingId(null);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/${businessSlug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tomorrowStr = (() => {
    const d = new Date(`${todayStr}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().split("T")[0];
  })();

  const formatDay = (date: string) => {
    if (date === todayStr) return "Bugün";
    if (date === tomorrowStr) return "Yarın";
    return new Date(`${date}T00:00:00Z`).toLocaleDateString("tr-TR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });
  };

  const describe = (appt: any) =>
    [
      appt.service?.name,
      showStaff && appt.employee?.name ? appt.employee.name : null,
      ...getSectorDetails(appt.sectorData),
    ].filter(Boolean) as string[];

  const shortcuts: { label: string; href: string; icon: LucideIcon }[] = [
    { label: "Saat kapat veya mola ekle", href: "/dashboard/calendar", icon: Clock },
    isRestaurant
      ? { label: "Masa planını düzenle", href: "/dashboard/tables", icon: UtensilsCrossed }
      : { label: "Hizmetleri yönet", href: "/dashboard/services", icon: Scissors },
    { label: "Rezervasyon sayfasını düzenle", href: "/dashboard/page-builder", icon: Palette },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:grid-rows-[auto_auto_1fr] lg:items-start">
      {/* Today's schedule */}
      <Panel
        className="lg:col-span-2 lg:row-span-3"
        title="Bugünün akışı"
        description={todayAppts.length > 0 ? "Saat sırasına göre bugünkü randevular ve kapalı saatler" : undefined}
        action={
          <Link href="/dashboard/appointments" className="text-sm font-medium text-brand hover:text-brand-hover">
            Tüm rezervasyonlar
          </Link>
        }
        flush
      >
        {todayAppts.length === 0 ? (
          <div>
            {upcomingAppts[0] && (
              <Link
                href="/dashboard/calendar"
                className="mx-4 mt-4 flex items-center gap-4 rounded-panel border border-line bg-surface-muted/60 p-4 transition-colors hover:bg-surface-muted sm:mx-5"
              >
                <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-control bg-surface text-center shadow-raised">
                  <span className="font-display text-base font-bold leading-none text-ink tabular-nums">
                    {upcomingAppts[0].startTime}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-ink-3">
                    Sıradaki randevu: {formatDay(upcomingAppts[0].date)}
                  </p>
                  <p className="mt-0.5 truncate text-[15px] font-semibold text-ink">{upcomingAppts[0].customerName}</p>
                  <p className="truncate text-sm text-ink-3">{describe(upcomingAppts[0]).join(" · ")}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
              </Link>
            )}
            <EmptyState
              icon={CalendarDays}
              title="Bugün için randevu yok"
              description="Rezervasyon bağlantınızı müşterilerinizle paylaşın ya da takvimden kendiniz randevu ekleyin."
              actions={
                <>
                  <Button onClick={handleCopyLink}>
                    {copied ? <Check className="w-4 h-4 text-brand" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Bağlantı kopyalandı" : "Bağlantıyı kopyala"}
                  </Button>
                  <Button href="/dashboard/calendar?new=1" variant="primary">
                    <CalendarPlus className="w-4 h-4" aria-hidden="true" />
                    Randevu ekle
                  </Button>
                </>
              }
            />
          </div>
        ) : (
          <ol className="py-2">
            {todayAppts.map((appt) => {
              const isPast = nowMinutes !== null && toMinutes(appt.endTime || appt.startTime) <= nowMinutes;
              const isNow =
                nowMinutes !== null &&
                !appt.isBlockedSlot &&
                toMinutes(appt.startTime) <= nowMinutes &&
                nowMinutes < toMinutes(appt.endTime || appt.startTime);
              const isCancelled = appt.status === "CANCELLED";
              const busy = loadingId === appt.id;

              if (appt.isBlockedSlot) {
                return (
                  <li
                    key={appt.id}
                    className={cn("flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5", isPast && "opacity-60")}
                  >
                    <TimeCell start={appt.startTime} end={appt.endTime} />
                    <Rail tone="blocked" />
                    <div className="slot-blocked min-w-0 flex-1 rounded-control px-3 py-2">
                      <p className="text-sm text-ink-2">{appt.notes || "Bu saat aralığı rezervasyona kapalı"}</p>
                    </div>
                    <StatusBadge blocked />
                  </li>
                );
              }

              return (
                <li
                  key={appt.id}
                  className={cn(
                    "relative flex gap-3 px-4 py-3 sm:gap-4 sm:px-5",
                    isPast && !isNow && "opacity-60",
                    isNow && "bg-brand-soft/60",
                  )}
                >
                  <TimeCell start={appt.startTime} end={appt.endTime} />
                  <Rail tone={isNow ? "now" : appt.status} />
                  <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className={cn("text-sm font-medium text-ink", isCancelled && "line-through text-ink-3")}>
                          {appt.customerName}
                        </span>
                        <StatusBadge status={appt.status} />
                        {isNow && <span className="text-xs font-medium text-brand">Şu an</span>}
                      </div>
                      <p className="mt-0.5 text-sm text-ink-3 truncate">
                        {describe(appt).join(" · ")}
                        {appt.price > 0 && <span className="tabular-nums"> · {formatCurrency(appt.price)}</span>}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {appt.customerPhone && (
                        <a
                          href={`https://wa.me/${appt.customerPhone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={buttonClasses("ghost", "sm", "w-8 px-0")}
                          aria-label={`${appt.customerName} ile WhatsApp'tan yazış`}
                          title="WhatsApp'tan yaz"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </a>
                      )}
                      {appt.status === "PENDING" && (
                        <Button
                          size="sm"
                          variant="primary"
                          disabled={busy}
                          onClick={() => handleUpdateStatus(appt.id, "CONFIRMED")}
                        >
                          Onayla
                        </Button>
                      )}
                      {appt.status === "CONFIRMED" && (
                        <Button size="sm" disabled={busy} onClick={() => handleUpdateStatus(appt.id, "COMPLETED")}>
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          Tamamla
                        </Button>
                      )}
                      {appt.status !== "CANCELLED" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busy}
                          onClick={() => handleUpdateStatus(appt.id, "CANCELLED")}
                        >
                          İptal et
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Panel>

      {/* Pending approvals – shown first on mobile when there is something to act on */}
      <Panel
        className={cn(pendingAppts.length > 0 && "order-first lg:order-none")}
        title={
          <span className="flex items-center gap-2">
            Onay bekleyenler
            {pendingCount > 0 && (
              <span className="rounded-control bg-pending-soft px-1.5 text-xs font-medium text-pending tabular-nums">
                {pendingCount}
              </span>
            )}
          </span>
        }
        flush
      >
        {pendingAppts.length === 0 ? (
          <p className="flex items-center gap-2 px-4 py-4 text-sm text-ink-3 sm:px-5">
            <CheckCircle2 className="w-4 h-4 text-brand" aria-hidden="true" />
            Onay bekleyen randevu yok.
          </p>
        ) : (
          <>
            <ul className="divide-y divide-line">
              {pendingAppts.map((appt) => {
                const busy = loadingId === appt.id;
                return (
                  <li key={appt.id} className="px-4 py-3 sm:px-5">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-medium text-ink">{appt.customerName}</span>
                      <span className="shrink-0 text-xs text-ink-3 tabular-nums">
                        {formatDay(appt.date)} · {appt.startTime}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-ink-3">{describe(appt).join(" · ")}</p>
                    <div className="mt-2 flex gap-1.5">
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={busy}
                        onClick={() => handleUpdateStatus(appt.id, "CONFIRMED")}
                      >
                        Onayla
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => handleUpdateStatus(appt.id, "CANCELLED")}
                      >
                        İptal et
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
            {pendingCount > pendingAppts.length && (
              <Link
                href="/dashboard/appointments"
                className="flex items-center justify-between border-t border-line px-4 py-2.5 text-sm font-medium text-brand hover:bg-surface-muted sm:px-5"
              >
                {pendingCount - pendingAppts.length} talep daha
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            )}
          </>
        )}
      </Panel>

      {/* Upcoming (after today) */}
      <Panel
        title="Yaklaşan randevular"
        action={
          <Link href="/dashboard/calendar" className="text-sm font-medium text-brand hover:text-brand-hover">
            Takvim
          </Link>
        }
        flush
      >
        {upcomingAppts.length === 0 ? (
          <p className="px-4 py-4 text-sm text-ink-3 sm:px-5">Önümüzdeki günler için randevu yok.</p>
        ) : (
          <ul className="divide-y divide-line">
            {upcomingAppts.map((appt) => (
              <li key={appt.id} className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
                <div className="w-16 shrink-0 text-xs text-ink-3 tabular-nums">
                  <div className="font-medium text-ink-2">{formatDay(appt.date)}</div>
                  <div>{appt.startTime}</div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink">{appt.customerName}</p>
                  <p className="truncate text-xs text-ink-3">{describe(appt).join(" · ")}</p>
                </div>
                <StatusBadge status={appt.status} />
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* Shortcuts */}
      <Panel title="Kısayollar" flush>
        <ul className="divide-y divide-line">
          {shortcuts.map(({ label, href, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-2 hover:bg-surface-muted hover:text-ink sm:px-5"
              >
                <Icon className="w-4 h-4 text-ink-3" aria-hidden="true" />
                <span className="flex-1">{label}</span>
                <ChevronRight className="w-4 h-4 text-ink-3" aria-hidden="true" />
              </Link>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-ink-2 hover:bg-surface-muted hover:text-ink sm:px-5"
            >
              {copied ? <Check className="w-4 h-4 text-brand" /> : <Copy className="w-4 h-4 text-ink-3" />}
              <span className="flex-1">{copied ? "Bağlantı kopyalandı" : "Rezervasyon bağlantısını kopyala"}</span>
            </button>
          </li>
        </ul>
      </Panel>
    </div>
  );
}

function TimeCell({ start, end }: { start: string; end?: string | null }) {
  return (
    <div className="w-12 shrink-0 pt-0.5 tabular-nums">
      <div className="font-display text-sm font-bold text-ink">{start}</div>
      {end && <div className="text-xs text-ink-3">{end}</div>}
    </div>
  );
}

const RAIL_TONES: Record<string, string> = {
  PENDING: "bg-pending",
  CONFIRMED: "bg-brand",
  COMPLETED: "bg-ink-3",
  CANCELLED: "bg-danger",
  blocked: "bg-line-strong",
  now: "bg-brand ring-brand/25",
};

/** The day's spine: a continuous line with a node colored by the booking's status. */
function Rail({ tone }: { tone: string }) {
  return (
    <div className="relative w-3 shrink-0 self-stretch" aria-hidden="true">
      <span className="absolute -bottom-3 -top-3 left-1/2 w-px -translate-x-1/2 bg-line" />
      <span
        className={cn(
          "absolute left-1/2 top-1.5 h-2.5 w-2.5 -translate-x-1/2 rounded-full ring-4 ring-surface",
          RAIL_TONES[tone] ?? "bg-ink-3",
        )}
      />
    </div>
  );
}
