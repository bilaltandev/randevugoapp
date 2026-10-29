import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppointmentCard } from '@/components/AppointmentCard';
import { AppointmentSheet } from '@/components/AppointmentSheet';
import { EmptyState } from '@/components/EmptyState';
import { Icon, icons } from '@/components/Icon';
import { BarButton, Screen } from '@/components/Screen';
import { Button } from '@/components/ui';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { useAppointments } from '@/hooks/useAppointments';
import { dateKey, longDate, matchesSearch, type AppointmentStatus } from '@/lib/appointments';
import { elevation, makeStyles, radius, spacing, useTheme } from '@/theme';
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
  const todayKey = dateKey(new Date());
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

  // Consecutive bookings of the same day under one date heading (the list arrives in date order).
  const groups: { date: string; items: typeof visible }[] = [];
  for (const a of visible) {
    const last = groups[groups.length - 1];
    if (last && last.date === a.date) last.items.push(a);
    else groups.push({ date: a.date, items: [a] });
  }

  return (
    <Screen
      title={t('Randevular')}
      subtitle={t('Tüm rezervasyonlar')}
      accent="blue"
      onRefresh={refresh}
      refreshing={refreshing}
      right={<BarButton icon="add" label={t('Yeni randevu')} primary onPress={() => router.push('/appointment/new')} />}>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs} style={styles.tabsScroll}>
        {TABS.map((tabItem) => {
          const active = tabItem.value === tab;
          return (
            <Pressable
              key={tabItem.value}
              onPress={() => setTab(tabItem.value)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={({ pressed }) => [styles.tab, active && styles.tabActive, pressed && styles.pressed]}>
              {active ? <View style={[styles.tabDot, { backgroundColor: colors.onBrand }]} /> : null}
              <Text style={[typography.label, { color: active ? colors.onBrand : colors.ink2, fontWeight: '700' }]}>{tabItem.label}</Text>
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
          <View style={styles.groups}>
            {groups.map((g) => (
              <View key={g.date} style={styles.list}>
                <View style={styles.dayHead}>
                  <Text style={[typography.heading, styles.dayTitle]}>{g.date === todayKey ? t('Bugün') : longDate(fromKey(g.date))}</Text>
                  <View style={styles.dayLine} />
                  <View style={styles.dayCount}>
                    <Text style={[typography.caption, { color: colors.blue, fontWeight: '800' }]}>{g.items.length}</Text>
                  </View>
                </View>
                {g.items.map((a) => (
                  <AppointmentCard key={a.id} appointment={a} onPress={() => setSelectedId(a.id)} />
                ))}
              </View>
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

function fromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const useStyles = makeStyles((colors, typography) => ({
  // Room for the pills' shadows inside the horizontal scroller.
  tabsScroll: { marginHorizontal: -spacing.lg },
  tabs: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.xs },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    ...elevation(colors),
  },
  tabActive: { backgroundColor: colors.blue, borderColor: colors.blue },
  tabDot: { width: 6, height: 6, borderRadius: 3 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 50,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    ...elevation(colors),
  },
  search: { ...typography.body, flex: 1, height: '100%', color: colors.ink },
  groups: { gap: spacing.xl },
  list: { gap: spacing.md },
  dayHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dayTitle: { fontWeight: '700' },
  dayLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.lineStrong },
  dayCount: { minWidth: 24, alignItems: 'center', paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: colors.blueSoft },
}));
