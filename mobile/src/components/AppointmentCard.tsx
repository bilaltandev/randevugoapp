import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StatusBadge, statusTones } from '@/components/StatusBadge';
import { formatPrice, shortDateFromKey, statusMeta, type Appointment } from '@/lib/appointments';
import { elevation, makeStyles, radius, spacing, useTheme } from '@/theme';
import { t } from '@/i18n';

type Props = { appointment: Appointment; onPress: () => void; showDate?: boolean };

/** One booking: a status-colored edge, the time, the customer with their initials, service · staff and price. */
export function AppointmentCard({ appointment: a, onPress, showDate }: Props) {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  const cancelled = a.status === 'CANCELLED';
  const tone = statusTones(colors)[statusMeta(a).tone];
  const title = a.isBlockedSlot ? a.notes || t('Kapalı saat') : a.customerName;
  const subtitle = a.isBlockedSlot
    ? a.employee?.name ?? ''
    : [a.service?.name, a.employee?.name].filter(Boolean).join(' · ');
  const initials = a.isBlockedSlot
    ? '—'
    : (a.customerName ?? '')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toLocaleUpperCase('tr-TR'))
        .join('');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${a.startTime} ${title}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed, cancelled && styles.dim]}>
      <View style={[styles.edge, { backgroundColor: tone.fg }]} />
      <View style={styles.time}>
        <Text style={styles.start}>{a.startTime}</Text>
        <Text style={typography.caption}>{a.endTime}</Text>
        {showDate ? (
          <View style={styles.date}>
            <Text style={[typography.caption, styles.dateText]} numberOfLines={1}>
              {shortDateFromKey(a.date)}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.divider} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <View style={[styles.avatar, { backgroundColor: tone.bg }]}>
            <Text style={[styles.avatarText, { color: tone.fg }]}>{initials || '?'}</Text>
          </View>
          <Text style={[typography.heading, styles.flex, cancelled && styles.strike]} numberOfLines={1}>
            {title}
          </Text>
        </View>
        {subtitle ? (
          <Text style={typography.body} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
        <View style={styles.footer}>
          <StatusBadge appointment={a} />
          {!a.isBlockedSlot ? <Text style={[typography.heading, { color: colors.ink }]}>{formatPrice(a.price)}</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles((colors, typography) => ({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    paddingEnd: spacing.lg,
    paddingStart: spacing.lg + 4,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...elevation(colors),
  },
  edge: { position: 'absolute', start: 0, top: 0, bottom: 0, width: 4 },
  pressed: { backgroundColor: colors.surfaceMuted, transform: [{ scale: 0.99 }] },
  dim: { opacity: 0.6 },
  time: { width: 54, gap: 2 },
  start: { ...typography.title, fontSize: 19, lineHeight: 24 },
  date: { marginTop: spacing.xs, alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: colors.surfaceMuted },
  dateText: { fontSize: 11 },
  divider: { width: StyleSheet.hairlineWidth, backgroundColor: colors.line },
  body: { flex: 1, gap: spacing.xs },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 10, fontWeight: '800' },
  flex: { flex: 1 },
  strike: { textDecorationLine: 'line-through' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs },
}));
