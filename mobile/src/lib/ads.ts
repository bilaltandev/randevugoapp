import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { mayShowAd, type ShownAds } from '@/lib/adPacing';

// Full-screen ads for the free plan. Non-personalized, at most one every 30 minutes and five a day, and only on the way
// back to Özet, so an ad never lands on someone in the middle of a booking.

/** AdMob ad units. Empty: Google's test ads, as in development builds: real ads must not be requested while testing. */
const AD_UNITS: { android: string; ios: string } = { android: 'ca-app-pub-6275697857126948/1675273158', ios: '' };

const STORE_KEY = 'calendlygo.ads.interstitial';

const today = () => new Date().toISOString().slice(0, 10);

async function readShown(): Promise<ShownAds> {
  try {
    const raw = await SecureStore.getItemAsync(STORE_KEY);
    if (raw) return JSON.parse(raw) as ShownAds;
  } catch {
    // Unreadable: treat as nothing shown.
  }
  return { at: 0, day: today(), count: 0 };
}

type Interstitial = { loaded: boolean; load: () => void; show: () => Promise<void> };

let ad: Interstitial | null = null;
let started = false;

/**
 * Loads the first ad. The native module doesn't exist in Expo Go, so it's only required here, behind that check, and
 * any failure just means no ads: ads must never get in the way of the app.
 */
export function prepareAds() {
  if (started || Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return;
  started = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { default: mobileAds, AdEventType, InterstitialAd, TestIds } = require('react-native-google-mobile-ads') as typeof import('react-native-google-mobile-ads');
    const unit = (!__DEV__ && (Platform.OS === 'ios' ? AD_UNITS.ios : AD_UNITS.android)) || TestIds.INTERSTITIAL;
    const interstitial = InterstitialAd.createForAdRequest(unit, { requestNonPersonalizedAdsOnly: true });
    interstitial.addAdEventListener(AdEventType.CLOSED, () => interstitial.load());
    ad = interstitial;
    mobileAds()
      .initialize()
      .then(() => interstitial.load())
      .catch(() => {});
  } catch {
    ad = null;
  }
}

/** Shows an ad if one is ready and the pacing allows it. */
export async function maybeShowAd() {
  if (!ad?.loaded) return;
  const shown = await readShown();
  const now = Date.now();
  const day = today();
  if (!mayShowAd(shown, now, day)) return;
  try {
    await ad.show();
    const count = shown.day === day ? shown.count + 1 : 1;
    await SecureStore.setItemAsync(STORE_KEY, JSON.stringify({ at: now, day, count }));
  } catch {
    // Not shown: nothing to record.
  }
}
