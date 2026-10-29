// The content of push notifications. Pure (no database, no network) so tests can use it.

const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

/** "ExponentPushToken[…]" (or the older "ExpoPushToken[…]"), the only kind the Expo push service accepts. */
export function isExpoPushToken(token: unknown): token is string {
  return typeof token === "string" && token.length <= 200 && /^Expo(nent)?PushToken\[[^\]]+\]$/.test(token);
}

/** "2026-10-30" + "14:00" → "30 Ekim 14:00". */
export function bookingWhen(date: string, startTime: string): string {
  const [, m, d] = date.split("-").map(Number);
  return m >= 1 && m <= 12 && d ? `${d} ${MONTHS[m - 1]} ${startTime}` : `${date} ${startTime}`;
}

export type NewBookingInfo = {
  appointmentId: string;
  customerName: string;
  serviceName: string;
  date: string;
  startTime: string;
  tableName?: string | null;
};

/** The alert a business owner gets for a new booking. */
export function newBookingMessage(info: NewBookingInfo) {
  const table = info.tableName ? ` · ${info.tableName}` : "";
  return {
    title: "Yeni randevu 🎉",
    body: `${info.customerName} · ${info.serviceName}${table} · ${bookingWhen(info.date, info.startTime)}`,
    data: { type: "NEW_APPOINTMENT", appointmentId: info.appointmentId, date: info.date },
  };
}
