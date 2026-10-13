import { t } from '../i18n/core';
// Appointment rules shared by the mobile screens. Pure TypeScript with relative imports only, so it is
// unit-tested from the repo root (tests/mobile-client). Mirrors the web app's rules.

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

/** The fields of GET /api/appointments that the app uses. */
export type Appointment = {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;
  status: AppointmentStatus;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  notes: string | null;
  price: number;
  sectorData: string | null;
  isBlockedSlot: boolean;
  service: { name: string; durationMinutes: number } | null;
  employee: { name: string } | null;
  table: { name: string; area: { name: string } | null } | null;
};

export type StatusTone = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'blocked';

// Same labels as src/lib/appointmentStatus.ts on the web.
export const STATUS_META: Record<AppointmentStatus, { label: string; tone: StatusTone }> = {
  PENDING: { label: t('Onay bekliyor'), tone: 'pending' },
  CONFIRMED: { label: t('Onaylandı'), tone: 'confirmed' },
  COMPLETED: { label: t('Tamamlandı'), tone: 'completed' },
  CANCELLED: { label: t('İptal edildi'), tone: 'cancelled' },
};

export function statusMeta(a: Pick<Appointment, 'status' | 'isBlockedSlot'>): { label: string; tone: StatusTone } {
  if (a.isBlockedSlot) return a.status === 'CANCELLED' ? { label: t('Açıldı'), tone: 'cancelled' } : { label: t('Kapalı saat'), tone: 'blocked' };
  return STATUS_META[a.status] ?? STATUS_META.PENDING;
}

export type StatusAction = { status: AppointmentStatus; label: string; destructive?: boolean };

/**
 * Actions offered for an appointment — the same transitions as the web appointments list:
 * PENDING → Onayla, CONFIRMED → Tamamla, and İptal et for anything not already cancelled.
 * A closed slot can only be reopened (cancelled).
 */
export function availableActions(a: Pick<Appointment, 'status' | 'isBlockedSlot'>): StatusAction[] {
  if (a.isBlockedSlot) return a.status === 'CANCELLED' ? [] : [{ status: 'CANCELLED', label: t('Saati aç'), destructive: true }];
  const actions: StatusAction[] = [];
  if (a.status === 'PENDING') actions.push({ status: 'CONFIRMED', label: t('Onayla') });
  if (a.status === 'CONFIRMED') actions.push({ status: 'COMPLETED', label: t('Tamamla') });
  if (a.status !== 'CANCELLED') actions.push({ status: 'CANCELLED', label: t('İptal et'), destructive: true });
  return actions;
}

const byTime = (a: Appointment, b: Appointment) => a.startTime.localeCompare(b.startTime);

/** Appointments of one day in time order. */
export function forDay(list: Appointment[], date: string): Appointment[] {
  return list.filter((a) => a.date === date).sort(byTime);
}

export type DaySummary = {
  total: number; // real bookings (not cancelled, not closed slots)
  pending: number;
  completed: number;
  revenue: number; // expected income: not cancelled, not closed slots
  upcoming: Appointment[]; // pending/confirmed from `nowTime` on
};

export function summarizeDay(list: Appointment[], date: string, nowTime: string): DaySummary {
  const day = forDay(list, date).filter((a) => !a.isBlockedSlot);
  const active = day.filter((a) => a.status !== 'CANCELLED');
  return {
    total: active.length,
    pending: day.filter((a) => a.status === 'PENDING').length,
    completed: day.filter((a) => a.status === 'COMPLETED').length,
    revenue: active.reduce((sum, a) => sum + (Number(a.price) || 0), 0),
    upcoming: day.filter((a) => (a.status === 'PENDING' || a.status === 'CONFIRMED') && a.endTime > nowTime),
  };
}

/** Client-side search over customer name and phone (digits only for phones). */
export function matchesSearch(a: Appointment, query: string): boolean {
  const q = query.trim().toLocaleLowerCase('tr-TR');
  if (!q) return true;
  if (a.customerName.toLocaleLowerCase('tr-TR').includes(q)) return true;
  const digits = q.replace(/\D/g, '');
  return digits.length > 0 && a.customerPhone.replace(/\D/g, '').includes(digits);
}

/** Short sector details the booking wizard stores (guest count, table, plate). */
export function sectorDetails(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const d = JSON.parse(raw) as Record<string, unknown>;
    const out: string[] = [];
    if (d.guestCount) out.push(t('{0} kişi', String(d.guestCount)));
    if (d.tableName) out.push(d.areaName ? `${d.areaName} · ${d.tableName}` : String(d.tableName));
    if (d.plateNumber) out.push(String(d.plateNumber).toUpperCase());
    return out;
  } catch {
    return [];
  }
}

// ---- Dates (local calendar, like the web app's YYYY-MM-DD strings) ----

const pad = (n: number) => String(n).padStart(2, '0');

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "2026-10-10" → local Date at midnight; null for anything else. */
export function fromDateKey(key: string | undefined | null): Date | null {
  const m = key?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return dateKey(d) === key ? d : null;
}

/**
 * Employees who may perform a service — the web booking wizard's rule: once anyone has explicit
 * assignments, staff without assignments still count as "all services".
 */
export function employeesForService<E extends { employeeServices: { service: { id: string } }[] }>(employees: E[], serviceId: string): E[] {
  if (!employees.some((e) => e.employeeServices.length > 0)) return employees;
  return employees.filter((e) => e.employeeServices.length === 0 || e.employeeServices.some((es) => es.service.id === serviceId));
}

export function timeKey(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function addDays(d: Date, days: number): Date {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** Monday-first week containing `d`. */
export function weekOf(d: Date): Date[] {
  const mondayOffset = (d.getDay() + 6) % 7;
  const monday = addDays(d, -mondayOffset);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

const DAYS_SHORT = [t('Paz'), t('Pzt'), t('Sal'), t('Çar'), t('Per'), t('Cum'), t('Cmt')];
const DAYS_LONG = [t('Pazar'), t('Pazartesi'), t('Salı'), t('Çarşamba'), t('Perşembe'), t('Cuma'), t('Cumartesi')];
const MONTHS = [t('Ocak'), t('Şubat'), t('Mart'), t('Nisan'), t('Mayıs'), t('Haziran'), t('Temmuz'), t('Ağustos'), t('Eylül'), t('Ekim'), t('Kasım'), t('Aralık')];

export const shortDayName = (d: Date) => DAYS_SHORT[d.getDay()];

/** "10 Ekim Cuma" */
export function longDate(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${DAYS_LONG[d.getDay()]}`;
}

/** "2026-10-10" → "10 Ekim" */
export function shortDateFromKey(key: string): string {
  const [y, m, day] = key.split('-').map(Number);
  return y && m && day ? `${day} ${MONTHS[m - 1]}` : key;
}

/** "1.250 ₺" — no Intl dependency. */
export function formatPrice(value: number): string {
  const rounded = Math.round(value);
  return `${String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} ₺`;
}
