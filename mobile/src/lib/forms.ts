import { t } from '../i18n/core';
// Form input rules for the mobile screens. Pure TypeScript with no imports, so it is unit-tested from the
// repo root (tests/mobile-client). The server validates again; these give quick, specific feedback.

/** Strict "HH:mm" (00:00–23:59), the format the API accepts. */
export function isTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value.trim());
}

/** Lenient typing help: "930" → "09:30", "9:5" → "09:05"; returns the input unchanged when unclear. */
export function normalizeTime(value: string): string {
  const v = value.trim();
  let m = v.match(/^(\d{1,2})[:.](\d{1,2})$/);
  if (!m) m = v.match(/^(\d{1,2})(\d{2})$/);
  if (!m) return v;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return v;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

const toMinutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));

export type HoursDraft = {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  breakStartTime: string;
  breakEndTime: string;
};

/** Problem with one day's working hours in Turkish, or null when it is fine. */
export function hoursProblem(day: HoursDraft): string | null {
  if (!day.isOpen) return null;
  if (!isTime(day.openTime) || !isTime(day.closeTime)) return t('Açılış ve kapanış saatini SS:DD biçiminde girin.');
  if (toMinutes(day.openTime) >= toMinutes(day.closeTime)) return t('Açılış saati kapanıştan önce olmalı.');
  const hasStart = day.breakStartTime.trim() !== '';
  const hasEnd = day.breakEndTime.trim() !== '';
  if (hasStart !== hasEnd) return t('Mola için başlangıç ve bitiş saatini birlikte girin (ya da ikisini de boş bırakın).');
  if (hasStart) {
    if (!isTime(day.breakStartTime) || !isTime(day.breakEndTime)) return t('Mola saatlerini SS:DD biçiminde girin.');
    const bs = toMinutes(day.breakStartTime);
    const be = toMinutes(day.breakEndTime);
    if (bs >= be) return t('Mola başlangıcı bitişten önce olmalı.');
    if (bs < toMinutes(day.openTime) || be > toMinutes(day.closeTime)) return t('Mola, çalışma saatlerinin içinde olmalı.');
  }
  return null;
}

/** "1.250,50" / "1250.5" / "1250" → 1250.5; null when not a non-negative amount. */
export function parsePrice(value: string): number | null {
  let v = value.trim().replace(/\s|₺/g, '');
  if (!v) return null;
  if (v.includes(',')) v = v.replace(/\./g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(v)) return null;
  return Number(v);
}

/** Whole minutes between 1 and 1440, or null. */
export function parseDuration(value: string): number | null {
  const v = value.trim();
  if (!/^\d{1,4}$/.test(v)) return null;
  const n = Number(v);
  return n >= 1 && n <= 24 * 60 ? n : null;
}

/** Turkish phone numbers: at least 10 digits once spaces and punctuation are removed. */
export function isPhone(value: string): boolean {
  return value.replace(/\D/g, '').length >= 10;
}

/** Empty or a plausible e-mail address. */
export function isOptionalEmail(value: string): boolean {
  const v = value.trim();
  return v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
