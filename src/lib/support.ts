import prisma from "./prisma";
import { getCurrentUser } from "./auth";
import { SUPPORT_ROLE } from "./supportOptions";

// Client-safe constants live in supportOptions so client components can import them.
export * from "./supportOptions";

export function isSupportRole(role?: string | null): boolean {
  return role?.trim().toUpperCase() === SUPPORT_ROLE;
}

export function isSuperAdminRole(role?: string | null): boolean {
  const normalized = role?.trim().toUpperCase();
  return normalized === "SUPER_ADMIN" || normalized === "ADMIN" || normalized === "SUPERADMIN";
}

/** The signed-in support agent, or null when the session isn't an active SUPPORT user. */
export async function getSupportAgent() {
  const current = await getCurrentUser();
  if (!current || !isSupportRole(current.role)) return null;

  const agent = await prisma.user.findUnique({
    where: { id: current.id },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });
  if (!agent || !agent.isActive) return null;
  return agent;
}

/** Fields of a support agent that are safe to send to the admin panel. */
export const AGENT_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  isActive: true,
  createdAt: true,
} as const;

export async function getSuperAdmin() {
  const user = await getCurrentUser();
  return user && isSuperAdminRole(user.role) ? user : null;
}

/** Readable temporary password for owner password resets (no ambiguous characters). */
export function generateTemporaryPassword(length = 10): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}
