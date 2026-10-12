// Unit tests for mobile/src/lib/analytics.ts:
//   npx tsx --test tests/mobile-client/analytics.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { computeAnalytics } from "../../mobile/src/lib/analytics";

const b = (date: string, startTime: string, status: string, price: number) => ({ date, startTime, status, price });

test("revenue counts confirmed and completed bookings; repeat rate from customers", () => {
  const r = computeAnalytics(
    [b("2026-10-12", "10:00", "COMPLETED", 300), b("2026-10-12", "11:00", "CONFIRMED", 100), b("2026-10-13", "10:30", "CANCELLED", 999), b("2026-10-13", "12:00", "PENDING", 50)],
    [{ totalAppointments: 3 }, { totalAppointments: 1 }, { totalAppointments: 2 }, { totalAppointments: 1 }]
  );
  assert.equal(r.totalRevenue, 400);
  assert.equal(r.averageTicket, 200);
  assert.equal(r.totalBookings, 4);
  assert.equal(r.repeatRate, 50);
});

test("day and hour distribution follow the stored date and start time", () => {
  // 2026-10-12 is a Monday.
  const r = computeAnalytics([b("2026-10-12", "10:00", "PENDING", 0), b("2026-10-12", "10:30", "PENDING", 0), b("2026-10-18", "19:00", "PENDING", 0)], []);
  assert.equal(r.byDay[0], 2, "Pazartesi");
  assert.equal(r.byDay[6], 1, "Pazar");
  assert.equal(r.peakDay, "Pazartesi");
  assert.equal(r.byHour[r.hours.indexOf(10)], 2);
  assert.equal(r.peakHour, "10:00");
});

test("no data: zeros and no peak", () => {
  const r = computeAnalytics([], []);
  assert.deepEqual([r.totalRevenue, r.averageTicket, r.repeatRate, r.peakDay, r.peakHour], [0, 0, 0, null, null]);
});
