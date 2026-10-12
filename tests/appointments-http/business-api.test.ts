// Business API fixes used by the mobile screens, against the real app and the TEST database.
// Run via `node scripts/test-env/run-http-tests.mjs tests/appointments-http/business-api.test.ts`.
import { after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import { cleanup, createUser, prisma, resetAuthRateLimits } from "../mobile-auth/helpers";

const BASE = process.env.MOBILE_API_BASE;
if (!BASE) throw new Error("Run via `node scripts/test-env/run-http-tests.mjs`.");

after(cleanup);
beforeEach(resetAuthRateLimits);

type Res = { status: number; body: Record<string, any> };

async function call(method: string, path: string, opts: { token?: string; body?: unknown } = {}): Promise<Res> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  const r = await fetch(BASE + path, { method, headers, body: opts.body === undefined ? undefined : JSON.stringify(opts.body) });
  let body: Record<string, any> = {};
  try { body = await r.json(); } catch {}
  return { status: r.status, body };
}

async function owner() {
  const pw = crypto.randomBytes(12).toString("base64url");
  const user = await createUser({ password: pw });
  const business = await prisma.business.findFirstOrThrow({ where: { userId: user.id } });
  const login = await call("POST", "/api/mobile/auth/login", { body: { email: user.email, password: pw } });
  assert.equal(login.status, 200, "owner login");
  await prisma.workingHour.createMany({
    data: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
      businessId: business.id, dayOfWeek, isOpen: true, openTime: "00:00", closeTime: "23:59", breakStartTime: null, breakEndTime: null,
    })),
  });
  const service = await prisma.service.create({ data: { businessId: business.id, name: "Kesim", durationMinutes: 30, price: 100 } });
  const employee = await prisma.employee.create({ data: { businessId: business.id, name: "Usta", specialty: "Saç" } });
  return { user, business, service, employee, token: login.body.accessToken as string };
}

function book(o: Awaited<ReturnType<typeof owner>>, date: string, startTime: string, token?: string) {
  return call("POST", "/api/appointments", {
    token,
    body: {
      businessId: o.business.id, serviceId: o.service.id, employeeId: o.employee.id, date, startTime,
      customerName: "Test Müşteri", customerPhone: "05550000001",
    },
  });
}

test("working hours of another business cannot be changed", async () => {
  const a = await owner();
  const b = await owner();
  const victim = await prisma.workingHour.findFirstOrThrow({ where: { businessId: b.business.id, dayOfWeek: 1 } });
  const r = await call("PUT", "/api/business/settings", {
    token: a.token,
    body: { workingHours: [{ id: victim.id, isOpen: false, openTime: "09:00", closeTime: "10:00", breakStartTime: null, breakEndTime: null }] },
  });
  assert.equal(r.status, 200);
  const after = await prisma.workingHour.findUniqueOrThrow({ where: { id: victim.id } });
  assert.deepEqual([after.isOpen, after.openTime, after.closeTime], [true, "00:00", "23:59"], "other business untouched");

  const own = await prisma.workingHour.findFirstOrThrow({ where: { businessId: a.business.id, dayOfWeek: 1 } });
  const ok = await call("PUT", "/api/business/settings", {
    token: a.token,
    body: { workingHours: [{ id: own.id, isOpen: true, openTime: "09:00", closeTime: "18:00", breakStartTime: "", breakEndTime: "" }] },
  });
  assert.equal(ok.status, 200);
  const mine = await prisma.workingHour.findUniqueOrThrow({ where: { id: own.id } });
  assert.deepEqual([mine.openTime, mine.closeTime, mine.breakStartTime], ["09:00", "18:00", null]);

  const bad = await call("PUT", "/api/business/settings", {
    token: a.token,
    body: { workingHours: [{ id: own.id, isOpen: true, openTime: "18:00", closeTime: "09:00" }] },
  });
  assert.equal(bad.status, 400, "opening after closing");
});

test("services and employees with bookings are not deleted (that would delete the bookings)", async () => {
  const o = await owner();
  assert.equal((await book(o, "2099-05-04", "10:00")).status, 200);
  const s = await call("DELETE", `/api/services?id=${o.service.id}`, { token: o.token });
  assert.equal(s.status, 409);
  assert.equal(s.body.code, "HAS_APPOINTMENTS");
  const e = await call("DELETE", `/api/employees?id=${o.employee.id}`, { token: o.token });
  assert.equal(e.status, 409);
  assert.equal(await prisma.appointment.count({ where: { businessId: o.business.id } }), 1, "booking kept");

  const unused = await prisma.service.create({ data: { businessId: o.business.id, name: "Boş", durationMinutes: 15, price: 0 } });
  assert.equal((await call("DELETE", `/api/services?id=${unused.id}`, { token: o.token })).status, 200, "unused service can go");
});

test("assignments: only own records are linked, and PUT replaces them", async () => {
  const a = await owner();
  const b = await owner();
  const created = await call("POST", "/api/services", {
    token: a.token,
    body: { name: "Boya", durationMinutes: 60, price: 300, employeeIds: [a.employee.id, b.employee.id] },
  });
  assert.equal(created.status, 200);
  const links = await prisma.employeeService.findMany({ where: { serviceId: created.body.service.id } });
  assert.deepEqual(links.map((l) => l.employeeId), [a.employee.id], "other business's employee ignored");

  const put = await call("PUT", "/api/employees", { token: a.token, body: { id: a.employee.id, serviceIds: [a.service.id, b.service.id] } });
  assert.equal(put.status, 200);
  const mine = await prisma.employeeService.findMany({ where: { employeeId: a.employee.id } });
  assert.deepEqual(mine.map((l) => l.serviceId), [a.service.id], "replaced with own services only");
  assert.equal(put.body.employee.employeeServices.length, 1, "response carries the new assignments");

  const bad = await call("POST", "/api/services", { token: a.token, body: { name: "X", durationMinutes: "abc", price: 1 } });
  assert.equal(bad.status, 400, "invalid duration");
});

test("customers can't book a time that has passed; the owner can (walk-in)", async () => {
  const o = await owner();
  const past = await book(o, "2020-01-01", "10:00");
  assert.equal(past.status, 400);
  assert.equal(past.body.code, "PAST_DATE_TIME");
  assert.equal((await book(o, "2020-01-01", "10:00", o.token)).status, 200, "owner may record it");
});

test("appointment list paging: limit/offset with hasMore; no limit returns everything", async () => {
  const o = await owner();
  for (const t of ["09:00", "10:00", "11:00", "12:00", "13:00"]) assert.equal((await book(o, "2099-06-01", t)).status, 200);

  const first = await call("GET", "/api/appointments?limit=2&offset=0", { token: o.token });
  assert.equal(first.status, 200);
  assert.equal(first.body.appointments.length, 2);
  assert.equal(first.body.hasMore, true);
  const rest = await call("GET", "/api/appointments?limit=10&offset=2", { token: o.token });
  assert.equal(rest.body.appointments.length, 3);
  assert.equal(rest.body.hasMore, false);
  const ids = [...first.body.appointments, ...rest.body.appointments].map((a: { id: string }) => a.id);
  assert.equal(new Set(ids).size, 5, "pages don't overlap");

  const all = await call("GET", "/api/appointments", { token: o.token });
  assert.equal(all.body.appointments.length, 5);
  assert.equal(all.body.hasMore, undefined, "unpaged response unchanged");

  const search = await call("GET", "/api/appointments?search=test%20m%C3%BC%C5%9Fteri&limit=10", { token: o.token });
  assert.equal(search.body.appointments.length, 5, "search ignores case");
});
