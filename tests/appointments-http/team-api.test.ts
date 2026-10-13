// Person/Team plans over HTTP, against the real app and the TEST database.
// Run via `node scripts/test-env/run-http-tests.mjs tests/appointments-http/team-api.test.ts`.
import { after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import { cleanup, createUser, prisma, resetAuthRateLimits } from "../mobile-auth/helpers";

const BASE = process.env.MOBILE_API_BASE;
if (!BASE) throw new Error("Run via `node scripts/test-env/run-http-tests.mjs`.");

const memberIds: string[] = [];
after(async () => {
  if (memberIds.length) await prisma.user.deleteMany({ where: { id: { in: memberIds } } });
  await cleanup();
});
beforeEach(async () => {
  await resetAuthRateLimits();
  await prisma.authRateLimit.deleteMany({ where: { key: { startsWith: "teaminvite:" } } });
});

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

/** Signed-in owner of a business on `plan`, with two staff records and one service. */
async function owner(plan: "PERSON" | "TEAM" = "TEAM") {
  const pw = crypto.randomBytes(12).toString("base64url");
  const user = await createUser({ password: pw });
  const business = await prisma.business.findFirstOrThrow({ where: { userId: user.id } });
  await prisma.subscription.update({ where: { businessId: business.id }, data: { plan } });
  const ayse = await prisma.employee.create({ data: { businessId: business.id, name: "Ayşe", specialty: "Kuaför" } });
  const mehmet = plan === "TEAM" ? await prisma.employee.create({ data: { businessId: business.id, name: "Mehmet", specialty: "Berber" } }) : null;
  const service = await prisma.service.create({ data: { businessId: business.id, name: "Kesim", durationMinutes: 30, price: 100 } });
  const login = await call("POST", "/api/mobile/auth/login", undefined, { email: user.email, password: pw });
  assert.equal(login.status, 200);
  return { user, business, ayse, mehmet, service, token: login.body.accessToken as string };
}

/** Invites `employeeId`, accepts on the public endpoint and signs the member in to the app. */
async function joinTeam(ownerToken: string, employeeId: string) {
  const invite = await call("POST", "/api/team/invites", ownerToken, { employeeId });
  assert.equal(invite.status, 200);
  const token = decodeURIComponent((invite.body.path as string).replace("/davet/", ""));

  const info = await call("GET", `/api/team/invites/${encodeURIComponent(token)}`);
  assert.equal(info.status, 200);

  const email = `member-${crypto.randomBytes(5).toString("hex")}@test.invalid`;
  const password = crypto.randomBytes(12).toString("base64url");
  const accepted = await call("POST", `/api/team/invites/${encodeURIComponent(token)}`, undefined, { name: "Üye", email, password });
  assert.equal(accepted.status, 200);
  const member = await prisma.user.findUniqueOrThrow({ where: { email } });
  memberIds.push(member.id);

  const login = await call("POST", "/api/mobile/auth/login", undefined, { email, password });
  assert.equal(login.status, 200);
  return { email, password, token: login.body.accessToken as string, profile: login.body, linkToken: token };
}

const futureDay = () => {
  const d = new Date(Date.now() + 2 * 864e5);
  return d.toISOString().slice(0, 10);
};

test("PERSON: one staff record, no invites; switching to TEAM opens both", async () => {
  const o = await owner("PERSON");
  const second = await call("POST", "/api/employees", o.token, { name: "İkinci", specialty: "Usta" });
  assert.equal(second.status, 403);
  assert.equal(second.body.code, "PLAN_LIMIT");
  assert.equal((await call("POST", "/api/team/invites", o.token, { employeeId: o.ayse.id })).status, 403);

  const sw = await call("PUT", "/api/subscription", o.token, { plan: "TEAM" });
  assert.equal(sw.status, 200);
  assert.deepEqual([sw.body.plan, sw.body.monthlyPrice], ["TEAM", 149]);
  assert.equal((await call("POST", "/api/employees", o.token, { name: "İkinci", specialty: "Usta" })).status, 200);
  assert.equal((await call("GET", "/api/employees", o.token)).body.plan, "TEAM");
});

test("a member signs in, sees only their own bookings and books only for themselves", async () => {
  const o = await owner();
  const m = await joinTeam(o.token, o.ayse.id);
  assert.equal(m.profile.member.employeeId, o.ayse.id);
  assert.equal(m.profile.business.id, o.business.id);

  const date = futureDay();
  const base = { businessId: o.business.id, serviceId: o.service.id, date, customerName: "Müşteri", customerPhone: "05000000000", status: "PENDING" };
  const mine = await prisma.appointment.create({ data: { ...base, employeeId: o.ayse.id, startTime: "10:00", endTime: "10:30" } });
  const theirs = await prisma.appointment.create({ data: { ...base, employeeId: o.mehmet!.id, startTime: "11:00", endTime: "11:30" } });

  const list = await call("GET", `/api/appointments?date=${date}`, m.token);
  assert.equal(list.status, 200);
  assert.deepEqual(list.body.appointments.map((a: { id: string }) => a.id), [mine.id]);
  assert.equal((await call("GET", `/api/appointments?date=${date}`, o.token)).body.appointments.length, 2, "owner sees all");

  assert.equal((await call("PATCH", "/api/appointments", m.token, { id: theirs.id, status: "CANCELLED" })).status, 404);
  assert.equal((await prisma.appointment.findUniqueOrThrow({ where: { id: theirs.id } })).status, "PENDING");
  assert.equal((await call("PATCH", "/api/appointments", m.token, { id: mine.id, status: "CONFIRMED" })).status, 200);

  // Naming a colleague doesn't help: a member's booking (and closed time) is always their own.
  const booked = await call("POST", "/api/appointments", m.token, {
    ...base, employeeId: o.mehmet!.id, startTime: "14:00", customerName: "Yeni", customerPhone: "05001112233",
  });
  assert.equal(booked.status, 200);
  assert.equal(booked.body.appointment.employeeId, o.ayse.id);
  const closed = await call("POST", "/api/appointments", m.token, {
    ...base, employeeId: o.mehmet!.id, startTime: "16:00", customerName: "[KAPALI: Mola]", customerPhone: "0000000000", isBlockedSlot: true,
  });
  assert.equal(closed.status, 200);
  assert.equal(closed.body.appointment.employeeId, o.ayse.id);

  const summary = await call("GET", "/api/dashboard/summary", m.token);
  assert.equal(summary.status, 200);
  const me = await call("GET", "/api/mobile/team/me", m.token);
  assert.equal(me.status, 200);
  assert.equal(me.body.employee.id, o.ayse.id);
});

test("members get no owner routes, no web session and no invites of their own", async () => {
  const o = await owner();
  const m = await joinTeam(o.token, o.ayse.id);
  for (const path of ["/api/employees", "/api/customers", "/api/services", "/api/subscription", "/api/business/settings", "/api/reviews", "/api/tickets"]) {
    assert.equal((await call("GET", path, m.token)).status, 401, path);
  }
  assert.equal((await call("POST", "/api/team/invites", m.token, { employeeId: o.mehmet!.id })).status, 401);
  assert.equal((await call("PUT", "/api/subscription", m.token, { plan: "PERSON" })).status, 401);
  assert.equal((await call("POST", "/api/mobile/web-session", m.token, {})).status, 403);

  const web = await call("POST", "/api/auth/login", undefined, { email: m.email, password: m.password });
  assert.equal(web.status, 403);
  assert.equal(web.body.code, "MOBILE_ONLY");

  // The owner's own team panel works and shows the member.
  const team = await call("GET", "/api/employees", o.token);
  assert.equal(team.body.employees.find((e: { id: string }) => e.id === o.ayse.id).memberEmail, m.email);
  assert.ok(!("userId" in team.body.employees[0]), "member account ids stay internal");
});

test("links work once; back to PERSON needs the team gone; removing a member ends their session", async () => {
  const o = await owner();
  const m = await joinTeam(o.token, o.ayse.id);

  const again = await call("POST", `/api/team/invites/${encodeURIComponent(m.linkToken)}`, undefined, {
    name: "Başkası", email: `other-${crypto.randomBytes(4).toString("hex")}@test.invalid`, password: "uzun-bir-sifre",
  });
  assert.equal(again.status, 410);
  assert.equal((await call("GET", `/api/team/invites/${encodeURIComponent(m.linkToken)}`)).status, 410);

  const toPerson = await call("PUT", "/api/subscription", o.token, { plan: "PERSON" });
  assert.equal(toPerson.status, 409);
  assert.equal(toPerson.body.code, "HAS_MEMBERS");

  assert.equal((await call("DELETE", `/api/team/members?employeeId=${o.ayse.id}`, o.token)).status, 200);
  assert.equal((await call("GET", "/api/appointments", m.token)).status, 401, "signed out");
  assert.equal((await call("POST", "/api/mobile/auth/login", undefined, { email: m.email, password: m.password })).status, 401);
});
