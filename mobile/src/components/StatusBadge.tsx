import { StyleSheet, Text, View } from 'react-native';

import { statusMeta, type Appointment, type StatusTone } from '@/lib/appointments';
import { colors, radius, spacing, typography } from '@/theme';

// Same tones as the web status badges (pending amber, confirmed emerald, cancelled red).
const TONES: Record<StatusTone, { fg: string; bg: string }> = {
  pending: { fg: colors.pending, bg: colors.pendingSoft },
  confirmed: { fg: colors.brandInk, bg: colors.brandSoft },
  completed: { fg: colors.ink2, bg: colors.surfaceMuted },
  cancelled: { fg: colors.danger, bg: colors.dangerSoft },
  blocked: { fg: colors.ink3, bg: colors.surfaceMuted },
};

export function StatusBadge({ appointment }: { appointment: Pick<Appointment, 'status' | 'isBlockedSlot'> }) {
  const { label, tone } = statusMeta(appointment);
  const { fg, bg } = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[typography.caption, styles.text, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill },
  text: { fontWeight: '600' },
});
