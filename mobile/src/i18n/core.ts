// Translation core. Pure TypeScript (no Expo imports) so lib files and Node unit tests can use it.
// gettext style: the Turkish text is the key; other languages map it to their text, and anything missing
// falls back to Turkish. Placeholders are {0}, {1}… in the order of the arguments.

import ar from './locales/ar';
import de from './locales/de';
import en from './locales/en';
import ru from './locales/ru';

export type Language = 'tr' | 'en' | 'de' | 'ru' | 'ar';

export const LANGUAGES: { code: Language; name: string; rtl?: boolean }[] = [
  { code: 'tr', name: 'Türkçe' },
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'ru', name: 'Русский' },
  { code: 'ar', name: 'العربية', rtl: true },
];

const DICTIONARIES: Record<Exclude<Language, 'tr'>, Record<string, string>> = { en, de, ru, ar };

let current: Language = 'tr';

export function setLanguage(language: Language) {
  current = language;
}

export function getLanguage(): Language {
  return current;
}

export function isRtl(language: Language = current) {
  return LANGUAGES.some((l) => l.code === language && l.rtl);
}

/** BCP 47 tag for Intl and the API (`X-App-Locale`). */
export function localeTag(language: Language = current) {
  return { tr: 'tr-TR', en: 'en-GB', de: 'de-DE', ru: 'ru-RU', ar: 'ar' }[language];
}

export function t(text: string, ...args: (string | number)[]): string {
  const template = current === 'tr' ? text : (DICTIONARIES[current][text] ?? text);
  return args.length ? template.replace(/\{(\d+)\}/g, (m, i) => (args[Number(i)] !== undefined ? String(args[Number(i)]) : m)) : template;
}

/**
 * t() for a Turkish word with more than one meaning ("Açık" = open / light, "Ara" = search / call / Dec).
 * Dictionaries key it as "context|text"; without that entry it falls back to the plain text's translation.
 */
export function tc(context: string, text: string, ...args: (string | number)[]): string {
  const key = `${context}|${text}`;
  if (current !== 'tr' && DICTIONARIES[current][key] !== undefined) return t(DICTIONARIES[current][key], ...args);
  return t(text, ...args);
}
