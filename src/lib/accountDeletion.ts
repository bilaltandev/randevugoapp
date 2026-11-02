import prisma from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import { revokeAllMobileSessions } from "@/lib/mobileAuth";
import { hitRateLimit, rateLimitKey, RATE_LIMITS } from "@/lib/rateLimit";
import { removeUpload } from "@/lib/uploads";

// Self-service account deletion, required by the App Store and Google Play. Same rules on web and mobile:
// an owner takes the whole business with them (and the team members' accounts); a team member removes only
// their own account and the bookings stay with the business. Staff accounts are managed by an admin instead.

const STAFF_ROLES = ["ADMIN", "SUPER_ADMIN", "SUPPORT"];
const TEAM_MEMBER = "TEAM_MEMBER";

export type DeletionResult = { ok: true } | { ok: false; status: number; code: string; error: string };

export async function deleteOwnAccount(userId: string, password: unknown): Promise<DeletionResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      password: true,
      businesses: {
        select: {
          logo: true,
          coverImage: true,
          employees: { select: { userId: true, photo: true } },
          gallery: { select: { items: { select: { imageUrl: true } } } },
          restaurantTables: { select: { imageUrl: true } },
        },
      },
    },
  });
  if (!user) return { ok: false, status: 404, code: "NOT_FOUND", error: "Hesap bulunamadı." };
  if (STAFF_ROLES.includes(user.role)) {
    return { ok: false, status: 403, code: "STAFF_ACCOUNT", error: "Yönetici hesapları buradan silinemez." };
  }

  // Same budget as a login: the password check must not become a way to guess passwords.
  const limit = await hitRateLimit(rateLimitKey("delacct", "session", user.id), RATE_LIMITS.mobileLoginEmail);
  if (!limit.allowed) {
    return { ok: false, status: 429, code: "RATE_LIMITED", error: "Çok fazla deneme yapıldı. Lütfen biraz sonra tekrar deneyin." };
  }
  if (typeof password !== "string" || !(await verifyPassword(password, user.password))) {
    return { ok: false, status: 400, code: "WRONG_PASSWORD", error: "Şifre hatalı." };
  }

  const memberIds = user.businesses.flatMap((b) => b.employees.map((e) => e.userId)).filter((id): id is string => !!id);
  const files = user.businesses.flatMap((b) => [
    b.logo,
    b.coverImage,
    ...b.employees.map((e) => e.photo),
    ...(b.gallery?.items.map((i) => i.imageUrl) ?? []),
    ...b.restaurantTables.map((t) => t.imageUrl),
  ]);

  // Phones are signed out first, so nobody keeps working in a business that is about to disappear.
  for (const id of [user.id, ...memberIds]) await revokeAllMobileSessions(id, "DEACTIVATED");

  // Deleting the user cascades to the businesses and everything in them (bookings, customers, subscription).
  await prisma.$transaction([
    prisma.user.deleteMany({ where: { id: { in: memberIds }, role: TEAM_MEMBER } }),
    prisma.user.delete({ where: { id: user.id } }),
  ]);

  // Uploaded files go last and quietly; the account is already gone either way.
  await Promise.allSettled(files.map((url) => removeUpload(url)));
  return { ok: true };
}
