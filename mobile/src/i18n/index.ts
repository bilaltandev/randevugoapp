import { reloadAppAsync } from 'expo';
import { getLocales } from 'expo-localization';
import * as SecureStore from 'expo-secure-store';
import { I18nManager } from 'react-native';

import { getLanguage, isRtl, LANGUAGES, setLanguage, type Language } from './core';

export { getLanguage, isRtl, LANGUAGES, localeTag, t, tc, type Language } from './core';

export type LanguagePreference = Language | 'system';

const PREF_KEY = 'randevugo.language';

/** The phone's first language we support, else Turkish. */
export function systemLanguage(): Language {
  for (const l of getLocales()) {
    const code = l.languageCode as Language | null;
    if (code && LANGUAGES.some((x) => x.code === code)) return code;
  }
  return 'tr';
}

export function getLanguagePreference(): LanguagePreference {
  try {
    const v = SecureStore.getItem(PREF_KEY);
    if (v === 'system' || LANGUAGES.some((l) => l.code === v)) return v as LanguagePreference;
  } catch {}
  return 'system';
}

/**
 * Runs once before any screen module loads (see /index.ts): picks the language synchronously and sets the
 * layout direction. Arabic is right-to-left; React Native applies a direction change on the next start.
 */
export function initLanguage() {
  const pref = getLanguagePreference();
  const language = pref === 'system' ? systemLanguage() : pref;
  setLanguage(language);
  const rtl = isRtl(language);
  I18nManager.allowRTL(rtl);
  I18nManager.forceRTL(rtl);
}

/** Saves the choice and restarts the app so every screen (and the RTL layout) uses the new language. */
export async function changeLanguage(pref: LanguagePreference) {
  SecureStore.setItem(PREF_KEY, pref);
  const language = pref === 'system' ? systemLanguage() : pref;
  if (language === getLanguage() && I18nManager.isRTL === isRtl(language)) return;
  I18nManager.allowRTL(isRtl(language));
  I18nManager.forceRTL(isRtl(language));
  await reloadAppAsync('Dil değişti');
}
