/**
 * Backend address, from EXPO_PUBLIC_API_URL (mobile/.env, see .env.example). There is deliberately no
 * fallback: a missing value must never silently point the app at production.
 * EXPO_PUBLIC_* values are bundled into the app, so only public settings belong here — never secrets.
 */
export const API_URL: string | null = process.env.EXPO_PUBLIC_API_URL?.trim() || null;
