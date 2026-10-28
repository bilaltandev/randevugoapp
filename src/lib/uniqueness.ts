import prisma from "@/lib/prisma";
import { TR_FROM, TR_TO, businessNameKey, phoneKey } from "@/lib/uniquenessKeys";

export { businessNameChanged, phoneChanged } from "@/lib/uniquenessKeys";

// Business names and account phone numbers are unique across the platform. Both are compared in a
// normalized form, so "Ahmet Berber" matches "ahmet-berber" and "0532 111 22 33" matches "+90 532 111 2233".
// Checked on every write that sets them (only when the value changes, so rows that were already duplicates
// before this rule can still save their other fields).

export const BUSINESS_NAME_TAKEN = "Bu işletme adı zaten kullanılıyor. Lütfen farklı bir ad seçin.";
export const PHONE_TAKEN = "Bu telefon numarası başka bir hesapta kullanılıyor.";

/** Another business already uses this name. Names without Latin letters or digits compare case-insensitively. */
export async function isBusinessNameTaken(name: string, exceptBusinessId?: string): Promise<boolean> {
  const key = businessNameKey(name);
  const except = exceptBusinessId ?? "";
  const rows = key
    ? await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM "Business"
        WHERE id <> ${except}
          AND regexp_replace(lower(translate(name, ${TR_FROM}, ${TR_TO})), '[^a-z0-9]', '', 'g') = ${key}
        LIMIT 1`
    : await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM "Business"
        WHERE id <> ${except} AND lower(btrim(name)) = lower(btrim(${name}))
        LIMIT 1`;
  return rows.length > 0;
}

/** Another account (owner or team member) already uses this phone number. */
export async function isPhoneTaken(phone: string | null | undefined, exceptUserId?: string): Promise<boolean> {
  const key = phoneKey(phone);
  if (!key) return false;
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "User"
    WHERE id <> ${exceptUserId ?? ""}
      AND phone IS NOT NULL
      AND right(regexp_replace(phone, '[^0-9]', '', 'g'), 10) = ${key}
    LIMIT 1`;
  return rows.length > 0;
}
