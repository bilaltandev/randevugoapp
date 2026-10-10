import { useSyncExternalStore } from "react";
import { formatCurrency } from "@/lib/utils";

const noopSubscribe = () => () => {};

/**
 * Current minute on the client, `null` during server render. Open/closed status and
 * "today" depend on the visitor's clock, so they render only after hydration.
 */
export function useClientMinute(): number | null {
  return useSyncExternalStore(
    noopSubscribe,
    () => Math.floor(Date.now() / 60_000),
    () => null
  );
}

export function minuteToDate(minute: number) {
  return new Date(minute * 60_000);
}

/** "YYYY-MM-DD" for a local date (no UTC shift). */
export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function fromDateKey(key: string): Date | null {
  const [y, m, d] = key.split("-").map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
}

export function formatDateKey(
  key: string,
  opts: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" }
) {
  const d = fromDateKey(key);
  return d ? d.toLocaleDateString("tr-TR", opts) : key;
}

export function formatPrice(price: number) {
  return price === 0 ? "Ücretsiz" : formatCurrency(price);
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} dk`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} sa ${m} dk` : `${h} sa`;
}

export const DAY_NAMES = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
/** Monday-first order for weekly tables (0 = Sunday in the data). */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export interface WorkingHour {
  dayOfWeek: number;
  isOpen: boolean;
  openTime?: string | null;
  closeTime?: string | null;
  breakStartTime?: string | null;
  breakEndTime?: string | null;
  employeeId?: string | null;
}

/** Business-wide hours for a weekday (staff-specific rows are a fallback). */
export function hoursForDay(hours: WorkingHour[], day: number) {
  return hours.find((w) => w.dayOfWeek === day && !w.employeeId) || hours.find((w) => w.dayOfWeek === day);
}

const toMin = (t?: string | null) => {
  const [h, m] = (t || "0:0").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

/** Short open/closed line from the real weekly hours, e.g. "Açık · Kapanış 19:00". */
export function getOpenStatus(hours: WorkingHour[], now: Date): { open: boolean; label: string } | null {
  if (hours.length === 0) return null;
  const today = hoursForDay(hours, now.getDay());
  const cur = now.getHours() * 60 + now.getMinutes();

  const nextOpening = () => {
    for (let i = 1; i <= 7; i++) {
      const day = (now.getDay() + i) % 7;
      const wh = hoursForDay(hours, day);
      if (wh?.isOpen && wh.openTime) return i === 1 ? `Yarın ${wh.openTime}` : `${DAY_NAMES[day]} ${wh.openTime}`;
    }
    return null;
  };

  if (!today?.isOpen) {
    const next = nextOpening();
    return { open: false, label: next ? `Bugün kapalı · Açılış ${next}` : "Bugün kapalı" };
  }
  const open = toMin(today.openTime);
  const close = toMin(today.closeTime);
  if (cur < open) return { open: false, label: `Kapalı · Açılış ${today.openTime}` };
  if (cur >= close) {
    const next = nextOpening();
    return { open: false, label: next ? `Kapalı · Açılış ${next}` : "Kapalı" };
  }
  if (today.breakStartTime && today.breakEndTime && cur >= toMin(today.breakStartTime) && cur < toMin(today.breakEndTime)) {
    return { open: false, label: `Mola · Dönüş ${today.breakEndTime}` };
  }
  return { open: true, label: `Açık · Kapanış ${today.closeTime}` };
}
