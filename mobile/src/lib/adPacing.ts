// How often the free plan's full-screen ads may appear. Pure, so it can be tested without the native ad module.

export const MIN_GAP_MS = 30 * 60 * 1000;
export const MAX_PER_DAY = 5;

export type ShownAds = { at: number; day: string; count: number };

export function mayShowAd(shown: ShownAds, now: number, day: string): boolean {
  if (now - shown.at < MIN_GAP_MS) return false;
  return shown.day !== day || shown.count < MAX_PER_DAY;
}
