// Employee/table overlap rules of POST/PATCH /api/appointments against the real app and the TEST database.
// Run via `node scripts/test-env/run-http-tests.mjs tests/appointments-http/conflicts.test.ts`.
import { after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import { cleanup, createUser, prisma, resetAuthRateLimits } from "../mobile-auth/helpers";

const BASE = process.env.MOBILE_API_BASE;
if (!BASE) throw new Error("Run via `node scripts/test-env/run-http-tests.mjs`.");

after(cleanup);
beforeEach(resetAuthRateLimits);

const DATE = "2099-03-02";

type Res = { status: number; body: Record<string, any> };

async function call(method: string, path: string, opts: { token?: string; body?: unknown } = {}): Promise<Res> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  const r = await fetch(BASE + path, { method, headers, body: opts.body === undefined ? undefined : JSON.stringify(opts.body) });
  let body: Record<string, any> = {};
  try { body = await r.json(); } catch {}
  return { status: r.status, body };
}

/** Business open every day 09:00–19:00 with a 13:00–14:00 break, two services, employees A and B. */
async function setupBusiness() {
  const pw = crypto.randomBytes(12).toString("base64url");
  const user = await createUser({ password: pw });
  const business = await prisma.business.findFirstOrThrow({ where: { userId: user.id } });
  await prisma.workingHour.createMany({
    data: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
      businessId: business.id, dayOfWeek, isOpen: true, openTime: "09:00", closeTime: "19:00", breakStartTime: "13:00", breakEndTime: "14:00",
    })),
  });
  const s30 = await prisma.service.create({ data: { businessId: business.id, name: "Kesim", durationMinutes: 30, price: 100 } });
  const s60 = await prisma.service.create({ data: { businessId: business.id, name: "Boya", durationMinutes: 60, price: 300 } });
  const empA = await prisma.employee.create({ data: { businessId: business.id, name: "Usta A", specialty: "Saç", createdAt: new Date("2000-01-01") } });
  const empB = await prisma.employee.create({ data: { businessId: business.id, name: "Usta B", specialty: "Saç", createdAt: new Date("2000-01-02") } });
  return { user, pw, business, s30, s60, empA, empB };
}

type Biz = Awaited<ReturnType<typeof setupBusiness>>;

async function ownerToken(b: Biz) {
  const r = await call("POST", "/api/mobile/auth/login", { body: { email: b.user.email, password: b.pw } });
  assert.equal(r.status, 200, "owner login");
  return r.body.accessToken as string;
}

function book(b: Biz, over: Record<string, unknown> = {}, token?: string) {
  return call("POST", "/api/appointments", {
    token,
    body: {
      businessId: b.business.id, serviceId: b.s30.id, employeeId: b.empA.id, date: DATE, startTime: "10:00",
      customerName: "Test Müşteri", customerPhone: "05550000001", ...over,
    },
  });
}

const activeCount = (b: Biz, employeeId: string) =>
  prisma.appointment.count({ where: { businessId: b.business.id, employeeId, date: DATE, status: { in: ["PENDING", "CONFIRMED"] } } });

test("same employee, same time → 409 EMPLOYEE_TIME_CONFLICT", async () => {
  const b = await setupBusiness();
  assert.equal((await book(b)).status, 200);
  const r = await book(b, { customerPhone: "05550000002" });
  assert.equal(r.status, 409);
  assert.equal(r.body.code, "EMPLOYEE_TIME_CONFLICT");
  assert.equal(typeof r.body.error, "string");
  assert.equal(await activeCount(b, b.empA.id), 1);
});

test("same employee, partially overlapping times → 409 both ways", async () => {
  const b = await setupBusiness();
  assert.equal((await book(b, { serviceId: b.s60.id })).status, 200); // 10:00–11:00
  assert.equal((await book(b, { startTime: "10:30" })).body.code, "EMPLOYEE_TIME_CONFLICT", "starts inside");
  assert.equal((await book(b, { serviceId: b.s60.id, startTime: "09:30" })).body.code, "EMPLOYEE_TIME_CONFLICT", "ends inside");
  assert.equal(await activeCount(b, b.empA.id), 1);
});

test("same employee, fully contained or enclosing times → 409", async () => {
  const b = await setupBusiness();
  assert.equal((await book(b, { startTime: "15:30" })).status, 200); // 15:30–16:00
  const enclosing = await book(b, { serviceId: b.s60.id, startTime: "15:00" }); // 15:00–16:00
  assert.equal(enclosing.status, 409, "encloses the existing one");
  assert.equal((await book(b, { serviceId: b.s60.id, startTime: "16:00" })).status, 200); // 16:00–17:00
  const inside = await book(b, { startTime: "16:15" }); // 16:15–16:45
  assert.equal(inside.status, 409, "fully inside the existing one");
  assert.equal(inside.body.code, "EMPLOYEE_TIME_CONFLICT");
});

