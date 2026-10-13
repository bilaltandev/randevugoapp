// Person/Team plans and team invites against the TEST database (node scripts/test-env/run-tests.mjs).
import { after, test } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import { cleanup, createUser, prisma } from "./helpers";
import { authenticateMobileAccessToken, createMobileSession, getEligibleMobileUser } from "../../src/lib/mobileAuth";
import { getDashboardSummary } from "../../src/lib/dashboardSummary";
import {
  TeamInviteError,
  acceptInvite,
  createInvite,
  findOpenInvite,
  hashInviteToken,
  removeMember,
  revokeInvites,
} from "../../src/lib/teamInvites";

const memberIds: string[] = [];
after(async () => {
  if (memberIds.length) await prisma.user.deleteMany({ where: { id: { in: memberIds } } });
  await cleanup();
});

/** Owner + business on `plan` + one active staff record. */
async function teamBusiness(plan: "PERSON" | "TEAM" = "TEAM") {
  const owner = await createUser();
  const business = await prisma.business.findFirstOrThrow({ where: { userId: owner.id } });
  await prisma.subscription.update({ where: { businessId: business.id }, data: { plan } });
  const employee = await prisma.employee.create({ data: { businessId: business.id, name: "Ayşe", specialty: "Kuaför" } });
  return { owner, business, employee };
}

const accept = async (token: string, overrides: Partial<{ email: string; name: string }> = {}) => {
  const result = await acceptInvite(token, {
    name: overrides.name ?? "Ayşe Üye",
    email: overrides.email ?? `member-${crypto.randomBytes(5).toString("hex")}@test.invalid`,
    password: "uzun-bir-sifre",
  });
  memberIds.push(result.user.id);
  return result;
};

const rejectsWith = (code: string) => (e: unknown) => e instanceof TeamInviteError && e.code === code;

test("invites need the TEAM plan and an active, unlinked staff record", async () => {
  const person = await teamBusiness("PERSON");
  await assert.rejects(createInvite(person.business.id, person.employee.id), rejectsWith("PLAN_REQUIRED"));

  const team = await teamBusiness();
  await assert.rejects(createInvite(team.business.id, crypto.randomUUID()), rejectsWith("NOT_FOUND"));
  // Another business's staff record is not found either.
  await assert.rejects(createInvite(person.business.id, team.employee.id), rejectsWith("NOT_FOUND"));

  await prisma.employee.update({ where: { id: team.employee.id }, data: { isActive: false } });
  await assert.rejects(createInvite(team.business.id, team.employee.id), rejectsWith("INACTIVE"));
});

test("a link stores only its hash, works once, and makes a TEAM_MEMBER linked to the record", async () => {
  const { business, employee } = await teamBusiness();
  const invite = await createInvite(business.id, employee.id);
  assert.match(invite.path, /^\/davet\//);
  const row = await prisma.teamInvite.findFirstOrThrow({ where: { employeeId: employee.id } });
  assert.equal(row.tokenHash, hashInviteToken(invite.token));
  assert.ok(row.expiresAt.getTime() - Date.now() > 6 * 864e5);

  assert.equal((await findOpenInvite(invite.token))?.employee?.id, employee.id);
  const { user } = await accept(invite.token);

  const member = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, include: { employee: true } });
  assert.equal(member.role, "TEAM_MEMBER");
  assert.equal(member.employee?.id, employee.id);
  assert.notEqual(member.password, "uzun-bir-sifre", "password is hashed");

  assert.equal(await findOpenInvite(invite.token), null, "used link is closed");
  await assert.rejects(accept(invite.token), rejectsWith("INVITE_INVALID"));
  await assert.rejects(createInvite(business.id, employee.id), rejectsWith("ALREADY_MEMBER"));
});

