import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { AppointmentCard } from '@/components/AppointmentCard';
import { AppointmentSheet } from '@/components/AppointmentSheet';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { useAppointments } from '@/hooks/useAppointments';
import { dateKey, formatPrice, longDate, summarizeDay, timeKey } from '@/lib/appointments';
import { colors, radius, spacing, typography } from '@/theme';

export default function HomeScreen() {
  const { profile } = useAuth();
  const today = useMemo(() => new Date(), []);
  const todayKey = dateKey(today);
  const { items, loading, error, refreshing, refresh, retry, setStatus } = useAppointments({ date: todayKey });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const summary = items ? summarizeDay(items, todayKey, timeKey(new Date())) : null;
  const selected = items?.find((a) => a.id === selectedId) ?? null;

  return (
    <Screen title={profile?.business.name ?? 'Ana Sayfa'} subtitle={`Bugün · ${longDate(today)}`} onRefresh={refresh} refreshing={refreshing}>
      {loading ? <LoadingView /> : null}
      {error ? <ErrorView message={error} onRetry={retry} /> : null}

      {summary ? (
        <>
          <View style={styles.stats}>
            <Stat label="Bugünkü randevu" value={String(summary.total)} />
            <Stat label="Onay bekleyen" value={String(summary.pending)} highlight={summary.pending > 0} />
          </View>
          <Stat label="Tahmini gelir (bugün)" value={formatPrice(summary.revenue)} wide />

          <View style={styles.section}>
            <Text style={typography.heading}>Sıradaki randevular</Text>
            {summary.upcoming.length === 0 ? (
              <EmptyState title="Bugün için bekleyen randevu yok" description="Yeni rezervasyonlar geldiğinde burada görünecek." />
            ) : (
              summary.upcoming.map((a) => <AppointmentCard key={a.id} appointment={a} onPress={() => setSelectedId(a.id)} />)
            )}
          </View>
        </>
      ) : null}

      <AppointmentSheet appointment={selected} onClose={() => setSelectedId(null)} onChangeStatus={setStatus} />
    </Screen>
  );
}

function Stat({ label, value, highlight, wide }: { label: string; value: string; highlight?: boolean; wide?: boolean }) {
  return (
    <View style={[styles.stat, wide ? null : styles.statHalf, highlight && styles.statHighlight]}>
      <Text style={typography.caption}>{label}</Text>
      <Text style={[typography.display, highlight && { color: colors.pending }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: spacing.md },
  stat: {
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  statHalf: { flex: 1 },
  statHighlight: { borderColor: colors.pending },
  section: { gap: spacing.md },
});
