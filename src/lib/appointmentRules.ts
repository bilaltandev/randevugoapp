// Time and overlap rules shared by appointment creation and the available-slots API.
// Pure TypeScript (no database), so it is unit-tested directly.

/**
 * Statuses that occupy an employee's (or table's) time — the rule available-slots and the table check
 * already used. CANCELLED frees the time, so a cancelled closed slot ("Saati aç") is open again;
 * COMPLETED frees it too (e.g. a service or table finished early). Closed slots are CONFIRMED rows
 * with isBlockedSlot, so they occupy their employee's time.
 */
export const OCCUPYING_STATUSES = ["PENDING", "CONFIRMED"] as const;

export function isOccupyingStatus(status: string): boolean {
  return (OCCUPYING_STATUSES as readonly string[]).includes(status);
}

const MINUTES_PER_DAY = 24 * 60;

/** Strict "HH:mm" (00:00–23:59) → minutes from midnight, or null. Used for request input. */
export function parseTime(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const m = value.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/** Lenient parse for times already stored in the database ("9:00" as well as "09:00"). */
export function storedTimeToMinutes(value: string): number | null {
  const m = value?.match(/^(\d{1,2}):(\d{2})$/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

export function minutesToTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

/** A real calendar date in "YYYY-MM-DD" form. */
export function isValidDateKey(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** 0 = Sunday … 6 = Saturday, independent of the server's time zone (Vercel runs in UTC). */
export function dayOfWeekFromKey(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Businesses book in Türkiye time; the server itself runs in UTC on Vercel. */
export const BUSINESS_TIME_ZONE = "Europe/Istanbul";

/** Today's date key and minutes since midnight in the business time zone. */
export function businessNow(now: Date = new Date()): { dateKey: string; minutes: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: BUSINESS_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value])
  );
  return { dateKey: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

/** Whether a slot starting at `startMinutes` on `dateKey` has already begun in business time. */
export function isPastSlot(dateKey: string, startMinutes: number, now: Date = new Date()): boolean {
  const current = businessNow(now);
  return dateKey < current.dateKey || (dateKey === current.dateKey && startMinutes <= current.minutes);
}

/** Half-open ranges [start, end): back-to-back appointments (10:00–10:30, 10:30–11:00) do not overlap. */
export function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export type TimeRange = { start: number; end: number };

/** Start + duration as minutes; null when the appointment would run past midnight. */
export function appointmentRange(startTime: string, durationMinutes: number): TimeRange | null {
  const start = parseTime(startTime);
  if (start === null || !Number.isInteger(durationMinutes) || durationMinutes <= 0) return null;
  const end = start + durationMinutes;
  return end <= MINUTES_PER_DAY ? { start, end } : null;
}

type StoredAppointment = { startTime: string; endTime: string; status: string };

/** The first occupying appointment overlapping `range`, if any. */
export function findOverlap<T extends StoredAppointment>(existing: T[], range: TimeRange): T | null {
  for (const a of existing) {
    if (!isOccupyingStatus(a.status)) continue;
    const start = storedTimeToMinutes(a.startTime);
    const end = storedTimeToMinutes(a.endTime);
    // Unreadable legacy times: treat the row as occupying the whole day rather than silently ignoring it.
    if (start === null || end === null) return a;
    if (rangesOverlap(range.start, range.end, start, end)) return a;
  }
  return null;
}

export type WorkingHourRule = {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  breakStartTime: string | null;
  breakEndTime: string | null;
};

/** Whether `range` fits inside one working-hour rule (open, inside opening hours, clear of the break). */
export function fitsWorkingHour(rule: WorkingHourRule, range: TimeRange): boolean {
  if (!rule.isOpen) return false;
  const open = storedTimeToMinutes(rule.openTime);
  const close = storedTimeToMinutes(rule.closeTime);
  if (open === null || close === null || range.start < open || range.end > close) return false;
  const breakStart = rule.breakStartTime ? storedTimeToMinutes(rule.breakStartTime) : null;
  const breakEnd = rule.breakEndTime ? storedTimeToMinutes(rule.breakEndTime) : null;
  if (breakStart !== null && breakEnd !== null && rangesOverlap(range.start, range.end, breakStart, breakEnd)) return false;
  return true;
}

/**
 * Employees who may perform a service — the same rule as the booking wizard and available-slots:
 * once any employee has explicit service assignments, employees without assignments still count as "all
 * services", and employees with assignments only for their own services.
 */
export function employeesForService<E extends { employeeServices: { serviceId: string }[] }>(employees: E[], serviceId: string): E[] {
  const hasAssignments = employees.some((e) => e.employeeServices.length > 0);
  if (!hasAssignments) return employees;
  return employees.filter((e) => e.employeeServices.length === 0 || e.employeeServices.some((es) => es.serviceId === serviceId));
}
