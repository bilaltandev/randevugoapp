import crypto from "crypto";
import type { Prisma } from "@prisma/client";
import prisma from "./prisma";
import { hashPassword } from "./auth";
import { revokeAllMobileSessions } from "./mobileAuth";
import { planOf } from "./plans";
import { PHONE_TAKEN, isPhoneTaken } from "./uniqueness";
import { privacyNoticeRecord } from "./privacyNotice";

/**
 * TEAM plan invites, all single use:
 * - LINK: the owner shares a link for one of their staff records; whoever opens it first creates a
 *   TEAM_MEMBER account linked to that record (Employee.userId).
 * - CODE: the owner hands out a short code; whoever signs up with it ("Hazır ekibe katıl") becomes a member
 *   and gets a new staff record of their own.
 * A member then sees the bookings made for their staff record in the mobile app.
 *
 * Only the SHA-256 hash of a link token / code is stored. An invite works once, until it expires
 * (INVITE_TTL_MS) or is revoked; a newer link for the same staff record replaces the older one.
 * A business has at most `Subscription.memberLimit` member accounts. Never log tokens, codes or hashes.
 */

export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const TEAM_MEMBER_ROLE = "TEAM_MEMBER";

/** Codes avoid look-alike characters (0/O, 1/I/L), so they can be read out and typed in. */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

export function hashInviteToken(token: string): string {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}

/** Codes are typed by people: case, spaces and dashes don't matter. */
export function normalizeInviteCode(code: string): string {
  return code.toUpperCase().replace(/[\s-]/g, "");
}

function generateCode(): string {
  const bytes = crypto.randomBytes(CODE_LENGTH);
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return code;
}

/** "K7M2QXAB" → "K7M2-QXAB", easier to read; the dash is ignored when typed back. */
export function formatInviteCode(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

/** Path of the web page that accepts a link invite; clients prefix their own origin. */
export function invitePath(token: string): string {
  return `/davet/${encodeURIComponent(token)}`;
}

export class TeamInviteError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "TeamInviteError";
  }
}

const memberCount = (db: Prisma.TransactionClient | typeof prisma, businessId: string) =>
  db.employee.count({ where: { businessId, userId: { not: null } } });

/** Plan and room for one more member; throws when the business can't invite right now. */
async function assertCanInvite(businessId: string) {
  const sub = await prisma.subscription.findUnique({ where: { businessId }, select: { plan: true, memberLimit: true } });
  if (planOf(sub) !== "TEAM") {
    throw new TeamInviteError(403, "PLAN_REQUIRED", "Ekip daveti için Team planına geçmelisiniz.");
  }
  const limit = sub?.memberLimit ?? 5;
  if ((await memberCount(prisma, businessId)) >= limit) {
    throw new TeamInviteError(409, "MEMBER_LIMIT", `Ekip üyesi sınırına ulaştınız (${limit}). Sınırı artırmak için destek ekibine yazın.`);
  }
}

/**
 * New link for a staff record of a TEAM business; earlier open links for that record stop working.
 * The record must be active and not yet linked to a member account.
 */
export async function createInvite(businessId: string, employeeId: string) {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, businessId },
    select: { id: true, userId: true, isActive: true },
  });
  if (!employee) throw new TeamInviteError(404, "NOT_FOUND", "Çalışan bulunamadı.");
  await assertCanInvite(businessId);
  if (employee.userId) throw new TeamInviteError(409, "ALREADY_MEMBER", "Bu çalışan zaten ekibe katılmış.");
  if (!employee.isActive) throw new TeamInviteError(409, "INACTIVE", "Pasif bir çalışana davet gönderilemez.");

  const token = crypto.randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + INVITE_TTL_MS);
  await prisma.$transaction([
    prisma.teamInvite.updateMany({
      where: { employeeId, acceptedAt: null, revokedAt: null },
      data: { revokedAt: now },
    }),
    prisma.teamInvite.create({
      data: { businessId, employeeId, kind: "LINK", tokenHash: hashInviteToken(token), expiresAt },
    }),
  ]);
  return { token, path: invitePath(token), expiresAt };
}

/** New single-use sign-up code for a TEAM business. The plain code is returned once and never stored. */
export async function createInviteCode(businessId: string) {
  await assertCanInvite(businessId);
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);
  // Codes are short, so a (very unlikely) hash collision with an existing invite just draws again.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    try {
      await prisma.teamInvite.create({ data: { businessId, kind: "CODE", tokenHash: hashInviteToken(code), expiresAt } });
      return { code: formatInviteCode(code), expiresAt };
    } catch (error) {
      if ((error as { code?: string })?.code !== "P2002") throw error;
    }
  }
  throw new Error("Could not draw a unique invite code.");
}

