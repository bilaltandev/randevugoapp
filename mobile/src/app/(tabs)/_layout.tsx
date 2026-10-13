import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useTheme } from '@/theme';
import { t } from '@/i18n';

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <NativeTabs
      backgroundColor={colors.surface}
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
