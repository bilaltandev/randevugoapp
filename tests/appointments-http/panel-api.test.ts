// Endpoints added for the mobile panel menu, against the real app and the TEST database.
// Run via `node scripts/test-env/run-http-tests.mjs tests/appointments-http/panel-api.test.ts`.
import { after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import { cleanup, createUser, prisma, resetAuthRateLimits } from "../mobile-auth/helpers";

const BASE = process.env.MOBILE_API_BASE;
if (!BASE) throw new Error("Run via `node scripts/test-env/run-http-tests.mjs`.");

after(cleanup);
beforeEach(resetAuthRateLimits);

async function call(method: string, path: string, token?: string, body?: unknown) {
  const r = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json: Record<string, any> = {};
  try { json = await r.json(); } catch {}
  return { status: r.status, body: json };
}

async function owner() {
  const pw = crypto.randomBytes(12).toString("base64url");
  const user = await createUser({ password: pw });
  const business = await prisma.business.findFirstOrThrow({ where: { userId: user.id } });
  const login = await call("POST", "/api/mobile/auth/login", undefined, { email: user.email, password: pw });
  assert.equal(login.status, 200);
  return { user, business, token: login.body.accessToken as string };
}

test("support tickets: list and read own tickets only", async () => {
  const a = await owner();
  const b = await owner();
  const created = await call("POST", "/api/tickets", a.token, { subject: "Test konu", message: "Merhaba", category: "TECHNICAL" });
  assert.equal(created.status, 200);
  const id = created.body.ticket.id as string;

  const list = await call("GET", "/api/tickets", a.token);
  assert.equal(list.status, 200);
  assert.equal(list.body.tickets.length, 1);
  assert.deepEqual([list.body.tickets[0].subject, list.body.tickets[0].messageCount, list.body.tickets[0].awaitingOwner], ["Test konu", 1, false]);

  const one = await call("GET", `/api/tickets/${id}`, a.token);
  assert.equal(one.status, 200);
  assert.equal(one.body.messages[0].body, "Merhaba");
  assert.equal(one.body.messages[0].authorRole, "OWNER");

  assert.equal((await call("GET", `/api/tickets/${id}`, b.token)).status, 404, "another business can't read it");
  assert.equal((await call("GET", "/api/tickets", b.token)).body.tickets.length, 0);
  assert.equal((await call("GET", "/api/tickets")).status, 401);
});

test("dashboard summary: counts and subscription for the signed-in business", async () => {
  const o = await owner();
  const service = await prisma.service.create({ data: { businessId: o.business.id, name: "Kesim", durationMinutes: 30, price: 100 } });
  const employee = await prisma.employee.create({ data: { businessId: o.business.id, name: "Usta", specialty: "Saç" } });
  await prisma.appointment.create({
    data: {
      businessId: o.business.id, serviceId: service.id, employeeId: employee.id, date: "2099-01-01", startTime: "10:00", endTime: "10:30",
      status: "PENDING", customerName: "Müşteri", customerPhone: "0", price: 100,
    },
  });
  const r = await call("GET", "/api/dashboard/summary", o.token);
  assert.equal(r.status, 200);
  assert.equal(r.body.pendingCount, 1);
  assert.equal(r.body.upcomingAppointments.length, 1);
  assert.equal(r.body.last7.length, 7);
  assert.match(r.body.todayStr, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(typeof r.body.subscription.status === "string");
  assert.equal((await call("GET", "/api/dashboard/summary")).status, 401);
});

test("page builder GET carries the editor summary (themes, sections)", async () => {
  const o = await owner();
  const r = await call("GET", "/api/page-builder", o.token);
  assert.equal(r.status, 200);
  assert.ok(r.body.editor.themes.length > 5);
  assert.ok(r.body.editor.themes.every((t: any) => t.id && t.name && t.colors.primary));
  assert.ok(r.body.editor.sectionOrder.includes("Gallery"));
  assert.ok(Array.isArray(r.body.editor.hiddenSections));

  const order = ["Hero", "Booking", "Services", "Staff", "Gallery", "Reviews", "Location"];
  assert.equal((await call("POST", "/api/page-builder", o.token, { sectionOrder: order, hiddenSections: ["Reviews"] })).status, 200);
  const again = await call("GET", "/api/page-builder", o.token);
  assert.deepEqual(again.body.editor.sectionOrder, order);
  assert.deepEqual(again.body.editor.hiddenSections, ["Reviews"]);
});
