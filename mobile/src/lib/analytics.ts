import { t, tc } from '../i18n/core';
// Statistics of the "İstatistikler" screen — the same metrics as the web analytics page.
// Pure TypeScript with no imports, so it is unit-tested from the repo root (tests/mobile-client).

type Booking = { date: string; startTime: string; status: string; price: number };

export const DAY_NAMES = [t('Pazartesi'), t('Salı'), t('Çarşamba'), t('Perşembe'), t('Cuma'), t('Cumartesi'), t('Pazar')];

/** 0 = Pazartesi … 6 = Pazar for a "YYYY-MM-DD" key, independent of the device time zone. */
function mondayIndex(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

export function computeAnalytics(bookings: Booking[], customers: { totalAppointments: number }[]) {
  // Revenue counts confirmed and completed bookings, as on the web.
  const earning = bookings.filter((a) => a.status === 'COMPLETED' || a.status === 'CONFIRMED');
  const totalRevenue = earning.reduce((acc, a) => acc + (Number(a.price) || 0), 0);

  const byDay = DAY_NAMES.map(() => 0);
  for (const a of bookings) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(a.date)) byDay[mondayIndex(a.date)]++;
  }

  // Start hours 09:00–20:00, like the web chart.
  const hours = Array.from({ length: 12 }, (_, i) => 9 + i);
  const byHour = hours.map((h) => bookings.filter((a) => Number(a.startTime?.split(':')[0]) === h).length);

  const peakDay = byDay.some((n) => n > 0) ? byDay.indexOf(Math.max(...byDay)) : null;
  const peakHour = byHour.some((n) => n > 0) ? hours[byHour.indexOf(Math.max(...byHour))] : null;

  return {
    totalRevenue,
    averageTicket: earning.length ? totalRevenue / earning.length : 0,
    totalBookings: bookings.length,
    earningCount: earning.length,
    repeatRate: customers.length ? Math.round((customers.filter((c) => c.totalAppointments > 1).length / customers.length) * 100) : 0,
    customerCount: customers.length,
    byDay,
    hours,
    byHour,
    peakDay: peakDay === null ? null : DAY_NAMES[peakDay],
    peakHour: peakHour === null ? null : `${String(peakHour).padStart(2, '0')}:00`,
  };
}

// ---- Period reports (İstatistikler screen) ----

type Detailed = Booking & { service?: { name: string } | null; employee?: { name: string } | null };

const pad = (n: number) => String(n).padStart(2, '0');
const keyOf = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const fromKey = (k: string) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
export const shiftKey = (k: string, days: number) => {
  const d = fromKey(k);
  d.setUTCDate(d.getUTCDate() + days);
  return keyOf(d);
};

const MONTHS_SHORT = [t('Oca'), t('Şub'), t('Mar'), t('Nis'), t('May'), t('Haz'), t('Tem'), t('Ağu'), t('Eyl'), t('Eki'), t('Kas'), tc('ay', 'Ara')];
const shortLabel = (k: string) => `${Number(k.slice(8, 10))} ${MONTHS_SHORT[Number(k.slice(5, 7)) - 1]}`;

const earns = (a: Booking) => a.status === 'COMPLETED' || a.status === 'CONFIRMED';

/**
 * Report for the `days` days ending today (inclusive), compared with the same length right before.
 * Daily points for up to 31 days, weekly points beyond that.
 */
export function periodReport(all: Detailed[], todayKey: string, days: number) {
  const from = shiftKey(todayKey, -(days - 1));
  const prevFrom = shiftKey(from, -days);
  const prevTo = shiftKey(from, -1);
  const inRange = (a: Booking, f: string, t: string) => a.date >= f && a.date <= t;
  const current = all.filter((a) => inRange(a, from, todayKey));
  const previous = all.filter((a) => inRange(a, prevFrom, prevTo));

  const sum = (list: Booking[]) => list.filter(earns).reduce((acc, a) => acc + (Number(a.price) || 0), 0);
  const revenue = sum(current);
  const prevRevenue = sum(previous);
  const active = (list: Booking[]) => list.filter((a) => a.status !== 'CANCELLED').length;

  const bucket = days > 31 ? 7 : 1;
  const series: { label: string; revenue: number; count: number }[] = [];
  for (let start = from; start <= todayKey; start = shiftKey(start, bucket)) {
    const end = bucket === 1 ? start : shiftKey(start, bucket - 1);
    const items = current.filter((a) => inRange(a, start, end));
    series.push({ label: shortLabel(start), revenue: sum(items), count: active(items) });
  }

  const status = {
    PENDING: current.filter((a) => a.status === 'PENDING').length,
    CONFIRMED: current.filter((a) => a.status === 'CONFIRMED').length,
    COMPLETED: current.filter((a) => a.status === 'COMPLETED').length,
    CANCELLED: current.filter((a) => a.status === 'CANCELLED').length,
  };

  const rank = (name: (a: Detailed) => string | undefined) => {
    const map = new Map<string, number>();
    for (const a of current) {
      if (a.status === 'CANCELLED') continue;
      const n = name(a);
      if (n) map.set(n, (map.get(n) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label, value]) => ({ label, value }));
  };

  const change = (now: number, before: number) => (before === 0 ? (now === 0 ? 0 : null) : Math.round(((now - before) / before) * 100));

  return {
    from,
    revenue,
    revenueChange: change(revenue, prevRevenue),
    bookings: active(current),
    bookingsChange: change(active(current), active(previous)),
    cancelRate: current.length ? Math.round((status.CANCELLED / current.length) * 100) : 0,
    averageTicket: current.filter(earns).length ? revenue / current.filter(earns).length : 0,
    series,
    status,
    topServices: rank((a) => a.service?.name),
    topEmployees: rank((a) => a.employee?.name),
    distribution: computeAnalytics(current.filter((a) => a.status !== 'CANCELLED'), []),
  };
}