test("same employee, back-to-back times are allowed", async () => {
  const b = await setupBusiness();
  assert.equal((await book(b, { serviceId: b.s60.id })).status, 200); // 10:00–11:00
  assert.equal((await book(b, { startTime: "11:00" })).status, 200, "starts when the other ends");
  assert.equal((await book(b, { startTime: "09:30" })).status, 200, "ends when the other starts");
  assert.equal(await activeCount(b, b.empA.id), 3);
});

test("different employees may share the same time", async () => {
  const b = await setupBusiness();
  assert.equal((await book(b)).status, 200);
  const r = await book(b, { employeeId: b.empB.id, customerPhone: "05550000002" });
  assert.equal(r.status, 200);
  assert.equal(r.body.appointment.employeeId, b.empB.id);
});

test('"any" employee picks a free one, and 409 NO_AVAILABLE_EMPLOYEE when all are busy', async () => {
  const b = await setupBusiness();
  assert.equal((await book(b)).status, 200); // A busy at 10:00
  const any = await book(b, { employeeId: "any", customerPhone: "05550000002" });
  assert.equal(any.status, 200);
  assert.equal(any.body.appointment.employeeId, b.empB.id, "skips the busy first employee");
  const none = await book(b, { employeeId: "any", customerPhone: "05550000003" });
  assert.equal(none.status, 409);
  assert.equal(none.body.code, "NO_AVAILABLE_EMPLOYEE");
});

test("cancelled appointments free the time; re-activating one that now overlaps is refused", async () => {
  const b = await setupBusiness();
  const first = await book(b);
  await prisma.appointment.update({ where: { id: first.body.appointment.id }, data: { status: "CANCELLED" } });
  assert.equal((await book(b, { customerPhone: "05550000002" })).status, 200, "cancelled one does not block");

  const token = await ownerToken(b);
  const reactivate = await call("PATCH", "/api/appointments", { token, body: { id: first.body.appointment.id, status: "CONFIRMED" } });
  assert.equal(reactivate.status, 409);
  assert.equal(reactivate.body.code, "EMPLOYEE_TIME_CONFLICT");
  assert.equal((await prisma.appointment.findUniqueOrThrow({ where: { id: first.body.appointment.id } })).status, "CANCELLED");
});

test("status changes that don't take new time keep working (mobile/web confirm, complete, cancel)", async () => {
  const b = await setupBusiness();
  const token = await ownerToken(b);
  const a = await book(b);
  const id = a.body.appointment.id;
  for (const status of ["CONFIRMED", "COMPLETED", "CANCELLED"]) {
    const r = await call("PATCH", "/api/appointments", { token, body: { id, status } });
    assert.equal(r.status, 200, status);
  }
  // Nothing overlaps now, so re-activating is allowed.
  assert.equal((await call("PATCH", "/api/appointments", { token, body: { id, status: "PENDING" } })).status, 200);
});

test("closed slots block bookings; reopened ones don't; owners may close time that has bookings", async () => {
  const b = await setupBusiness();
  const token = await ownerToken(b);
  const closed = await book(b, { serviceId: b.s60.id, startTime: "15:00", isBlockedSlot: true, customerName: "[KAPALI: Toplantı]", customerPhone: "0000000000" }, token);
  assert.equal(closed.status, 200);
  const blocked = await book(b, { startTime: "15:30" });
  assert.equal(blocked.status, 409, "public booking on a closed slot");
  assert.equal(blocked.body.code, "EMPLOYEE_TIME_CONFLICT");

  await call("PATCH", "/api/appointments", { token, body: { id: closed.body.appointment.id, status: "CANCELLED" } }); // "Saati aç"
  assert.equal((await book(b, { startTime: "15:30" })).status, 200, "reopened slot is bookable");

  // Closing time that already has a booking is allowed (it is not a second booking).
  const closeOver = await book(b, { startTime: "15:30", isBlockedSlot: true, customerName: "[KAPALI: x]", customerPhone: "0000000000" }, token);
  assert.equal(closeOver.status, 200);
  // Public cannot close slots at all.
  assert.equal((await book(b, { startTime: "17:00", isBlockedSlot: true })).status, 403);
});