test("a newer link replaces the older one; revoked and expired links are closed", async () => {
  const { business, employee } = await teamBusiness();
  const first = await createInvite(business.id, employee.id);
  const second = await createInvite(business.id, employee.id);
  assert.equal(await findOpenInvite(first.token), null);
  assert.ok(await findOpenInvite(second.token));

  assert.equal(await revokeInvites(business.id, employee.id), 1);
  assert.equal(await findOpenInvite(second.token), null);

  const third = await createInvite(business.id, employee.id);
  await prisma.teamInvite.updateMany({ where: { tokenHash: hashInviteToken(third.token) }, data: { expiresAt: new Date(Date.now() - 1000) } });
  await assert.rejects(accept(third.token), rejectsWith("INVITE_INVALID"));
  assert.equal(await findOpenInvite("not-a-real-token-but-long-enough"), null);
});

test("an e-mail that already has an account is refused and the link stays usable", async () => {
  const { owner, business, employee } = await teamBusiness();
  const invite = await createInvite(business.id, employee.id);
  await assert.rejects(accept(invite.token, { email: owner.email }), rejectsWith("EMAIL_TAKEN"));
  assert.ok(await findOpenInvite(invite.token), "nothing was claimed");
  await accept(invite.token);
});

test("members can use the app but never get owner access (business stays null)", async () => {
  const { business, employee } = await teamBusiness();
  const { user } = await accept((await createInvite(business.id, employee.id)).token);

  const eligible = await getEligibleMobileUser(user.id);
  assert.equal(eligible?.business, null);
  assert.equal(eligible?.member?.employeeId, employee.id);
  assert.equal(eligible?.member?.business.id, business.id);

  const session = await createMobileSession(user.id);
  const auth = await authenticateMobileAccessToken(session.accessToken);
  assert.equal(auth?.user.business, null);

  // A deactivated staff record or business locks the member out.
  await prisma.employee.update({ where: { id: employee.id }, data: { isActive: false } });
  assert.equal(await getEligibleMobileUser(user.id), null);
  await prisma.employee.update({ where: { id: employee.id }, data: { isActive: true } });
  await prisma.business.update({ where: { id: business.id }, data: { isActive: false } });
  assert.equal(await getEligibleMobileUser(user.id), null);

  // Owners are unchanged.
  const owner = await getEligibleMobileUser((await createUser()).id);
  assert.ok(owner?.business);
  assert.equal(owner?.member, null);
});

test("removing a member deletes the account and its sessions; the record and bookings stay", async () => {
  const { business, employee } = await teamBusiness();
  const { user } = await accept((await createInvite(business.id, employee.id)).token);
  const session = await createMobileSession(user.id);

  assert.equal(await removeMember(business.id, employee.id), true);
  assert.equal(await prisma.user.findUnique({ where: { id: user.id } }), null);
  assert.equal(await authenticateMobileAccessToken(session.accessToken), null);
  const record = await prisma.employee.findUniqueOrThrow({ where: { id: employee.id } });
  assert.equal(record.userId, null);
  assert.equal(await removeMember(business.id, employee.id), false, "nothing left to remove");

  // The record can be invited again.
  assert.ok(await createInvite(business.id, employee.id));
});

test("a member's overview counts only their own bookings", async () => {
  const { business, employee } = await teamBusiness();
  const other = await prisma.employee.create({ data: { businessId: business.id, name: "Mehmet", specialty: "Berber" } });
  const service = await prisma.service.create({ data: { businessId: business.id, name: "Kesim", durationMinutes: 30, price: 100 } });
  const today = (await getDashboardSummary(business.id)).todayStr;
  const base = { businessId: business.id, serviceId: service.id, date: today, customerName: "Müşteri", customerPhone: "05000000000", status: "PENDING" };
  await prisma.appointment.createMany({
    data: [
      { ...base, employeeId: employee.id, startTime: "10:00", endTime: "10:30" },
      { ...base, employeeId: other.id, startTime: "11:00", endTime: "11:30" },
      { ...base, employeeId: other.id, startTime: "12:00", endTime: "12:30" },
    ],
  });

  assert.equal((await getDashboardSummary(business.id)).todayAppointments.length, 3);
  const own = await getDashboardSummary(business.id, employee.id);
  assert.equal(own.todayAppointments.length, 1);
  assert.equal(own.pendingCount, 1);
});
