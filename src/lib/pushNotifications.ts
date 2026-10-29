import prisma from "@/lib/prisma";
import { newBookingMessage, type NewBookingInfo } from "@/lib/pushMessages";

export { isExpoPushToken } from "@/lib/pushMessages";

// Sends alerts to the business owner's phones through Expo's push service (free, no keys needed; an
// EXPO_ACCESS_TOKEN env var is used when set). Best effort: failures are logged and never break a booking.

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const TIMEOUT_MS = 5000;

type PushTicket = { status: "ok" | "error"; details?: { error?: string } };

/** Live mobile sessions of the business owner that registered a push token. */
async function ownerPushTokens(businessId: string): Promise<string[]> {
  const business = await prisma.business.findUnique({ where: { id: businessId }, select: { userId: true } });
  if (!business) return [];
  const now = new Date();
  const sessions = await prisma.mobileSession.findMany({
    where: { userId: business.userId, revokedAt: null, expiresAt: { gt: now }, absoluteExpiresAt: { gt: now }, pushToken: { not: null } },
    select: { pushToken: true },
  });
  return [...new Set(sessions.map((s) => s.pushToken!).filter(Boolean))];
}

async function send(tokens: string[], message: { title: string; body: string; data: Record<string, string> }) {
  if (tokens.length === 0) return;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(process.env.EXPO_ACCESS_TOKEN ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` } : {}),
      },
      body: JSON.stringify(tokens.map((to) => ({ to, sound: "default", channelId: "bookings", priority: "high", ...message }))),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.warn("[push] Expo push service answered", res.status);
      return;
    }
    // Tickets come back in the order sent; a phone that uninstalled the app no longer accepts alerts.
    const tickets = ((await res.json()) as { data?: PushTicket[] }).data ?? [];
    const gone = tokens.filter((_, i) => tickets[i]?.details?.error === "DeviceNotRegistered");
    if (gone.length) await prisma.mobileSession.updateMany({ where: { pushToken: { in: gone } }, data: { pushToken: null } });
  } catch (error) {
    console.warn("[push] sending failed", error);
  } finally {
    clearTimeout(timer);
  }
}

/** Announces a new booking on the owner's phones. Never throws. */
export async function notifyNewBooking(businessId: string, info: NewBookingInfo) {
  try {
    await send(await ownerPushTokens(businessId), newBookingMessage(info));
  } catch (error) {
    console.warn("[push] new booking alert failed", error);
  }
}
