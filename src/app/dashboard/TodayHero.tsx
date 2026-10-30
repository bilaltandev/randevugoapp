"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, CalendarDays, CalendarPlus, ChevronRight, Lock, MessageSquare, type LucideIcon } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

/** The fields of a booking the widgets read. */
export interface TodayBooking {
  id: string;
  customerName: string;
  customerPhone?: string | null;
  startTime: string;
  endTime?: string | null;
  date?: string;
  price?: number | null;
  status: string;
  isBlockedSlot?: boolean | null;
  service?: { name?: string | null } | null;
}

interface TodayHeroProps {
  appointments: TodayBooking[];
  /** The first booking after today; shown when today has nothing left. */
  nextDayBooking?: TodayBooking;
  bookingsPerDay: number[];
}

const RINGS = {
  done: "#30D158",
  confirmed: "#0A84FF",
  busy: "#FF9F0A",
};

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
};

function waitLabel(minutes: number) {
  if (minutes <= 0) return "Şu an";
  if (minutes < 60) return `${minutes} dk sonra`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} sa ${rest} dk sonra` : `${hours} saat sonra`;
}

/** "2026-10-31" → "31 Eki Cmt". */
const dayLabel = (date?: string) =>
  date ? new Date(`${date}T00:00:00Z`).toLocaleDateString("tr-TR", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }) : null;

/** Apple Watch style: three nested rings filling up as the day goes on. */
function ActivityRings({ rings }: { rings: { color: string; share: number }[] }) {
  const size = 148;
  const stroke = 15;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-[148px] w-[148px] shrink-0 -rotate-90" aria-hidden="true">
      {rings.map(({ color, share }, i) => {
        const r = size / 2 - stroke / 2 - i * (stroke + 3);
        const c = 2 * Math.PI * r;
        return (
          <g key={color} style={{ "--ring-length": `${c}` } as React.CSSProperties}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeOpacity={0.18} strokeWidth={stroke} />
            {share > 0 && (
              <circle
                className="dash-ring"
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={color}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={`${c * Math.min(share, 1)} ${c}`}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

/** Seven small bars, today's last and in the accent color. */
function WeekBars({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex h-20 items-end gap-1.5" aria-hidden="true">
      {values.map((value, i) => (
        <span
          key={i}
          className={cn("flex-1 rounded-full", i === values.length - 1 ? "bg-brand" : "bg-surface-muted")}
          style={{ height: `${Math.max((value / max) * 100, 8)}%` }}
        />
      ))}
    </div>
  );
}

/** Today at a glance as iOS widgets: progress rings, the next booking and the week. */
export function TodayHero({ appointments, nextDayBooking, bookingsPerDay }: TodayHeroProps) {
  // Read the clock only after mount so server and client markup match.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setNow(d.getHours() * 60 + d.getMinutes());
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const bookings = appointments.filter((a) => !a.isBlockedSlot && a.status !== "CANCELLED");
  const total = bookings.length;
  const done = bookings.filter((a) => a.status === "COMPLETED").length;
  const pending = bookings.filter((a) => a.status === "PENDING").length;
  const confirmed = total - pending;
  const busiest = Math.max(...bookingsPerDay, total, 1);
  const weekTotal = bookingsPerDay.reduce((sum, n) => sum + n, 0);
  const revenue = bookings.reduce((sum, a) => sum + (a.price ?? 0), 0);

  const legend = [
    { color: RINGS.done, label: "Tamamlanan", value: `${done}/${total}` },
    { color: RINGS.confirmed, label: "Onaylı", value: `${confirmed}/${total}` },
    { color: RINGS.busy, label: "Yoğunluk", value: `%${Math.round((total / busiest) * 100)}` },
  ];

  const nextToday =
    now === null
      ? undefined
      : bookings
          .filter((a) => a.status !== "COMPLETED" && toMinutes(a.endTime || a.startTime) > now)
          .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime))[0];
  const next = nextToday ?? nextDayBooking;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Rings */}
        <section className="dash-widget flex items-center gap-5 lg:col-span-5" aria-label="Bugünün ilerlemesi">
          <ActivityRings
            rings={[
              { color: RINGS.done, share: total ? done / total : 0 },
              { color: RINGS.confirmed, share: total ? confirmed / total : 0 },
              { color: RINGS.busy, share: total / busiest },
            ]}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-ink-3">Bugün</p>
            <p className="font-display text-[44px] font-semibold leading-none tracking-[-0.04em] text-ink tabular-nums">{total}</p>
            <p className="mt-1 text-[13px] text-ink-3">{pending > 0 ? `${pending} onay bekliyor` : "randevu"}</p>
            <dl className="mt-3 space-y-1">
              {legend.map(({ color, label, value }) => (
                <div key={label} className="flex items-center gap-2 text-[13px]">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
                  <dt className="min-w-0 flex-1 truncate text-ink-2">{label}</dt>
                  <dd className="font-semibold text-ink tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Next up */}
        <section className="dash-widget dash-widget-brand flex flex-col justify-between gap-4 lg:col-span-4" aria-label="Sıradaki randevu">
          {next ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] font-medium opacity-80">Sıradaki</p>
                {nextToday && now !== null && (
                  <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold">{waitLabel(toMinutes(nextToday.startTime) - now)}</span>
                )}
              </div>
              <div>
                <p className="font-display text-[44px] font-semibold leading-none tracking-[-0.04em] tabular-nums">{next.startTime}</p>
                <p className="mt-2 truncate text-[17px] font-semibold">{next.customerName}</p>
                <p className="truncate text-[13px] opacity-80">{nextToday ? next.service?.name : [dayLabel(next.date), next.service?.name].filter(Boolean).join(" · ")}</p>
              </div>
              {next.customerPhone && (
                <a
                  href={`https://wa.me/${next.customerPhone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center justify-center gap-2 self-start rounded-full bg-white/15 px-3.5 text-[13px] font-semibold transition-colors hover:bg-white/25"
                >
                  <MessageSquare className="h-4 w-4" aria-hidden="true" />
                  WhatsApp&apos;tan yaz
                </a>
              )}
            </>
          ) : (
            <div className="flex h-full flex-col justify-between gap-6">
              <p className="text-[13px] font-medium opacity-80">Sıradaki</p>
              <div>
                <p className="font-display text-[26px] font-semibold leading-tight tracking-[-0.03em]">Sırada randevu yok</p>
                <Link href="/dashboard/calendar?new=1" className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold opacity-90 hover:opacity-100">
                  Randevu ekle
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* Week */}
        <section className="dash-widget flex flex-col justify-between gap-4 lg:col-span-3" aria-label="Son 7 gün">
          <div>
            <p className="text-[13px] font-medium text-ink-3">Bugünkü tutar</p>
            <p className="mt-1 font-display text-[28px] font-semibold leading-none tracking-[-0.03em] text-ink tabular-nums">{formatCurrency(revenue)}</p>
          </div>
          <div>
            <WeekBars values={bookingsPerDay} />
            <p className="mt-2 text-[13px] text-ink-3">Son 7 günde {weekTotal} randevu</p>
          </div>
        </section>
      </div>

      <nav className="grid grid-cols-4 gap-2 sm:gap-3" aria-label="Hızlı işlemler">
        <Action href="/dashboard/calendar?new=1" icon={CalendarPlus} label="Randevu ekle" color="#30D158" />
        <Action href="/dashboard/calendar" icon={Lock} label="Saat kapat" color="#FF9F0A" />
        <Action href="/dashboard/calendar" icon={CalendarDays} label="Takvim" color="#0A84FF" />
        <Action href="/dashboard/analytics" icon={BarChart3} label="İstatistikler" color="#BF5AF2" />
      </nav>
    </div>
  );
}

/** A home-screen app icon: white glyph on a solid rounded square. */
function Action({ href, icon: Icon, label, color }: { href: string; icon: LucideIcon; label: string; color: string }) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-center gap-2 rounded-panel py-1 text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <span
        className="flex h-14 w-14 items-center justify-center rounded-[16px] text-white shadow-raised transition-transform duration-200 group-hover:scale-105 group-active:scale-95 sm:h-[60px] sm:w-[60px] sm:rounded-[18px]"
        style={{ backgroundColor: color }}
      >
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <span className="truncate text-xs font-medium text-ink-2 sm:text-[13px]">{label}</span>
    </Link>
  );
}
