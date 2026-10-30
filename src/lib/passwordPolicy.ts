// The rules for a new password. Pure (no database): the forms show them while typing, the API enforces them.
// Existing passwords keep working; the rules apply whenever a password is set.
// mobile/src/lib/password.ts is a copy of these rules; change both together.

const MIN_LENGTH = 8;
const MAX_LENGTH = 200;

export const PASSWORD_RULES = [
  { label: `En az ${MIN_LENGTH} karakter`, test: (p: string) => p.length >= MIN_LENGTH },
  { label: "1 büyük harf", test: (p: string) => /\p{Lu}/u.test(p) },
  { label: "1 rakam", test: (p: string) => /\d/.test(p) },
  { label: "1 özel karakter (!, ?, * gibi)", test: (p: string) => /[^\p{L}\p{N}\s]/u.test(p) },
];

export const WEAK_PASSWORD = `Şifre en az ${MIN_LENGTH} karakter olmalı; 1 büyük harf, 1 rakam ve 1 özel karakter içermelidir.`;

/** The value is a string that passes every rule. Not a type guard: a failure says nothing about its type. */
export function isStrongPassword(password: unknown): boolean {
  return typeof password === "string" && password.length <= MAX_LENGTH && PASSWORD_RULES.every((rule) => rule.test(password));
}
