import { Text, View } from 'react-native';

import { Icon, icons } from '@/components/Icon';
import { PASSWORD_RULES } from '@/lib/password';
import { makeStyles, radius, spacing, useTheme } from '@/theme';
import { t } from '@/i18n';

/** Live checklist under a new-password field. */
export function PasswordRules({ password }: { password: string }) {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.list}>
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);
        return (
          <View key={rule.label} style={styles.row}>
            <View style={[styles.dot, met && styles.dotOn]}>{met ? <Icon name={icons.check} size={10} color={colors.onBrand} /> : null}</View>
            <Text style={[typography.caption, met && { color: colors.brand }]}>{t(rule.label)}</Text>
          </View>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  list: { gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  dotOn: { borderColor: colors.brand, backgroundColor: colors.brand },
}));
