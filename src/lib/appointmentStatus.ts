export type AppointmentStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

export type StatusTone = "pending" | "confirmed" | "completed" | "cancelled" | "blocked";

export const APPOINTMENT_STATUS: Record<AppointmentStatus, { label: string; tone: StatusTone }> = {
  PENDING: { label: "Onay bekliyor", tone: "pending" },
  CONFIRMED: { label: "Onaylandı", tone: "confirmed" },
  COMPLETED: { label: "Tamamlandı", tone: "completed" },
  CANCELLED: { label: "İptal edildi", tone: "cancelled" },
};

export function getAppointmentStatus(status: string | null | undefined) {
  return APPOINTMENT_STATUS[(status as AppointmentStatus) ?? "PENDING"] ?? APPOINTMENT_STATUS.PENDING;
}

/** Reads the optional sector JSON (guest count, plate, …) without throwing on bad data. */
export function parseSectorData(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/** Short, human-readable sector details written by the booking wizard (restaurant, auto service). */
export function getSectorDetails(raw: string | null | undefined): string[] {
  const data = parseSectorData(raw);
  const details: string[] = [];
  if (data.guestCount) details.push(`${data.guestCount} kişi`);
  if (data.tableName) {
    details.push(data.areaName ? `${data.areaName} · ${data.tableName}` : String(data.tableName));
  }
  if (data.plateNumber) details.push(String(data.plateNumber).toUpperCase());
  return details;
}
