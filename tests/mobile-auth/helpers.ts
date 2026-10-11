import crypto from "crypto";
import prisma from "../../src/lib/prisma";
import { hashPassword } from "../../src/lib/auth";

// Refuse to touch any database unless scripts/test-env/run-tests.mjs verified it is the TEST project.
if (process.env.RG_TEST_DB_VERIFIED !== "1") {
  throw new Error("Run these tests via `node scripts/test-env/run-tests.mjs` (TEST database only).");
}

export { prisma };

const createdUserIds: string[] = [];

/** Synthetic user (+ business for owners). Every row is removed by cleanup() via cascade. */
export async function createUser(
  opts: { role?: string; isActive?: boolean; withBusiness?: boolean; password?: string } = {}
) {
  const tag = crypto.randomBytes(6).toString("hex");
  const user = await prisma.user.create({
    data: {
      email: `mobile-auth-${tag}@test.invalid`,
      password: opts.password ? await hashPassword(opts.password) : "not-a-real-hash",
      name: "Mobile Auth Test",
      role: opts.role ?? "BUSINESS_OWNER",
      isActive: opts.isActive ?? true,
    },
  });
  createdUserIds.push(user.id);
  if (opts.withBusiness ?? true) {
    await prisma.business.create({
      data: { userId: user.id, name: `Test ${tag}`, slug: `mobile-auth-${tag}`, phone: "0", address: "Test" },
    });
  }
  return user;
}

export async function cleanup() {
  if (createdUserIds.length) await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  await prisma.authRateLimit.deleteMany({ where: { key: { startsWith: "test:" } } });
  await resetAuthRateLimits();
  await prisma.$disconnect();
}

/** Clears the mobile endpoint counters (TEST db only) so tests don't throttle each other. */
export async function resetAuthRateLimits() {
  await prisma.authRateLimit.deleteMany({
    where: { OR: ["mlogin:", "mrefresh:", "mlogout:"].map((prefix) => ({ key: { startsWith: prefix } })) },
  });
}
