// Mobile Bearer tokens on the existing business APIs (getCurrentUser) vs. the unchanged web cookie flow.
// Run via `node scripts/test-env/run-http-tests.mjs`.
import { after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import { cleanup, createUser, prisma, resetAuthRateLimits } from "../mobile-auth/helpers";
import { signToken } from "../../src/lib/auth";

const BASE = process.env.MOBILE_API_BASE;
if (!BASE) throw new Error("Run via `node scripts/test-env/run-http-tests.mjs`.");

after(cleanup);
beforeEach(resetAuthRateLimits);

async function call(method: string, path: string, opts: { token?: string; cookie?: string; body?: unknown } = {}) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.token !== undefined) headers.Authorization = `Bearer ${opts.token}`;
  if (opts.cookie) headers.Cookie = opts.cookie;
  const r = await fetch(BASE + path, { method, headers, body: opts.body === undefined ? undefined : JSON.stringify(opts.body), redirect: "manual" });
  let body: Record<string, unknown> = {};
  try { body = await r.json(); } catch {}
  return { status: r.status, body, headers: r.headers };
}

/** Owner with one service, employee and appointment, plus mobile tokens and a web cookie. */
async function ownerWithAppointment() {
  const pw = crypto.randomBytes(12).toString("base64url");
  const user = await createUser({ password: pw });
  const business = await prisma.business.findFirstOrThrow({ where: { userId: user.id } });
  const service = await prisma.service.create({ data: { businessId: business.id, name: "Kesim", durationMinutes: 30, price: 100 } });
  const employee = await prisma.employee.create({ data: { businessId: business.id, name: "Usta", specialty: "Saç" } });
  const appointment = await prisma.appointment.create({
    data: {
      businessId: business.id, serviceId: service.id, employeeId: employee.id,
      date: "2099-01-05", startTime: "10:00", endTime: "10:30", customerName: "Test Müşteri", customerPhone: "0", price: 100,
    },
  });
  const mobile = (await call("POST", "/api/mobile/auth/login", { body: { email: user.email, password: pw } })).body as { accessToken: string; refreshToken: string };
  const webLogin = await fetch(`${BASE}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: user.email, password: pw }) });
  const cookie = webLogin.headers.get("set-cookie")!.split(";")[0];
  return { user, business, appointment, mobile, cookie };
}

test("mobile Bearer token works on the business appointments API (list + status update)", async () => {
  const o = await ownerWithAppointment();
  const list = await call("GET", "/api/appointments?date=2099-01-05", { token: o.mobile.accessToken });
  assert.equal(list.status, 200);
  const items = list.body.appointments as { id: string; service: { name: string } }[];
  assert.deepEqual(items.map((a) => a.id), [o.appointment.id]);
  assert.equal(items[0].service.name, "Kesim");

  const patched = await call("PATCH", "/api/appointments", { token: o.mobile.accessToken, body: { id: o.appointment.id, status: "CONFIRMED" } });
  assert.equal(patched.status, 200);
  assert.equal((await prisma.appointment.findUniqueOrThrow({ where: { id: o.appointment.id } })).status, "CONFIRMED");

  const invalid = await call("PATCH", "/api/appointments", { token: o.mobile.accessToken, body: { id: o.appointment.id, status: "HACKED" } });
  assert.equal(invalid.status, 400);
});

test("web cookie flow is unchanged (regression)", async () => {
  const o = await ownerWithAppointment();
  assert.equal((await call("GET", "/api/auth/me", { cookie: o.cookie })).status, 200);
  const list = await call("GET", "/api/appointments?date=2099-01-05", { cookie: o.cookie });
  assert.equal(list.status, 200);
  assert.equal((list.body.appointments as unknown[]).length, 1);
  const page = await fetch(`${BASE}/dashboard`, { headers: { Cookie: o.cookie }, redirect: "manual" });
  assert.equal(page.status, 200, "dashboard renders with the cookie");
});

test("a Bearer header disables the cookie entirely (no fallback, no mixing)", async () => {
  const o = await ownerWithAppointment();
  // Valid cookie + garbage Bearer → the cookie must NOT rescue the request.
  assert.equal((await call("GET", "/api/appointments", { cookie: o.cookie, token: "garbage" })).status, 401);
  assert.equal((await call("GET", "/api/appointments", { cookie: o.cookie, token: "" })).status, 401, "empty Bearer");
  // Valid Bearer wins regardless of cookie.
  assert.equal((await call("GET", "/api/appointments", { cookie: "randevugo_session=bogus", token: o.mobile.accessToken })).status, 200);
});

test("a web session token sent as Bearer is rejected", async () => {
  const o = await ownerWithAppointment();
  const webToken = signToken({ userId: o.user.id, email: o.user.email, role: "BUSINESS_OWNER" });
  assert.equal((await call("GET", "/api/appointments", { token: webToken })).status, 401);
});

test("revoked sessions and deactivated users lose API access immediately", async () => {
  const o = await ownerWithAppointment();
  await call("POST", "/api/mobile/auth/logout", { body: { refreshToken: o.mobile.refreshToken } });
  assert.equal((await call("GET", "/api/appointments", { token: o.mobile.accessToken })).status, 401, "after logout");

  const p = await ownerWithAppointment();
  await prisma.user.update({ where: { id: p.user.id }, data: { isActive: false } });
  assert.equal((await call("GET", "/api/appointments", { token: p.mobile.accessToken })).status, 401, "after deactivation");
});

test("mobile tokens never open admin or support APIs", async () => {
  const o = await ownerWithAppointment();
  for (const path of ["/api/admin", "/api/admin/coupons", "/api/admin/support-agents", "/api/admin/audit-logs"]) {
    const r = await call("GET", path, { token: o.mobile.accessToken });
    assert.ok([401, 403].includes(r.status), `${path} → ${r.status}`);
  }
  const support = await call("PATCH", "/api/support/tickets/00000000-0000-0000-0000-000000000000", { token: o.mobile.accessToken, body: { status: "CLOSED" } });
  assert.ok([401, 403].includes(support.status), `support → ${support.status}`);
});

test("an owner cannot update another business's appointment with a mobile token", async () => {
  const a = await ownerWithAppointment();
  const b = await ownerWithAppointment();
  const r = await call("PATCH", "/api/appointments", { token: a.mobile.accessToken, body: { id: b.appointment.id, status: "CANCELLED" } });
  assert.notEqual(r.status, 200);
  assert.equal((await prisma.appointment.findUniqueOrThrow({ where: { id: b.appointment.id } })).status, "PENDING", "untouched");
  const list = await call("GET", "/api/appointments?date=2099-01-05", { token: a.mobile.accessToken });
  assert.deepEqual((list.body.appointments as { id: string }[]).map((x) => x.id), [a.appointment.id], "only own appointments listed");
});
