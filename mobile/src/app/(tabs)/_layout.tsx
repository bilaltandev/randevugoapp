import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Platform } from 'react-native';

import { useTheme } from '@/theme';
import { t } from '@/i18n';

/**
 * Native tab bar as frosted glass. iOS 26+ draws its own liquid glass (in the app's light/dark, see the theme
 * provider); older iOS gets a thin material blur that never turns fully transparent at the scroll edge;
 * Android has no blur, so a slightly see-through surface.
 */
export default function TabsLayout() {
  const { colors, scheme } = useTheme();
  return (
    <NativeTabs
      backgroundColor={Platform.OS === 'ios' ? undefined : scheme === 'dark' ? 'rgba(18, 22, 29, 0.94)' : 'rgba(255, 255, 255, 0.94)'}
      blurEffect={scheme === 'dark' ? 'systemThinMaterialDark' : 'systemThinMaterialLight'}
      disableTransparentOnScrollEdge
      iconColor={{ default: colors.ink3, selected: colors.brand }}
      indicatorColor={colors.brandSoft}
      labelStyle={{ default: { color: colors.ink3 }, selected: { color: colors.brand } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{t('Ana Sayfa')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="calendar">
        <NativeTabs.Trigger.Label>{t('Takvim')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'calendar', selected: 'calendar' }} md="calendar_month" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="appointments">
        <NativeTabs.Trigger.Label>{t('Randevular')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'list.bullet.rectangle', selected: 'list.bullet.rectangle.fill' }} md="event_note" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>{t('Profil')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }} md="account_circle" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
