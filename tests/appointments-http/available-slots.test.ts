// "Today / past" handling of GET /api/appointments/available-slots, independent of the server's time zone.
// Run the app in UTC like Vercel to reproduce production:
//   TZ=UTC node scripts/test-env/run-http-tests.mjs tests/appointments-http/available-slots.test.ts
import { after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import { cleanup, createUser, prisma, resetAuthRateLimits } from "../mobile-auth/helpers";

const BASE = process.env.MOBILE_API_BASE;
if (!BASE) throw new Error("Run via `node scripts/test-env/run-http-tests.mjs`.");

after(cleanup);
beforeEach(resetAuthRateLimits);

// Türkiye is UTC+3 all year (no DST since 2016). Computed here without the app's code on purpose.
function turkeyNow() {
  const d = new Date(Date.now() + 3 * 60 * 60 * 1000);
  return { dateKey: d.toISOString().slice(0, 10), minutes: d.getUTCHours() * 60 + d.getUTCMinutes() };
}

function shiftDays(dateKey: string, days: number) {
  const d = new Date(`${dateKey}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const toMinutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));

/** Open 00:00–23:59 every day, no break, so "today" is testable at any time of day. */
async function setupBusiness() {
  const pw = crypto.randomBytes(12).toString("base64url");
  const user = await createUser({ password: pw });
  const business = await prisma.business.findFirstOrThrow({ where: { userId: user.id } });
  await prisma.workingHour.createMany({
    data: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
      businessId: business.id, dayOfWeek, isOpen: true, openTime: "00:00", closeTime: "23:59", breakStartTime: null, breakEndTime: null,
    })),
  });
  const service = await prisma.service.create({ data: { businessId: business.id, name: "Kesim", durationMinutes: 30, price: 100 } });
  const employee = await prisma.employee.create({ data: { businessId: business.id, name: "Usta", specialty: "Saç" } });
  return { user, pw, business, service, employee };
}

type Biz = Awaited<ReturnType<typeof setupBusiness>>;

async function slots(b: Biz, date: string) {
  const q = new URLSearchParams({ businessId: b.business.id, date, serviceId: b.service.id, employeeId: "any" });
  const r = await fetch(`${BASE}/api/appointments/available-slots?${q}`);
  return { status: r.status, body: (await r.json()) as { slots?: string[]; message?: string; error?: string } };
}

test("today (Türkiye time): no past slots, and no future slot is missing", async () => {
  const b = await setupBusiness();
  const before = turkeyNow();
  const r = await slots(b, before.dateKey);
  const afterNow = turkeyNow();
  if (afterNow.dateKey !== before.dateKey) return; // ran exactly across midnight; nothing meaningful to check

  assert.equal(r.status, 200);
  const list = r.body.slots ?? [];
  for (const s of list) {
    assert.ok(toMinutes(s) > before.minutes + 15, `${s} is in the past or within 15 minutes (Türkiye now ${before.minutes} min)`);
  }
  // The first slot still offered must be the first 30-minute step after "now + 15 min".
  const firstValid = (Math.floor((afterNow.minutes + 15) / 30) + 1) * 30;
  if (firstValid + 30 <= toMinutes("23:59")) {
    assert.ok(list.length > 0, "future slots exist today");
    assert.ok(toMinutes(list[0]) <= firstValid, `first slot ${list[0]} skips valid times`);
  } else {
    assert.deepEqual(list, [], "too late in the day for any slot");
  }
});

test("past dates offer no slots", async () => {
  const b = await setupBusiness();
  const today = turkeyNow().dateKey;
  for (const date of [shiftDays(today, -1), "2020-01-01"]) {
    const r = await slots(b, date);
    assert.equal(r.status, 200);
    assert.deepEqual(r.body.slots, [], date);
  }
});

test("future dates offer the whole day", async () => {
  const b = await setupBusiness();
  const r = await slots(b, shiftDays(turkeyNow().dateKey, 1));
  assert.equal(r.status, 200);
  const list = r.body.slots ?? [];
  assert.equal(list[0], "00:00");
  assert.equal(list.at(-1), "23:00", "last 30-minute slot that ends before 23:59");
  assert.equal(list.length, 47);
});

test("invalid dates are a 400, not a server error", async () => {
  const b = await setupBusiness();
  for (const date of ["2099-02-30", "yarın", "2099-1-1"]) {
    assert.equal((await slots(b, date)).status, 400, date);
  }
});

test("existing bookings keep their stored date/time and block their slot", async () => {
  const b = await setupBusiness();
  const date = shiftDays(turkeyNow().dateKey, 2);
  const created = await fetch(`${BASE}/api/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      businessId: b.business.id, serviceId: b.service.id, employeeId: b.employee.id, date, startTime: "10:00",
      customerName: "Test Müşteri", customerPhone: "05559000001",
    }),
  });
  assert.equal(created.status, 200);
  const stored = await prisma.appointment.findFirstOrThrow({ where: { businessId: b.business.id } });
  assert.deepEqual([stored.date, stored.startTime, stored.endTime], [date, "10:00", "10:30"]);
  const list = (await slots(b, date)).body.slots ?? [];
  assert.ok(!list.includes("10:00"));
  assert.ok(list.includes("09:30") && list.includes("10:30"));
});
