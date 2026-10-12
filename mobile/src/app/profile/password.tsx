import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Text } from 'react-native';

import { changePassword } from '@/api/panel';
import { Button, InlineError, Page, TextField } from '@/components/ui';
import { useApiMutation } from '@/hooks/useApiQuery';
import { useTheme } from '@/theme';

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
    if (!current) return setFormError('Mevcut şifrenizi girin.');
    if (next.length < MIN_PASSWORD) return setFormError(`Yeni şifre en az ${MIN_PASSWORD} karakter olmalı.`);
    if (next !== repeat) return setFormError('Yeni şifreler birbiriyle aynı değil.');

    let signedOut = 0;
    const ok = await save.run(async (client) => {
      signedOut = (await changePassword(client, current, next)).signedOutDevices;
    });
    if (ok) {
      Alert.alert(
        'Şifreniz değişti',
        signedOut > 0 ? `Diğer ${signedOut} cihazdaki oturum ve web oturumlarınız kapatıldı.` : 'Web panelindeki oturumlarınız kapatıldı; bu cihaz açık kalır.'
      );
      router.back();
    }
  };

  return (
    <Page>
      <Text style={typography.body}>Şifre değiştiğinde bu telefon dışındaki tüm oturumlarınız (web paneli dahil) kapanır.</Text>
      <TextField label="Mevcut şifre" value={current} onChangeText={setCurrent} secureTextEntry textContentType="password" autoComplete="current-password" />
      <TextField
        label="Yeni şifre"
        value={next}
        onChangeText={setNext}
        secureTextEntry
        textContentType="newPassword"
        autoComplete="new-password"
        hint={`En az ${MIN_PASSWORD} karakter.`}
      />
      <TextField label="Yeni şifre (tekrar)" value={repeat} onChangeText={setRepeat} secureTextEntry textContentType="newPassword" />
      <InlineError message={formError ?? save.error} />
      <Button label="Şifreyi değiştir" icon="key" onPress={submit} busy={save.busy} />
    </Page>
  );
}
