import { Text, View } from 'react-native';

import { statusMeta, type Appointment, type StatusTone } from '@/lib/appointments';
import { makeStyles, radius, spacing, useTheme, type Colors } from '@/theme';

// Same tones as the web status badges (pending amber, confirmed emerald, cancelled red).
export const statusTones = (colors: Colors): Record<StatusTone, { fg: string; bg: string }> => ({
  pending: { fg: colors.pending, bg: colors.pendingSoft },
  confirmed: { fg: colors.brand, bg: colors.brandSoft },
  completed: { fg: colors.ink3, bg: colors.surfaceMuted },
  cancelled: { fg: colors.danger, bg: colors.dangerSoft },
  blocked: { fg: colors.ink3, bg: colors.surfaceMuted },
});

export function StatusBadge({ appointment }: { appointment: Pick<Appointment, 'status' | 'isBlockedSlot'> }) {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  const { label, tone } = statusMeta(appointment);
  const { fg, bg } = statusTones(colors)[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <View style={[styles.dot, { backgroundColor: fg }]} />
      <Text style={[typography.caption, styles.text, { color: tone === 'confirmed' ? colors.brandInk : fg }]}>{label}</Text>
    </View>
  );
}

const useStyles = makeStyles(() => ({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontWeight: '700' },
}));
