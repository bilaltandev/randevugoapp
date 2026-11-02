import { useState } from 'react';
import { Alert, Text } from 'react-native';

import { deleteAccount } from '@/api/panel';
import { useAuth } from '@/auth/AuthProvider';
import { Button, InlineError, Page, SwitchRow, TextField } from '@/components/ui';
import { useApiMutation } from '@/hooks/useApiQuery';
import { useTheme } from '@/theme';
import { t } from '@/i18n';

// Required by the App Store and Google Play: the account can be deleted from inside the app.
export default function DeleteAccountScreen() {
  const { typography, colors } = useTheme();
  const { profile, signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [sure, setSure] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const remove = useApiMutation();
  const isMember = !!profile?.member;

  const confirm = () => {
    setFormError(null);
    if (!password) return setFormError(t('Şifrenizi girin.'));
    Alert.alert(t('Hesabınız silinsin mi?'), t('Bu işlem geri alınamaz.'), [
      { text: t('Vazgeç'), style: 'cancel' },
      {
        text: t('Kalıcı olarak sil'),
        style: 'destructive',
        onPress: async () => {
          const ok = await remove.run((client) => deleteAccount(client, password));
          if (ok) {
            Alert.alert(t('Hesabınız silindi'));
            await signOut();
          }
        },
      },
    ]);
  };

  return (
    <Page>
      <Text style={typography.body}>
        {isMember
          ? t('Yalnızca kendi hesabınız silinir. Geçmiş randevular işletmede kalır.')
          : t('İşletmeniz, rezervasyon sayfanız, randevular, müşteriler, hizmetler, ekip üyelerinin hesapları ve aboneliğiniz kalıcı olarak silinir. Kalan abonelik süresi iade edilmez.')}
      </Text>
      <TextField label={t('Şifreniz')} value={password} onChangeText={setPassword} secureTextEntry textContentType="password" autoComplete="current-password" />
      <SwitchRow label={t('Hesabımın ve tüm verilerimin kalıcı olarak silineceğini anlıyorum.')} value={sure} onValueChange={setSure} />
      <InlineError message={formError ?? remove.error} />
      <Button label={t('Hesabımı kalıcı olarak sil')} icon="trash" variant="danger" onPress={confirm} busy={remove.busy} disabled={!sure} />
      <Text style={[typography.caption, { color: colors.ink3 }]}>{t('Yönetici hesapları buradan silinemez.')}</Text>
    </Page>
  );
}
