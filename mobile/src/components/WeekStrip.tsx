import { Pressable, Text, View } from 'react-native';

import { addDays, dateKey, longDate, shortDayName, weekOf } from '@/lib/appointments';
import { makeStyles, radius, spacing, useTheme } from '@/theme';

type Props = {
  selected: Date;
  onSelect: (d: Date) => void;
  /** Days before this key can't be chosen (e.g. today for new bookings). */
  minKey?: string;
};

/** Monday-first week with previous/next week arrows; today is highlighted. */
export function WeekStrip({ selected, onSelect, minKey }: Props) {
  const { typography } = useTheme();
  const styles = useStyles();
  const todayKey = dateKey(new Date());
  const selectedKey = dateKey(selected);
  const week = weekOf(selected);
  const canGoBack = !minKey || dateKey(week[0]) > minKey;

  return (
    <View style={styles.weekNav}>
      <NavButton label="‹" accessibilityLabel="Önceki hafta" disabled={!canGoBack} onPress={() => onSelect(addDays(selected, -7))} />
      <View style={styles.week}>
        {week.map((d) => {
          const key = dateKey(d);
          const active = key === selectedKey;
          const disabled = !!minKey && key < minKey;
          return (
            <Pressable
              key={key}
              onPress={() => onSelect(d)}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityState={{ selected: active, disabled }}
              accessibilityLabel={longDate(d)}
              style={[styles.day, active && styles.dayActive, disabled && styles.disabled]}>
              <Text style={[typography.caption, active && styles.onBrand]}>{shortDayName(d)}</Text>
              <Text style={[typography.heading, active && styles.onBrand, key === todayKey && !active && styles.today]}>{d.getDate()}</Text>
            </Pressable>
          );
        })}
      </View>
      <NavButton label="›" accessibilityLabel="Sonraki hafta" onPress={() => onSelect(addDays(selected, 7))} />
    </View>
  );
}

function NavButton({ label, accessibilityLabel, onPress, disabled }: { label: string; accessibilityLabel: string; onPress: () => void; disabled?: boolean }) {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={[styles.nav, disabled && styles.disabled]}>
      <Text style={[typography.title, { color: colors.ink2 }]}>{label}</Text>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  weekNav: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  nav: { paddingHorizontal: spacing.xs },
  week: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  day: { alignItems: 'center', gap: 2, paddingVertical: spacing.sm, width: 40, borderRadius: radius.md },
  dayActive: { backgroundColor: colors.brand },
  onBrand: { color: colors.onBrand },
  today: { color: colors.brand },
  disabled: { opacity: 0.35 },
}));
