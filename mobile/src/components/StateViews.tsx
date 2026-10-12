import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Icon, icons } from '@/components/Icon';
import { makeStyles, radius, spacing, useTheme } from '@/theme';

export function LoadingView() {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.center} accessibilityLabel="Yükleniyor">
      <ActivityIndicator color={colors.brand} />
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.card} accessibilityRole="alert">
      <View style={styles.messageRow}>
        <Icon name={/ulaşılamadı/i.test(message) ? icons.wifiOff : icons.cancel} size={18} color={colors.danger} />
        <Text style={[typography.label, { color: colors.danger, flex: 1 }]}>{message}</Text>
      </View>
      <Pressable onPress={onRetry} accessibilityRole="button" style={({ pressed }) => [styles.retry, pressed && styles.pressed]}>
        <Icon name={icons.refresh} size={15} color={colors.ink} />
        <Text style={[typography.label, { color: colors.ink }]}>Tekrar dene</Text>
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  center: { paddingVertical: spacing.xxl, alignItems: 'center' },
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
  },
  messageRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  retry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  pressed: { opacity: 0.8 },
}));
