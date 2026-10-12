import { router } from 'expo-router';
import { View } from 'react-native';

import { icons } from '@/components/Icon';
import { ListRow, Page } from '@/components/ui';
import { makeStyles, spacing } from '@/theme';

/** "Ayarlar": the sections of the web settings page, one screen each. */
export default function SettingsScreen() {
  const styles = useStyles();
  return (
    <Page>
      <View style={styles.list}>
        <ListRow
          icon={icons.business}
          title="İşletme bilgileri"
          subtitle="Ad, sektör, logo, iletişim, adres ve uzman seçimi"
          onPress={() => router.push('/settings/business')}
        />
        <ListRow icon={icons.hours} title="Çalışma ve mola saatleri" subtitle="Online randevu alınabilecek saatler" onPress={() => router.push('/settings/hours')} />
      </View>
    </Page>
  );
}

const useStyles = makeStyles(() => ({
  list: { gap: spacing.sm },
}));