/** Open (unused, unexpired) codes of a business: how many and when the last one expires. Codes stay hidden. */
export async function openCodeSummary(businessId: string) {
  const open = await prisma.teamInvite.findMany({
    where: { businessId, kind: "CODE", acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
    select: { expiresAt: true },
  });
  return { count: open.length, lastExpiresAt: open.reduce<Date | null>((m, i) => (!m || i.expiresAt > m ? i.expiresAt : m), null) };
}

/** Stops every open link for a staff record. Returns how many were revoked. */
export async function revokeInvites(businessId: string, employeeId: string) {
  const { count } = await prisma.teamInvite.updateMany({
    where: { businessId, employeeId, acceptedAt: null, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return count;
}

/** Stops every open sign-up code of a business. */
export async function revokeInviteCodes(businessId: string) {
  const { count } = await prisma.teamInvite.updateMany({
    where: { businessId, kind: "CODE", acceptedAt: null, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return count;
}

/**
 * The invite behind a link token or a typed code, when it can still be used: not used, not replaced, not
 * expired, the business is active on the TEAM plan, and (links) the staff record is active and unlinked.
 */
export async function findOpenInvite(tokenOrCode: string) {
  if (typeof tokenOrCode !== "string" || tokenOrCode.length < 6 || tokenOrCode.length > 100) return null;
  // Link tokens are case-sensitive; codes are compared in their normalized form.
  const hashes = [...new Set([hashInviteToken(tokenOrCode), hashInviteToken(normalizeInviteCode(tokenOrCode))])];
  const invite = await prisma.teamInvite.findFirst({
    where: { tokenHash: { in: hashes } },
    include: {
      employee: { select: { id: true, name: true, userId: true, isActive: true } },
      business: { select: { id: true, name: true, logo: true, isActive: true, subscription: { select: { plan: true } } } },
    },
  });
  if (!invite || invite.acceptedAt || invite.revokedAt || invite.expiresAt <= new Date()) return null;
  if (invite.employee && (invite.employee.userId || !invite.employee.isActive)) return null;
  if (!invite.business.isActive || planOf(invite.business.subscription) !== "TEAM") return null;
  return invite;
}

export type AcceptInput = { name: string; email: string; password: string; phone?: string | null; specialty?: string | null };

const INVALID = () => new TeamInviteError(410, "INVITE_INVALID", "Bu davet geçersiz, kullanılmış veya süresi dolmuş.");

/**
 * Creates the member account and links it to the invited staff record (or, for a code, a new one), all or
 * nothing. The invite is claimed with a compare-and-swap, and joins of one business run one at a time so
 * the member limit holds.
 */
export async function acceptInvite(tokenOrCode: string, input: AcceptInput) {
  const invite = await findOpenInvite(tokenOrCode);
  if (!invite) throw INVALID();
  if (await isPhoneTaken(input.phone)) throw new TeamInviteError(409, "PHONE_TAKEN", PHONE_TAKEN);

  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const passwordHash = await hashPassword(input.password);

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${"team:" + invite.businessId}))`;

    const claimed = await tx.teamInvite.updateMany({
      where: { id: invite.id, acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
      data: { acceptedAt: new Date() },
    });
    if (claimed.count === 0) throw INVALID();

    const sub = await tx.subscription.findUnique({ where: { businessId: invite.businessId }, select: { memberLimit: true } });
    if ((await memberCount(tx, invite.businessId)) >= (sub?.memberLimit ?? 5)) {
      throw new TeamInviteError(409, "MEMBER_LIMIT", "Bu ekip dolu. İşletme sahibiyle görüşün.");
    }

    if (await tx.user.findUnique({ where: { email }, select: { id: true } })) {
      throw new TeamInviteError(409, "EMAIL_TAKEN", "Bu e-posta adresi ile zaten bir hesap mevcut.");
    }

    const user = await tx.user.create({
      data: { name, email, password: passwordHash, phone: input.phone?.trim() || null, role: TEAM_MEMBER_ROLE, ...privacyNoticeRecord() },
      select: { id: true, name: true, email: true },
    });

    let employeeName = name;
    if (invite.employeeId) {
      // Only an unlinked record is taken; a concurrent accept through another link loses here.
      const linked = await tx.employee.updateMany({
        where: { id: invite.employeeId, userId: null },
        data: { userId: user.id },
      });
      if (linked.count === 0) throw new TeamInviteError(409, "ALREADY_MEMBER", "Bu çalışan zaten ekibe katılmış.");
      employeeName = invite.employee?.name ?? name;
      // Any other open link for the same record is now pointless.
      await tx.teamInvite.updateMany({
        where: { employeeId: invite.employeeId, acceptedAt: null, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } else {
      const employee = await tx.employee.create({
        data: {
          businessId: invite.businessId,
          name,
          specialty: input.specialty?.trim() || "Uzman",
          phone: input.phone?.trim() || null,
          email,
          userId: user.id,
        },
      });
      await tx.teamInvite.update({ where: { id: invite.id }, data: { employeeId: employee.id } });
    }

    return { user, businessName: invite.business.name, employeeName };
  });
}

/**
 * Removes a member from the team: the account is deleted (its mobile sessions with it) and the staff record
 * stays, unlinked, with its booking history. Returns false when the record has no member.
 */
export async function removeMember(businessId: string, employeeId: string) {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, businessId },
    select: { userId: true },
  });
  await revokeInvites(businessId, employeeId);
  if (!employee?.userId) return false;

  // Sessions end first, so the member is signed out even if the delete below fails.
  await revokeAllMobileSessions(employee.userId, "NOT_ELIGIBLE");
  await prisma.user.deleteMany({ where: { id: employee.userId, role: TEAM_MEMBER_ROLE } });
  return true;
}
