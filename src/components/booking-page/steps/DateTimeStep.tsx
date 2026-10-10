"use client";

import React, { useMemo } from "react";
import { AlertCircle, CalendarX2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BookingState } from "../useBooking";
import { formatDateKey, fromDateKey, toDateKey } from "../time";
import { choice, inputCls } from "../ui";
import { TableSelection } from "./TableSelection";

const DAY_COUNT = 14;
const PARTY_SIZES = [1, 2, 3, 4, 5, 6, 8];

export function DateTimeStep({ booking, todayKey }: { booking: BookingState; todayKey: string }) {
  const b = booking;

  const days = useMemo(() => {
    const start = todayKey ? fromDateKey(todayKey) : null;
    if (!start) return [];
    return Array.from({ length: DAY_COUNT }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }, [todayKey]);
  const dateInStrip = days.some((d) => toDateKey(d) === b.selectedDate);

  const groups = useMemo(() => {
    const parts = [
      { label: "Sabah", slots: [] as string[] },
      { label: "Öğleden sonra", slots: [] as string[] },
      { label: "Akşam", slots: [] as string[] },
    ];
    for (const s of b.availableSlots) {
      const h = Number(s.split(":")[0]);
      parts[h < 12 ? 0 : h < 17 ? 1 : 2].slots.push(s);
    }
    return parts.filter((p) => p.slots.length > 0);
  }, [b.availableSlots]);

  return (
    <div className="space-y-7">
      {/* Party size first for restaurants: it decides which tables fit. */}
      {b.isRestaurant && (
        <fieldset className="min-w-0">
          <legend className="mb-2 text-sm font-medium text-ink">Kişi sayısı</legend>
          <div className="flex flex-wrap gap-2">
            {PARTY_SIZES.map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={b.guestCount === String(n)}
                onClick={() => b.setGuestCount(String(n))}
                className={choice(b.guestCount === String(n), "h-11 min-w-11 px-3 text-center text-sm font-medium tabular-nums")}
              >
                {n}
              </button>
            ))}
            <select
              aria-label="Daha kalabalık grup"
              value={PARTY_SIZES.map(String).includes(b.guestCount) ? "" : b.guestCount}
              onChange={(e) => e.target.value && b.setGuestCount(e.target.value)}
              className={cn(inputCls, "w-auto pr-8")}
            >
              <option value="" disabled>
                Daha fazla
              </option>
              {[7, 9, 10, 12, 14, 16, 20].map((n) => (
                <option key={n} value={String(n)}>
                  {n} kişi
                </option>
              ))}
            </select>
          </div>
        </fieldset>
      )}

      {/* Day picker */}
      <fieldset className="min-w-0">
        <legend className="mb-2 text-sm font-medium text-ink">Gün</legend>
        <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          <div className="flex gap-2" role="radiogroup" aria-label="Gün">
            {days.map((d) => {
              const key = toDateKey(d);
              const on = key === b.selectedDate;
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  aria-label={formatDateKey(key)}
                  onClick={() => b.selectDate(key)}
                  className={cn(
                    "flex w-[60px] shrink-0 flex-col items-center rounded-(--bk-r-ctl) border py-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                    on ? "border-brand bg-brand text-(color:--bk-on-brand)" : "border-line bg-surface text-ink hover:border-line-strong"
                  )}
                >
                  <span className={cn("text-xs", on ? "text-(color:--bk-on-brand)/80" : "text-ink-3")}>
                    {key === todayKey ? "Bugün" : d.toLocaleDateString("tr-TR", { weekday: "short" })}
                  </span>
                  <span className="text-lg font-semibold leading-tight tabular-nums">{d.getDate()}</span>
                  <span className={cn("text-[11px]", on ? "text-(color:--bk-on-brand)/80" : "text-ink-3")}>
                    {d.toLocaleDateString("tr-TR", { month: "short" })}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <label htmlFor="bk-date" className="text-ink-3">
            Daha ileri bir tarih:
          </label>
          <input
            id="bk-date"
            type="date"
            min={todayKey || undefined}
            value={b.selectedDate}
            onChange={(e) => e.target.value && b.selectDate(e.target.value)}
            className={cn(inputCls, "h-9 w-auto", !dateInStrip && b.selectedDate && "border-brand")}
          />
        </div>
      </fieldset>

      {/* Times */}
      <fieldset className="min-w-0">
        <legend className="mb-2 text-sm font-medium text-ink">
          Saat{b.selectedDate && <span className="font-normal text-ink-3"> · {formatDateKey(b.selectedDate)}</span>}
        </legend>

        {b.loadingSlots ? (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6" aria-busy="true" aria-label="Uygun saatler yükleniyor">
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} className="h-11 animate-pulse rounded-(--bk-r-ctl) bg-surface-muted" />
            ))}
          </div>
        ) : b.slotError ? (
          <p role="status" className="flex items-start gap-2 rounded-(--bk-r-ctl) border border-pending-line bg-pending-soft px-3.5 py-3 text-sm text-pending">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {b.slotError}
          </p>
        ) : b.availableSlots.length === 0 ? (
          <div className="rounded-(--bk-r-ctl) border border-dashed border-line-strong px-4 py-6 text-center">
            <CalendarX2 className="mx-auto h-5 w-5 text-ink-3" aria-hidden="true" />
            <p className="mt-2 text-sm font-medium text-ink">Bu gün için boş saat kalmadı</p>
            <p className="mt-0.5 text-sm text-ink-3">Lütfen başka bir gün seçin.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((g) => (
              <div key={g.label}>
                <p className="mb-1.5 text-xs font-medium text-ink-3">{g.label}</p>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6" role="radiogroup" aria-label={g.label}>
                  {g.slots.map((slot) => {
                    const on = b.selectedTime === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => b.setSelectedTime(slot)}
                        className={cn(
                          "h-11 rounded-(--bk-r-ctl) border text-sm font-medium tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                          on ? "border-brand bg-brand text-(color:--bk-on-brand)" : "border-line bg-surface text-ink hover:border-brand-line hover:bg-brand-soft"
                        )}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </fieldset>

      {b.isRestaurant && <TableSelection booking={b} />}
    </div>
  );
}
