import { useState } from 'react';
import { Text, View } from 'react-native';

import { Icon, icons } from '@/components/Icon';
import { ListRow, Page } from '@/components/ui';
import { changeLanguage, getLanguagePreference, LANGUAGES, systemLanguage, t, type LanguagePreference } from '@/i18n';
import { makeStyles, spacing, useTheme } from '@/theme';

/** "Dil": the app language. Language names stay in their own language so anyone can find theirs. */
export default function LanguageScreen() {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  const [selected, setSelected] = useState<LanguagePreference>(getLanguagePreference);

  const pick = (pref: LanguagePreference) => {
    setSelected(pref);
    changeLanguage(pref).catch(() => {});
  };
  const check = <Icon name={icons.check} size={20} color={colors.brand} />;
  const systemName = LANGUAGES.find((l) => l.code === systemLanguage())?.name;

  return (
    <Page>
      <View style={styles.list} accessibilityRole="radiogroup">
        <ListRow
          icon={icons.globe}
          title={t('Telefonun dili')}
          subtitle={systemName}
          right={selected === 'system' ? check : undefined}
          chevron={false}
          onPress={() => pick('system')}
        />
        {LANGUAGES.map((l) => (
          <ListRow key={l.code} title={l.name} right={selected === l.code ? check : undefined} chevron={false} onPress={() => pick(l.code)} />
        ))}
      </View>
      <Text style={typography.caption}>{t('Dil değiştiğinde uygulama yeniden başlatılır.')}</Text>
    </Page>
  );
}

const useStyles = makeStyles(() => ({
  list: { gap: spacing.sm },
}));
