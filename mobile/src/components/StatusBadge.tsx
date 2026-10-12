import { Text, View } from 'react-native';

import { statusMeta, type Appointment, type StatusTone } from '@/lib/appointments';
import { makeStyles, radius, spacing, useTheme, type Colors } from '@/theme';

// Same tones as the web status badges (pending amber, confirmed emerald, cancelled red).
const tones = (colors: Colors): Record<StatusTone, { fg: string; bg: string }> => ({
  pending: { fg: colors.pending, bg: colors.pendingSoft },
  confirmed: { fg: colors.brandInk, bg: colors.brandSoft },
  completed: { fg: colors.ink2, bg: colors.surfaceMuted },
  cancelled: { fg: colors.danger, bg: colors.dangerSoft },
  blocked: { fg: colors.ink3, bg: colors.surfaceMuted },
});

export function StatusBadge({ appointment }: { appointment: Pick<Appointment, 'status' | 'isBlockedSlot'> }) {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  const { label, tone } = statusMeta(appointment);
  const { fg, bg } = tones(colors)[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[typography.caption, styles.text, { color: fg }]}>{label}</Text>
    </View>
  );
}

const useStyles = makeStyles(() => ({
  badge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill },
  text: { fontWeight: '600' },
}));
