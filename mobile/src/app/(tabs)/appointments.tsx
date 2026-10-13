import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { AppointmentCard } from '@/components/AppointmentCard';
import { AppointmentSheet } from '@/components/AppointmentSheet';
import { EmptyState } from '@/components/EmptyState';
import { Icon, icons } from '@/components/Icon';
import { BarButton, Screen } from '@/components/Screen';
import { Button } from '@/components/ui';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { useAppointments } from '@/hooks/useAppointments';
import { matchesSearch, type AppointmentStatus } from '@/lib/appointments';
import { makeStyles, radius, spacing, useTheme } from '@/theme';
import { t } from '@/i18n';

type Tab = AppointmentStatus | 'ALL';
const TABS: { value: Tab; label: string }[] = [
  { value: 'PENDING', label: t('Bekleyen') },
  { value: 'CONFIRMED', label: t('Onaylanan') },
  { value: 'COMPLETED', label: t('Tamamlanan') },
  { value: 'CANCELLED', label: t('İptal') },
  { value: 'ALL', label: t('Tümü') },
];

export default function AppointmentsScreen() {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  const [tab, setTab] = useState<Tab>('PENDING');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { items, loading, error, refreshing, refresh, retry, setStatus, hasMore, loadingMore, loadMore } = useAppointments({
    status: tab,
    search,
    paged: true,
  });

  // The server searches all pages; wait until typing pauses before asking it.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 350);
    return () => clearTimeout(timer);
  }, [query]);

  // Closed slots are calendar entries, not bookings; they are managed from the calendar tab.
  // matchesSearch keeps the list in step while the debounced server search catches up.
  const visible = (items ?? []).filter((a) => !a.isBlockedSlot && (tab === 'ALL' || a.status === tab) && matchesSearch(a, query));
  const selected = items?.find((a) => a.id === selectedId) ?? null;

  return (
    <Screen
      title={t('Randevular')}
      subtitle={t('Tüm rezervasyonlar')}
      onRefresh={refresh}
      refreshing={refreshing}
      right={<BarButton icon="add" label={t('Yeni randevu')} onPress={() => router.push('/appointment/new')} />}>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {TABS.map((tabItem) => {
          const active = tabItem.value === tab;
          return (
            <Pressable
              key={tabItem.value}
              onPress={() => setTab(tabItem.value)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={[styles.tab, active && styles.tabActive]}>
              <Text style={[typography.label, { color: active ? colors.onBrand : colors.ink2 }]}>{tabItem.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.searchRow}>
        <Icon name={icons.search} size={18} color={colors.ink3} />
        <TextInput
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          placeholder={t('Müşteri adı veya telefon ara')}
          placeholderTextColor={colors.ink3}
          autoCorrect={false}
          clearButtonMode="while-editing"
          returnKeyType="search"
        />
      </View>

      {loading ? <LoadingView /> : null}
      {error ? <ErrorView message={error} onRetry={retry} /> : null}
      {items && !error ? (
        visible.length === 0 ? (
          <EmptyState
            title={query ? t('Sonuç bulunamadı') : t('Bu listede randevu yok')}
            description={query ? t('Farklı bir isim veya telefon numarası deneyin.') : t('Yeni rezervasyonlar geldiğinde burada görünecek.')}
          />
        ) : (
          <View style={styles.list}>
            {visible.map((a) => (
              <AppointmentCard key={a.id} appointment={a} showDate onPress={() => setSelectedId(a.id)} />
            ))}
          </View>
        )
      ) : null}
      {items && !error && hasMore ? (
        <Button label={t('Daha fazla göster')} variant="secondary" onPress={loadMore} busy={loadingMore} />
      ) : null}

      <AppointmentSheet appointment={selected} onClose={() => setSelectedId(null)} onChangeStatus={setStatus} />
    </Screen>
  );
}

const useStyles = makeStyles((colors, typography) => ({
  tabs: { gap: spacing.sm },
  tab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  tabActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 46,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  search: { ...typography.body, flex: 1, height: '100%', color: colors.ink },
  list: { gap: spacing.md },
}));
