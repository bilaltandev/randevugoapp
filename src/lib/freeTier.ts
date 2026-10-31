import prisma from "./prisma";
import { FREE_MONTHLY_BOOKINGS } from "./plans";

// The free tier's monthly booking limit. Counts the calendar month of the booking's own date, so next month's
// days stay bookable. Cancelled bookings and closed slots don't count.

export const FREE_LIMIT_OWNER = `Ücretsiz pakette aylık ${FREE_MONTHLY_BOOKINGS} randevu sınırına ulaştınız. Sınırsız randevu için bir pakete geçin.`;
export const FREE_LIMIT_CUSTOMER = "Bu işletme bu ay için online randevu alamıyor. Lütfen işletmeyi arayarak randevu alın.";

/** Bookings counted against the limit in the month of `dateKey` ("YYYY-MM-DD"). */
export async function freeBookingsInMonth(businessId: string, dateKey: string): Promise<number> {
  return prisma.appointment.count({
    where: { businessId, date: { startsWith: dateKey.slice(0, 7) }, isBlockedSlot: false, status: { not: "CANCELLED" } },
  });
}

export async function freeLimitReached(businessId: string, dateKey: string): Promise<boolean> {
  return (await freeBookingsInMonth(businessId, dateKey)) >= FREE_MONTHLY_BOOKINGS;
}
