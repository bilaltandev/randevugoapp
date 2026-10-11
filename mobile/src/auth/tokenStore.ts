import * as SecureStore from 'expo-secure-store';

import type { RefreshTokenStore } from '@/api/authClient';

// Only the refresh token is persisted (Keychain on iOS, Keystore-encrypted storage on Android).
// The short-lived access token stays in memory inside the auth client and is re-issued at launch.
const KEY = 'randevugo.refreshToken';
const OPTIONS: SecureStore.SecureStoreOptions = {
  // Readable only while the device is unlocked, and never migrated to another device via backup.
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export const secureTokenStore: RefreshTokenStore = {
  get: () => SecureStore.getItemAsync(KEY, OPTIONS),
  set: (token) => SecureStore.setItemAsync(KEY, token, OPTIONS),
  clear: () => SecureStore.deleteItemAsync(KEY, OPTIONS),
};
