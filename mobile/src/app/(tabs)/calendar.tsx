import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppointmentCard } from '@/components/AppointmentCard';
import { AppointmentSheet } from '@/components/AppointmentSheet';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { useAppointments } from '@/hooks/useAppointments';
import { addDays, dateKey, forDay, longDate, shortDayName, weekOf } from '@/lib/appointments';
import { colors, radius, spacing, typography } from '@/theme';

export default function CalendarScreen() {
  const todayKey = useMemo(() => dateKey(new Date()), []);
  const [selected, setSelected] = useState(() => new Date());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedKey = dateKey(selected);
  const { items, loading, error, refreshing, refresh, retry, setStatus } = useAppointments({ date: selectedKey });

  const week = weekOf(selected);
  const day = items ? forDay(items, selectedKey) : [];
  const detail = items?.find((a) => a.id === selectedId) ?? null;

  return (
    <Screen title="Takvim" subtitle={longDate(selected)} onRefresh={refresh} refreshing={refreshing}>
      <View style={styles.weekNav}>
        <NavButton label="‹" accessibilityLabel="Önceki hafta" onPress={() => setSelected(addDays(selected, -7))} />
        <View style={styles.week}>
          {week.map((d) => {
            const key = dateKey(d);
            const active = key === selectedKey;
            return (
              <Pressable
                key={key}
                onPress={() => setSelected(d)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={longDate(d)}
                style={[styles.day, active && styles.dayActive]}>
                <Text style={[typography.caption, active && styles.onBrand]}>{shortDayName(d)}</Text>
                <Text style={[typography.heading, active && styles.onBrand, key === todayKey && !active && styles.today]}>
                  {d.getDate()}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <NavButton label="›" accessibilityLabel="Sonraki hafta" onPress={() => setSelected(addDays(selected, 7))} />
      </View>

      {selectedKey !== todayKey ? (
        <Pressable onPress={() => setSelected(new Date())} accessibilityRole="button" style={styles.todayLink}>
          <Text style={[typography.label, { color: colors.brand }]}>Bugüne dön</Text>
        </Pressable>
      ) : null}

      {loading ? <LoadingView /> : null}
      {error ? <ErrorView message={error} onRetry={retry} /> : null}
      {items && !error ? (
        day.length === 0 ? (
          <EmptyState title="Bu gün için randevu yok" description="Başka bir gün seçebilir veya aşağı çekerek yenileyebilirsiniz." />
        ) : (
          <View style={styles.list}>
            {day.map((a) => (
              <AppointmentCard key={a.id} appointment={a} onPress={() => setSelectedId(a.id)} />
            ))}
          </View>
        )
      ) : null}

      <AppointmentSheet appointment={detail} onClose={() => setSelectedId(null)} onChangeStatus={setStatus} />
    </Screen>
  );
}

function NavButton({ label, accessibilityLabel, onPress }: { label: string; accessibilityLabel: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel} hitSlop={8} style={styles.nav}>
      <Text style={[typography.title, { color: colors.ink2 }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  weekNav: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  nav: { paddingHorizontal: spacing.xs },
  week: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  day: { alignItems: 'center', gap: 2, paddingVertical: spacing.sm, width: 40, borderRadius: radius.md },
  dayActive: { backgroundColor: colors.brand },
  onBrand: { color: colors.onBrand },
  today: { color: colors.brand },
  todayLink: { alignSelf: 'flex-start', marginTop: -spacing.md },
  list: { gap: spacing.md },
});
