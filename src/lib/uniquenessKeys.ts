// The normalized forms behind the uniqueness rules in ./uniqueness.ts. Pure (no database) so tests can use it.

export const TR_FROM = "çÇğĞıİöÖşŞüÜ";
export const TR_TO = "ccggiioossuu";

/** "Ahmet Berber & Stil" → "ahmetberberstil": the slug's mapping without separators. */
export function businessNameKey(name: string): string {
  return name
    .split("")
    .map((c) => {
      const i = TR_FROM.indexOf(c);
      return i === -1 ? c : TR_TO[i];
    })
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** The last 10 digits, so 0532…, 90532… and +90 532… are one number. null when there are too few digits. */
export function phoneKey(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.length < 7 ? null : digits.slice(-10);
}

/** The business name changed in a way that matters for uniqueness (not just case or spacing). */
export function businessNameChanged(current: string, next: string): boolean {
  const a = businessNameKey(current);
  const b = businessNameKey(next);
  return a || b ? a !== b : current.trim().toLowerCase() !== next.trim().toLowerCase();
}

/** The phone number changed (not just its formatting). */
export function phoneChanged(current: string | null | undefined, next: string | null | undefined): boolean {
  return phoneKey(current) !== phoneKey(next);
}
