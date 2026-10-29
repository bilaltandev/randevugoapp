import { Text, View } from 'react-native';

import { Icon, icons } from '@/components/Icon';
import { makeStyles, radius, spacing, useTheme } from '@/theme';

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: keyof typeof icons;
};

/** Shown when a list has nothing yet: a dashed outline (an empty slot) with a ringed icon. */
export function EmptyState({ title, description, icon = 'sparkles' }: EmptyStateProps) {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.card}>
      <View style={styles.ring}>
        <View style={styles.icon}>
          <Icon name={icons[icon]} size={22} color={colors.brand} />
        </View>
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
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.lineStrong,
  },
  ring: { padding: 6, borderRadius: 40, borderWidth: 1, borderColor: colors.brandLine, marginBottom: spacing.xs },
  icon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: colors.brandSoft },
  center: { textAlign: 'center' },
}));
