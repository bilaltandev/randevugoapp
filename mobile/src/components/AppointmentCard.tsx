import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StatusBadge } from '@/components/StatusBadge';
import { formatPrice, shortDateFromKey, type Appointment } from '@/lib/appointments';
import { makeStyles, radius, spacing, useTheme } from '@/theme';

type Props = { appointment: Appointment; onPress: () => void; showDate?: boolean };

export function AppointmentCard({ appointment: a, onPress, showDate }: Props) {
  const { typography } = useTheme();
  const styles = useStyles();
  const cancelled = a.status === 'CANCELLED';
  const title = a.isBlockedSlot ? a.notes || 'Kapalı saat' : a.customerName;
  const subtitle = a.isBlockedSlot
    ? a.employee?.name ?? ''
    : [a.service?.name, a.employee?.name].filter(Boolean).join(' · ');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${a.startTime} ${title}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed, cancelled && styles.dim]}>
      <View style={styles.time}>
        <Text style={typography.heading}>{a.startTime}</Text>
        <Text style={typography.caption}>{a.endTime}</Text>
        {showDate ? <Text style={[typography.caption, styles.date]}>{shortDateFromKey(a.date)}</Text> : null}
      </View>
      <View style={styles.body}>
        <Text style={[typography.heading, cancelled && styles.strike]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={typography.body} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
        <View style={styles.footer}>
          <StatusBadge appointment={a} />
          {!a.isBlockedSlot ? <Text style={typography.label}>{formatPrice(a.price)}</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  card: {
    flexDirection: 'row',
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  pressed: { backgroundColor: colors.surfaceMuted },
  dim: { opacity: 0.6 },
  time: { width: 56, gap: 2 },
  date: { marginTop: spacing.xs },
  body: { flex: 1, gap: spacing.xs },
  strike: { textDecorationLine: 'line-through' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs },
}));
