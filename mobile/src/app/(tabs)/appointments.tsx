import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppointmentCard } from '@/components/AppointmentCard';
import { AppointmentSheet } from '@/components/AppointmentSheet';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { useAppointments } from '@/hooks/useAppointments';
import { matchesSearch, type AppointmentStatus } from '@/lib/appointments';
import { colors, radius, spacing, typography } from '@/theme';

type Tab = AppointmentStatus | 'ALL';
const TABS: { value: Tab; label: string }[] = [
  { value: 'PENDING', label: 'Bekleyen' },
  { value: 'CONFIRMED', label: 'Onaylanan' },
  { value: 'COMPLETED', label: 'Tamamlanan' },
  { value: 'CANCELLED', label: 'İptal' },
  { value: 'ALL', label: 'Tümü' },
];

export default function AppointmentsScreen() {
  const [tab, setTab] = useState<Tab>('PENDING');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { items, loading, error, refreshing, refresh, retry, setStatus } = useAppointments({ status: tab });

  // Closed slots are calendar entries, not bookings; they are managed from the calendar tab.
  const visible = (items ?? []).filter((a) => !a.isBlockedSlot && (tab === 'ALL' || a.status === tab) && matchesSearch(a, query));
  const selected = items?.find((a) => a.id === selectedId) ?? null;

  return (
    <Screen title="Randevular" subtitle="Tüm rezervasyonlar" onRefresh={refresh} refreshing={refreshing}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {TABS.map((t) => {
          const active = t.value === tab;
          return (
            <Pressable
              key={t.value}
              onPress={() => setTab(t.value)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={[styles.tab, active && styles.tabActive]}>
              <Text style={[typography.label, { color: active ? colors.onBrand : colors.ink2 }]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <TextInput
        style={styles.search}
        value={query}
        onChangeText={setQuery}
        placeholder="Müşteri adı veya telefon ara"
        placeholderTextColor={colors.ink3}
        autoCorrect={false}
        clearButtonMode="while-editing"
        returnKeyType="search"
      />

      {loading ? <LoadingView /> : null}
      {error ? <ErrorView message={error} onRetry={retry} /> : null}
      {items && !error ? (
        visible.length === 0 ? (
          <EmptyState
            title={query ? 'Sonuç bulunamadı' : 'Bu listede randevu yok'}
            description={query ? 'Farklı bir isim veya telefon numarası deneyin.' : 'Yeni rezervasyonlar geldiğinde burada görünecek.'}
          />
        ) : (
          <View style={styles.list}>
            {visible.map((a) => (
              <AppointmentCard key={a.id} appointment={a} showDate onPress={() => setSelectedId(a.id)} />
            ))}
          </View>
        )
      ) : null}

      <AppointmentSheet appointment={selected} onClose={() => setSelectedId(null)} onChangeStatus={setStatus} />
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  search: {
    ...typography.body,
    color: colors.ink,
    height: 46,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  list: { gap: spacing.md },
});
