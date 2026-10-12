import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { fetchEmployees } from '@/api/business';
import { AppointmentCard } from '@/components/AppointmentCard';
import { AppointmentSheet } from '@/components/AppointmentSheet';
import { EmptyState } from '@/components/EmptyState';
import { Icon, icons } from '@/components/Icon';
import { BarButton, Screen } from '@/components/Screen';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { TimeGrid, toneColors } from '@/components/TimeGrid';
import { Chip, ChipRow } from '@/components/ui';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useAppointments } from '@/hooks/useAppointments';
import { addDays, dateKey, forDay, longDate, weekOf, type Appointment } from '@/lib/appointments';
import { makeStyles, radius, spacing, useTheme } from '@/theme';

type Mode = 'day' | 'week' | 'month';
const MODES: { value: Mode; label: string; icon: keyof typeof icons }[] = [
  { value: 'day', label: 'Gün', icon: 'day' },
  { value: 'week', label: 'Hafta', icon: 'week' },
  { value: 'month', label: 'Ay', icon: 'grid' },
];
const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

/** Month grid (Monday first), padded so day 1 sits under its weekday. */
function monthDays(d: Date): (Date | null)[] {
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const lead = (first.getDay() + 6) % 7;
  const count = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = Array.from({ length: lead }, () => null);
  for (let i = 1; i <= count; i++) cells.push(new Date(d.getFullYear(), d.getMonth(), i));
  while (cells.length % 7) cells.push(null);
  return cells;
}

