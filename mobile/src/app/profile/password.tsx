import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Text } from 'react-native';

import { changePassword } from '@/api/panel';
import { Button, InlineError, Page, TextField } from '@/components/ui';
import { useApiMutation } from '@/hooks/useApiQuery';
import { useTheme } from '@/theme';
import { t } from '@/i18n';

const MIN_PASSWORD = 8;

export default function ChangePasswordScreen() {
  const { typography } = useTheme();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const save = useApiMutation();

  const submit = async () => {
    setFormError(null);
    if (!current) return setFormError(t('Mevcut şifrenizi girin.'));
    if (next.length < MIN_PASSWORD) return setFormError(t('Yeni şifre en az {0} karakter olmalı.', MIN_PASSWORD));
    if (next !== repeat) return setFormError(t('Yeni şifreler birbiriyle aynı değil.'));

    let signedOut = 0;
    const ok = await save.run(async (client) => {
      signedOut = (await changePassword(client, current, next)).signedOutDevices;
    });
    if (ok) {
      Alert.alert(
        t('Şifreniz değişti'),
        signedOut > 0 ? t('Diğer {0} cihazdaki oturum ve web oturumlarınız kapatıldı.', signedOut) : t('Web panelindeki oturumlarınız kapatıldı; bu cihaz açık kalır.')
      );
      router.back();
    }
  };

  return (
    <Page>
      <Text style={typography.body}>{t('Şifre değiştiğinde bu telefon dışındaki tüm oturumlarınız (web paneli dahil) kapanır.')}</Text>
      <TextField label={t('Mevcut şifre')} value={current} onChangeText={setCurrent} secureTextEntry textContentType="password" autoComplete="current-password" />
      <TextField
        label={t('Yeni şifre')}
        value={next}
        onChangeText={setNext}
        secureTextEntry
        textContentType="newPassword"
        autoComplete="new-password"
        hint={t('En az {0} karakter.', MIN_PASSWORD)}
      />
      <TextField label={t('Yeni şifre (tekrar)')} value={repeat} onChangeText={setRepeat} secureTextEntry textContentType="newPassword" />
      <InlineError message={formError ?? save.error} />
      <Button label={t('Şifreyi değiştir')} icon="key" onPress={submit} busy={save.busy} />
    </Page>
  );
}
