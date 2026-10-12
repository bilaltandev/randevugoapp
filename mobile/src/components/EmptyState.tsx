import { StyleSheet, Text, View } from 'react-native';

import { Icon, icons } from '@/components/Icon';
import { makeStyles, radius, spacing, useTheme } from '@/theme';

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: keyof typeof icons;
};

/** Card shown when a list has nothing to show yet. */
export function EmptyState({ title, description, icon = 'sparkles' }: EmptyStateProps) {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.card}>
      <View style={styles.icon}>
        <Icon name={icons[icon]} size={22} color={colors.brand} />
      </View>
      <Text style={[typography.heading, styles.center]}>{title}</Text>
      <Text style={[typography.body, styles.center]}>{description}</Text>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  card: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  icon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: colors.brandSoft, marginBottom: spacing.xs },
  center: { textAlign: 'center' },
}));
