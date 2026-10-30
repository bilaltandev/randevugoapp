import * as WebBrowser from 'expo-web-browser';
import { Pressable, Text, View } from 'react-native';

import { Icon, icons } from '@/components/Icon';
import { makeStyles, radius, spacing, useTheme } from '@/theme';
import { t } from '@/i18n';

const NOTICE_URL = 'https://calendlygo.com/aydinlatma-metni';

/** The required "I read the privacy notice" tick at sign-up. The link opens the notice in an in-app browser. */
export function PrivacyConsent({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={styles.row}>
      <View style={[styles.box, checked && styles.boxOn]}>
        {checked ? <Icon name={icons.check} size={14} color={colors.onBrand} /> : null}
      </View>
      <Text style={[typography.body, styles.text]}>
        {t('Okudum ve anladım:')}{' '}
        <Text
          accessibilityRole="link"
          onPress={() => WebBrowser.openBrowserAsync(NOTICE_URL)}
          style={{ color: colors.brand, fontWeight: '700' }}>
          {t('Aydınlatma Metni')}
        </Text>
      </Text>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  box: {
    width: 22,
    height: 22,
    marginTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface,
  },
  boxOn: { borderColor: colors.brand, backgroundColor: colors.brand },
  text: { flex: 1 },
}));
