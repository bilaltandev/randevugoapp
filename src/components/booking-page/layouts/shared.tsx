import React from "react";
import { cn } from "@/lib/utils";
import { DAY_NAMES, hoursForDay, WEEK_ORDER, type WorkingHour } from "../time";

/** Monday-first weekly hours from the real schedule; today is emphasised. */
export function WeekHours({
  hours,
  todayIndex,
  className,
  todayClassName,
}: {
  hours: WorkingHour[];
  todayIndex: number | null;
  className?: string;
  todayClassName?: string;
}) {
  return (
    <dl className={cn("space-y-1.5 text-sm", className)}>
      {WEEK_ORDER.map((day) => {
        const wh = hoursForDay(hours, day);
        const isToday = day === todayIndex;
        const value =
          wh?.isOpen && wh.openTime && wh.closeTime ? `${wh.openTime} – ${wh.closeTime}` : "Kapalı";
        return (
          <div key={day} className={cn("flex justify-between gap-6", isToday && todayClassName)}>
            <dt>{DAY_NAMES[day]}</dt>
            <dd className="tabular-nums">{value}</dd>
          </div>
        );
      })}
    </dl>
  );
}

export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export function formatRating(value: number) {
  return value.toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
