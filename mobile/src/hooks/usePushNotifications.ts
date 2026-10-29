import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import type { AuthClient } from '@/api/authClient';
import { t } from '@/i18n';

// New-booking alerts. They need a development or store build with an EAS project id: Expo Go and
// simulators can't receive remote pushes, so registration quietly does nothing there.

// Alerts that arrive while the app is open still show as a banner.
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

async function registerDevice(client: AuthClient) {
  if (!Device.isDevice) return;
  const projectId: string | undefined = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return;

  // Android shows no permission prompt until a channel exists; the server sends to this channel.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('bookings', {
      name: t('Yeni randevular'),
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: '#2BBF8E',
    });
  }

  let { granted } = await Notifications.getPermissionsAsync();
  if (!granted) ({ granted } = await Notifications.requestPermissionsAsync());
  if (!granted) {
    await client.request('/api/mobile/push-token', { method: 'DELETE' }).catch(() => {});
    return;
  }

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  await client.request('/api/mobile/push-token', { method: 'PUT', body: { token } });
}

/**
 * Registers this phone for new-booking alerts once the owner is signed in, and opens Randevular when an
 * alert is tapped (also when the tap started the app). `canNavigate` is false on the intro, plan and
 * lock screens, where the tabs aren't available yet.
 */
export function usePushNotifications({ client, enabled, canNavigate }: { client: AuthClient | null; enabled: boolean; canNavigate: boolean }) {
  const response = Notifications.useLastNotificationResponse();
  const handled = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !client) return;
    // Offline, Expo Go or a refused prompt: try again on the next launch.
    registerDevice(client).catch(() => {});
  }, [enabled, client]);

  useEffect(() => {
    if (!response || !canNavigate) return;
    const id = response.notification.request.identifier;
    if (handled.current === id) return;
    handled.current = id;
    if (response.notification.request.content.data?.type === 'NEW_APPOINTMENT') router.navigate('/appointments');
  }, [response, canNavigate]);
}