test("concurrent requests for the same employee and time: exactly one succeeds", async () => {
  const b = await setupBusiness();
  const results = await Promise.all(
    Array.from({ length: 8 }, (_, i) => book(b, { startTime: "11:00", customerPhone: `0555100000${i}` }))
  );
  const statuses = results.map((r) => r.status).sort();
  assert.deepEqual(statuses, [200, 409, 409, 409, 409, 409, 409, 409], statuses.join(","));
  assert.equal(await activeCount(b, b.empA.id), 1);
  // Rejected requests left no customer records or spend behind.
  assert.equal(await prisma.customer.count({ where: { businessId: b.business.id } }), 1);
});

test("concurrent requests for different employees at the same time all succeed", async () => {
  const b = await setupBusiness();
  const results = await Promise.all([
    book(b, { startTime: "12:00", customerPhone: "05552000001" }),
    book(b, { startTime: "12:00", employeeId: b.empB.id, customerPhone: "05552000002" }),
  ]);
  assert.deepEqual(results.map((r) => r.status), [200, 200]);
});

test("concurrent overlapping (not identical) requests: one succeeds", async () => {
  const b = await setupBusiness();
  const results = await Promise.all([
    book(b, { serviceId: b.s60.id, startTime: "16:00", customerPhone: "05553000001" }), // 16:00–17:00
    book(b, { startTime: "16:30", customerPhone: "05553000002" }), // 16:30–17:00
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
});

test("businesses are isolated: same time elsewhere is fine, other businesses' staff can't be booked", async () => {
  const x = await setupBusiness();
  const y = await setupBusiness();
  assert.equal((await book(x)).status, 200);
  assert.equal((await book(y)).status, 200, "same time, other business");
  const foreign = await book(y, { employeeId: x.empA.id, customerPhone: "05554000001" });
  assert.equal(foreign.status, 400, "employee of another business");
  assert.equal(await activeCount(x, x.empA.id), 1);
});

test("public bookings respect working hours; the owner may book outside them", async () => {
  const b = await setupBusiness();
  const lunch = await book(b, { startTime: "13:30" });
  assert.equal(lunch.status, 400);
  assert.equal(lunch.body.code, "OUTSIDE_WORKING_HOURS");
  assert.equal((await book(b, { serviceId: b.s60.id, startTime: "18:30" })).body.code, "OUTSIDE_WORKING_HOURS", "runs past closing");
  const token = await ownerToken(b);
  assert.equal((await book(b, { startTime: "20:00" }, token)).status, 200, "owner walk-in after hours");
  assert.equal((await book(b, { startTime: "20:00", customerPhone: "05555000002" }, token)).status, 409, "but still no overlap");
});

test("invalid date/time input → 400 INVALID_DATE_TIME", async () => {
  const b = await setupBusiness();
  for (const over of [{ startTime: "25:00" }, { startTime: "9:00" }, { date: "2099-02-30" }, { startTime: "23:45", serviceId: b.s60.id }]) {
    const r = await book(b, over);
    assert.equal(r.status, 400, JSON.stringify(over));
  }
});

test("tables: overlapping booking of the same table → 409 TABLE_TIME_CONFLICT; another table is fine", async () => {
  const b = await setupBusiness();
  const t1 = await prisma.restaurantTable.create({ data: { businessId: b.business.id, name: "Masa 1" } });
  const t2 = await prisma.restaurantTable.create({ data: { businessId: b.business.id, name: "Masa 2" } });
  assert.equal((await book(b, { tableId: t1.id, serviceId: b.s60.id })).status, 200);
  const same = await book(b, { tableId: t1.id, employeeId: b.empB.id, startTime: "10:30", customerPhone: "05556000002" });
  assert.equal(same.status, 409);
  assert.equal(same.body.code, "TABLE_TIME_CONFLICT");
  assert.equal((await book(b, { tableId: t2.id, employeeId: b.empB.id, startTime: "10:30", customerPhone: "05556000003" })).status, 200);
});

test("available-slots and POST agree: a taken slot is not offered for that employee", async () => {
  const b = await setupBusiness();
  assert.equal((await book(b)).status, 200);
  const q = new URLSearchParams({ businessId: b.business.id, date: DATE, serviceId: b.s30.id, employeeId: b.empA.id });
  const slots = (await call("GET", `/api/appointments/available-slots?${q}`)).body.slots as string[];
  assert.ok(!slots.includes("10:00"));
  assert.ok(slots.includes("10:30"));
  assert.equal((await book(b, { startTime: "10:30", customerPhone: "05557000002" })).status, 200, "an offered slot can be booked");
});
