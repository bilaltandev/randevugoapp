// Copy of the rules in the server's src/lib/passwordPolicy.ts. Change both together.

export const PASSWORD_RULES = [
  { label: 'En az 8 karakter', test: (p: string) => p.length >= 8 },
  { label: '1 büyük harf', test: (p: string) => /\p{Lu}/u.test(p) },
  { label: '1 rakam', test: (p: string) => /\d/.test(p) },
  { label: '1 özel karakter (!, ?, * gibi)', test: (p: string) => /[^\p{L}\p{N}\s]/u.test(p) },
];

export const WEAK_PASSWORD = 'Şifre en az 8 karakter olmalı; 1 büyük harf, 1 rakam ve 1 özel karakter içermelidir.';

export function isStrongPassword(password: string): boolean {
  return password.length <= 200 && PASSWORD_RULES.every((rule) => rule.test(password));
}
