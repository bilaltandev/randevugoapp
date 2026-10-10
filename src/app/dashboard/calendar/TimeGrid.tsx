"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAppointmentStatus, type StatusTone } from "@/lib/appointmentStatus";

/** Local "YYYY-MM-DD" (toISOString would shift late-night dates to the previous day in UTC+3). */
export function localDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const toMin = (t?: string | null) => {
  const [h, m] = (t || "0:0").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

const HOUR_PX = 60;
const DEFAULT_START = 8;
const DEFAULT_END = 21;
const SNAP_MIN = 15;

const TONES: Record<StatusTone, string> = {
  pending: "border-pending-line bg-pending-soft text-ink [--tone:var(--rg-pending)]",
  confirmed: "border-brand-line bg-brand-soft text-ink [--tone:var(--rg-brand)]",
  completed: "border-line bg-surface-muted text-ink-2 [--tone:var(--rg-ink-3)]",
  cancelled: "border-line bg-surface text-ink-3 line-through opacity-70 [--tone:var(--rg-danger)]",
  blocked: "slot-blocked border-line bg-surface-muted text-ink-2 [--tone:var(--rg-line-strong)]",
};

interface Placed {
  appt: any;
  start: number;
  end: number;
  lane: number;
  lanes: number;
}

/** Side-by-side lanes for overlapping bookings within one day. */
function layoutDay(appts: any[]): Placed[] {
  const items = appts
    .map((a) => {
      const start = toMin(a.startTime);
      const end = Math.max(toMin(a.endTime) || start + (a.service?.durationMinutes ?? 30), start + 20);
      return { appt: a, start, end, lane: 0, lanes: 1 };
    })
    .sort((a, b) => a.start - b.start || b.end - a.end);

  let cluster: Placed[] = [];
  let clusterEnd = -1;
  const flush = () => {
    const lanes = Math.max(1, ...cluster.map((c) => c.lane + 1));
    cluster.forEach((c) => (c.lanes = lanes));
    cluster = [];
  };
  for (const it of items) {
    if (it.start >= clusterEnd) {
      flush();
      clusterEnd = -1;
    }
    const used = new Set(cluster.filter((c) => c.end > it.start).map((c) => c.lane));
    let lane = 0;
    while (used.has(lane)) lane++;
    it.lane = lane;
    cluster.push(it);
    clusterEnd = Math.max(clusterEnd, it.end);
  }
  flush();
  return items;
}

interface TimeGridProps {
  days: Date[];
  appointments: any[];
  onSelect: (appt: any) => void;
  /** Click on an empty spot: prefill a new booking for that day and time. */
  onCreateAt: (dateKey: string, time: string) => void;
}

export function TimeGrid({ days, appointments, onSelect, onCreateAt }: TimeGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  // Clock is read after mount so server and client markup match.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  const dayKeys = days.map(localDateKey);
  const byDay = useMemo(() => {
    const map = new Map<string, Placed[]>();
    for (const key of dayKeys) map.set(key, layoutDay(appointments.filter((a) => a.date === key)));
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments, dayKeys.join()]);

  // Show working hours by default, stretched to fit anything booked outside them.
  const all = Array.from(byDay.values()).flat();
  const startHour = Math.min(DEFAULT_START, ...all.map((p) => Math.floor(p.start / 60)));
  const endHour = Math.max(DEFAULT_END, ...all.map((p) => Math.ceil(p.end / 60)));
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const height = hours.length * HOUR_PX;

  const todayKey = now ? localDateKey(now) : null;
  const nowMin = now ? now.getHours() * 60 + now.getMinutes() : null;
  const nowTop = nowMin !== null && nowMin >= startHour * 60 && nowMin <= endHour * 60 ? ((nowMin - startHour * 60) / 60) * HOUR_PX : null;

  // Open scrolled to the current hour (or the first booking) instead of the top of the day.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !now) return;
    const firstBooking = all.length ? Math.min(...all.map((p) => p.start)) : null;
    const focus = dayKeys.includes(localDateKey(now)) ? nowMin! - 60 : firstBooking !== null ? firstBooking - 30 : startHour * 60;
    el.scrollTop = Math.max(0, ((focus - startHour * 60) / 60) * HOUR_PX);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now === null, dayKeys.join()]);

  const single = days.length === 1;

  return (
    <div className="overflow-x-auto">
      <div className={cn(single ? "min-w-0" : "min-w-[780px]")}>
        {/* Day headers */}
        <div className="grid border-b border-line" style={{ gridTemplateColumns: `56px repeat(${days.length}, minmax(0, 1fr))` }}>
          <div />
          {days.map((d, i) => {
            const isToday = dayKeys[i] === todayKey;
            const count = (byDay.get(dayKeys[i]) ?? []).filter((p) => !p.appt.isBlockedSlot && p.appt.status !== "CANCELLED").length;
            return (
              <div key={dayKeys[i]} className={cn("border-l border-line px-2 py-2.5", single ? "text-left" : "text-center")}>
                <div className={cn("flex items-center gap-2", !single && "flex-col gap-1")}>
                  <span className={cn("text-xs font-medium", isToday ? "text-brand-ink" : "text-ink-3")}>
                    {d.toLocaleDateString("tr-TR", { weekday: single ? "long" : "short" })}
                  </span>
                  <span
                    className={cn(
                      "flex h-8 min-w-8 items-center justify-center rounded-full px-1.5 font-display text-base font-bold tabular-nums",
                      isToday ? "bg-brand text-on-brand" : "text-ink"
                    )}
                  >
                    {d.getDate()}
                  </span>
                </div>
                <span className="mt-0.5 block text-[11px] text-ink-3">{count > 0 ? `${count} randevu` : " "}</span>
              </div>
            );
          })}
        </div>

        {/* Hours */}
        <div ref={scrollRef} className="max-h-[min(68vh,720px)] overflow-y-auto">
          <div className="relative grid" style={{ gridTemplateColumns: `56px repeat(${days.length}, minmax(0, 1fr))`, height }}>
            <div className="relative">
              {hours.map((h, i) => (
                <span
                  key={h}
                  className="absolute right-2 -translate-y-1/2 text-[11px] tabular-nums text-ink-3"
                  style={{ top: i * HOUR_PX }}
                >
                  {i === 0 ? "" : `${String(h).padStart(2, "0")}:00`}
                </span>
              ))}
            </div>

            {days.map((d, di) => {
              const key = dayKeys[di];
              const placed = byDay.get(key) ?? [];
              const isToday = key === todayKey;
              return (
                <div
                  key={key}
                  className={cn("relative border-l border-line", isToday && "bg-brand-soft/30")}
                  style={{
                    backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 ${HOUR_PX - 1}px, var(--rg-line) ${HOUR_PX - 1}px ${HOUR_PX}px)`,
                  }}
                  onClick={(e) => {
                    if (e.target !== e.currentTarget) return;
                    const y = e.nativeEvent.offsetY;
                    const minutes = startHour * 60 + Math.floor((y / HOUR_PX) * 60 / SNAP_MIN) * SNAP_MIN;
                    onCreateAt(key, `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`);
                  }}
                  title="Boş bir saate tıklayarak randevu ekleyin"
                >
                  {placed.map(({ appt, start, end, lane, lanes }) => {
                    const tone: StatusTone = appt.isBlockedSlot ? "blocked" : getAppointmentStatus(appt.status).tone;
                    const top = ((start - startHour * 60) / 60) * HOUR_PX;
                    const h = Math.max(((end - start) / 60) * HOUR_PX - 2, 22);
                    const compact = h < 44;
                    return (
                      <button
                        key={appt.id}
                        type="button"
                        onClick={() => onSelect(appt)}
                        className={cn(
                          "absolute overflow-hidden rounded-[7px] border pl-2.5 pr-1.5 text-left text-xs shadow-[0_1px_2px_rgba(13,17,23,0.06)] transition-[filter] hover:brightness-[0.97] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand",
                          "before:absolute before:inset-y-1 before:left-1 before:w-[3px] before:rounded-full before:bg-(--tone)",
                          compact ? "py-0.5" : "py-1.5",
                          TONES[tone]
                        )}
                        style={{
                          top: top + 1,
                          height: h,
                          left: `calc(${(lane / lanes) * 100}% + 3px)`,
                          width: `calc(${100 / lanes}% - 6px)`,
                        }}
                      >
                        <span className={cn("flex items-center gap-1 font-semibold", compact && "truncate")}>
                          {compact && <span className="shrink-0 font-medium tabular-nums opacity-70">{appt.startTime}</span>}
                          <span className="truncate">{appt.isBlockedSlot ? appt.notes || "Kapalı saat" : appt.customerName}</span>
                          {tone === "blocked" && <Lock className="h-3 w-3 shrink-0" aria-label="Kapalı saat" />}
                        </span>
                        {!compact && (
                          <span className="block truncate text-[11px] opacity-80 tabular-nums">
                            {appt.startTime}
                            {appt.endTime ? `–${appt.endTime}` : ""}
                            {!appt.isBlockedSlot && appt.service?.name ? `, ${appt.service.name}` : ""}
                          </span>
                        )}
                      </button>
                    );
                  })}

                  {isToday && nowTop !== null && (
                    <div className="pointer-events-none absolute inset-x-0 z-10" style={{ top: nowTop }} aria-hidden="true">
                      <div className="relative h-0.5 bg-danger">
                        <span className="absolute -left-1 -top-[3px] h-2 w-2 rounded-full bg-danger" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
