export const SUPPORT_ROLE = "SUPPORT";

/** Most days a support agent may add to a trial in one action; larger extensions stay with super admins. */
export const SUPPORT_MAX_TRIAL_EXTENSION_DAYS = 7;

export const MIN_AGENT_PASSWORD_LENGTH = 8;

export const MAX_SUBJECT_LENGTH = 150;
export const MAX_MESSAGE_LENGTH = 5000;

export const TICKET_STATUSES = [
  { id: "OPEN", label: "Açık" },
  { id: "IN_PROGRESS", label: "İşlemde" },
  { id: "RESOLVED", label: "Çözüldü" },
  { id: "CLOSED", label: "Kapatıldı" },
] as const;

export const TICKET_PRIORITIES = [
  { id: "LOW", label: "Düşük" },
  { id: "NORMAL", label: "Normal" },
  { id: "HIGH", label: "Yüksek" },
  { id: "URGENT", label: "Acil" },
] as const;

export const TICKET_CATEGORIES = [
  { id: "GENERAL", label: "Genel" },
  { id: "TECHNICAL", label: "Teknik sorun" },
  { id: "BILLING", label: "Ödeme & abonelik" },
  { id: "ACCOUNT", label: "Hesap & giriş" },
] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number]["id"];

export function isValidOption(list: readonly { id: string }[], value: unknown): value is string {
  return typeof value === "string" && list.some((o) => o.id === value);
}

export function optionLabel(list: readonly { id: string; label: string }[], value?: string | null) {
  return list.find((o) => o.id === value)?.label ?? value ?? "";
}