/** Day / week / month calendar like the web panel: time grid, tap free time to book, staff filter. */
export default function CalendarScreen() {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  const [mode, setMode] = useState<Mode>('day');
  const [cursor, setCursor] = useState(() => new Date());
  const [employeeId, setEmployeeId] = useState<string>('ALL');
  const [selected, setSelected] = useState<Appointment | null>(null);
  const todayKey = dateKey(new Date());

  const range = useMemo(() => {
    if (mode === 'day') return { from: dateKey(cursor), to: dateKey(cursor), days: [cursor] };
    if (mode === 'week') {
      const week = weekOf(cursor);
      return { from: dateKey(week[0]), to: dateKey(week[6]), days: week };
    }
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    return { from: dateKey(first), to: dateKey(last), days: [] as Date[] };
  }, [mode, cursor]);

  const { items, loading, error, refreshing, refresh, retry, setStatus } = useAppointments(
    mode === 'day' ? { date: range.from } : { from: range.from, to: range.to }
  );
  const staff = useApiQuery(fetchEmployees);
  const activeStaff = (staff.data ?? []).filter((e) => e.isActive);
  const filterName = activeStaff.find((e) => e.id === employeeId)?.name;

  const visible = (items ?? []).filter((a) => employeeId === 'ALL' || a.employee?.name === filterName);
  const detail = selected ? ((items ?? []).find((a) => a.id === selected.id) ?? selected) : null;

  const step = (dir: -1 | 1) => {
    if (mode === 'day') setCursor(addDays(cursor, dir));
    else if (mode === 'week') setCursor(addDays(cursor, dir * 7));
    else setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + dir, 1));
  };

  const title =
    mode === 'day'
      ? longDate(cursor)
      : mode === 'week'
        ? `${range.days[0].getDate()} ${MONTHS[range.days[0].getMonth()]} – ${range.days[6].getDate()} ${MONTHS[range.days[6].getMonth()]}`
        : `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;

  const bookingDate = (key: string) => (key < todayKey ? todayKey : key);
  const createAt = (date: string, time?: string) =>
    router.push({ pathname: '/appointment/new', params: { date: bookingDate(date), ...(time ? { time } : {}) } });

  const openDay = (d: Date) => {
    setCursor(d);
    setMode('day');
  };

  const isCurrent =
    mode === 'day'
      ? range.from === todayKey
      : mode === 'week'
        ? range.from <= todayKey && todayKey <= range.to
        : todayKey.startsWith(range.from.slice(0, 7));

  return (
    <Screen
      title="Takvim"
      subtitle={title}
      onRefresh={refresh}
      refreshing={refreshing}
      right={
        <View style={styles.barButtons}>
          <BarButton
            icon="block"
            label="Saat kapat"
            onPress={() => router.push({ pathname: '/appointment/new', params: { date: bookingDate(dateKey(cursor)), mode: 'block' } })}
          />
          <BarButton icon="add" label="Yeni randevu" onPress={() => createAt(dateKey(cursor))} />
        </View>
      }>
      <View style={styles.segment}>
        {MODES.map((m) => {
          const active = m.value === mode;
          return (
            <Pressable
              key={m.value}
              onPress={() => setMode(m.value)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={[styles.segmentItem, active && styles.segmentActive]}>
              <Icon name={icons[m.icon]} size={16} color={active ? colors.onBrand : colors.ink2} />
              <Text style={[typography.label, { color: active ? colors.onBrand : colors.ink2 }]}>{m.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.nav}>
        <NavButton icon="chevronLeft" label="Önceki" onPress={() => step(-1)} />
        <Text style={[typography.heading, styles.navTitle]} numberOfLines={1}>
          {title}
        </Text>
        {!isCurrent ? (
          <Pressable onPress={() => setCursor(new Date())} style={styles.todayButton} accessibilityRole="button">
            <Icon name={icons.today} size={14} color={colors.brand} />
            <Text style={[typography.label, { color: colors.brand }]}>Bugün</Text>
          </Pressable>
        ) : null}
        <NavButton icon="chevronRight" label="Sonraki" onPress={() => step(1)} />
      </View>

      {activeStaff.length > 1 ? (
        <ChipRow>
          <Chip label="Tüm çalışanlar" selected={employeeId === 'ALL'} onPress={() => setEmployeeId('ALL')} />
          {activeStaff.map((e) => (
            <Chip key={e.id} label={e.name} selected={employeeId === e.id} onPress={() => setEmployeeId(e.id)} />
          ))}
        </ChipRow>
      ) : null}

      {loading ? <LoadingView /> : null}
      {error ? <ErrorView message={error} onRetry={retry} /> : null}

      {items && !error ? (
        <Animated.View key={`${mode}-${range.from}`} entering={FadeIn.duration(220)} style={styles.body}>
          {mode === 'month' ? (
            <MonthGrid cursor={cursor} appointments={visible} onPick={openDay} />
          ) : (
            <TimeGrid days={range.days} appointments={visible} onSelect={setSelected} onCreateAt={createAt} onPickDay={openDay} />
          )}

          <Legend />

          {mode === 'day' ? (
            <View style={styles.list}>
              <Text style={typography.heading}>Günün listesi</Text>
              {forDay(visible, range.from).length === 0 ? (
                <EmptyState icon="calendar" title="Bu gün için randevu yok" description="Izgarada boş bir saate dokunarak hızlıca randevu ekleyebilirsiniz." />
              ) : (
                forDay(visible, range.from).map((a) => <AppointmentCard key={a.id} appointment={a} onPress={() => setSelected(a)} />)
              )}
            </View>
          ) : null}
        </Animated.View>
      ) : null}

      <AppointmentSheet appointment={detail} onClose={() => setSelected(null)} onChangeStatus={setStatus} />
    </Screen>
  );
}

function MonthGrid({ cursor, appointments, onPick }: { cursor: Date; appointments: Appointment[]; onPick: (d: Date) => void }) {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  const tones = toneColors(colors);
  const todayKey = dateKey(new Date());
  const cells = monthDays(cursor);

  return (
    <View style={styles.month}>
      <View style={styles.monthRow}>
        {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((d) => (
          <Text key={d} style={[typography.caption, styles.monthHead]}>
            {d}
          </Text>
        ))}
      </View>
      {Array.from({ length: cells.length / 7 }, (_, r) => (
        <View key={r} style={styles.monthRow}>
          {cells.slice(r * 7, r * 7 + 7).map((d, i) => {
            if (!d) return <View key={i} style={styles.monthCell} />;
            const key = dateKey(d);
            const list = appointments.filter((a) => a.date === key && !a.isBlockedSlot && a.status !== 'CANCELLED');
            const pending = list.filter((a) => a.status === 'PENDING').length;
            const isToday = key === todayKey;
            return (
              <Pressable
                key={key}
                onPress={() => onPick(d)}
                accessibilityRole="button"
                accessibilityLabel={`${d.getDate()} ${MONTHS[d.getMonth()]}: ${list.length} randevu`}
                style={({ pressed }) => [styles.monthCell, pressed && { backgroundColor: colors.surfaceMuted }]}>
                <View style={[styles.monthNum, isToday && styles.monthNumToday]}>
                  <Text style={[typography.label, { color: isToday ? colors.onBrand : colors.ink }]}>{d.getDate()}</Text>
                </View>
                {list.length > 0 ? (
                  <View style={[styles.countPill, { backgroundColor: pending ? tones.pending.bg : tones.confirmed.bg }]}>
                    <Text style={[typography.caption, { color: pending ? tones.pending.fg : tones.confirmed.fg, fontWeight: '700', fontSize: 11 }]}>
                      {list.length}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function Legend() {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  const tones = toneColors(colors);
  const items: [keyof typeof tones, string][] = [
    ['pending', 'Onay bekliyor'],
    ['confirmed', 'Onaylı'],
    ['completed', 'Tamamlandı'],
    ['blocked', 'Kapalı saat'],
  ];
  return (
    <View style={styles.legend}>
      {items.map(([tone, label]) => (
        <View key={tone} style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: tones[tone].bar }]} />
          <Text style={typography.caption}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

function NavButton({ icon, label, onPress }: { icon: keyof typeof icons; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.navButton, pressed && { opacity: 0.7 }]}>
      <Icon name={icons[icon]} size={18} color={colors.ink} />
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  barButtons: { flexDirection: 'row', gap: spacing.sm },
  segment: { flexDirection: 'row', padding: 4, gap: 4, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  segmentItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.sm, borderRadius: radius.sm },
  segmentActive: { backgroundColor: colors.brand },
  nav: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  navTitle: { flex: 1, textAlign: 'center' },
  navButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  todayButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.brandSoft },
  body: { gap: spacing.lg },
  list: { gap: spacing.md },
  month: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, padding: spacing.xs },
  monthRow: { flexDirection: 'row' },
  monthHead: { flex: 1, textAlign: 'center', paddingVertical: spacing.xs },
  monthCell: { flex: 1, aspectRatio: 0.85, alignItems: 'center', paddingTop: 6, gap: 4, borderRadius: radius.sm },
  monthNum: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  monthNumToday: { backgroundColor: colors.brand },
  countPill: { minWidth: 20, paddingHorizontal: 5, borderRadius: radius.pill, alignItems: 'center' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
}));
