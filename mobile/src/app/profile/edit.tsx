import { router } from 'expo-router';
import { useState } from 'react';

import { fetchAccount, updateAccount, type Account } from '@/api/panel';
import { useAuth } from '@/auth/AuthProvider';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { Button, InlineError, Page, TextField } from '@/components/ui';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { isOptionalEmail, isPhone } from '@/lib/forms';
import { t } from '@/i18n';

export default function EditProfileScreen() {
  const { data, loading, error, retry } = useApiQuery(fetchAccount);
  if (loading) return <LoadingView />;
  if (error || !data) return <ErrorView message={error ?? t('Profil yüklenemedi.')} onRetry={retry} />;
  return <ProfileForm account={data} />;
}

function ProfileForm({ account }: { account: Account }) {
  const { reloadProfile } = useAuth();
  const [name, setName] = useState(account.name);
  const [email, setEmail] = useState(account.email);
  const [phone, setPhone] = useState(account.phone ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const save = useApiMutation();
  const emailChanged = email.trim().toLowerCase() !== account.email;

  const submit = async () => {
    setFormError(null);
    if (!name.trim()) return setFormError(t('Ad soyad boş olamaz.'));
    if (!email.trim() || !isOptionalEmail(email)) return setFormError(t('Geçerli bir e-posta adresi girin.'));
    if (phone.trim() && !isPhone(phone)) return setFormError(t('Telefon numarası geçerli değil.'));
    if (emailChanged && !currentPassword) return setFormError(t('E-posta değiştirmek için mevcut şifrenizi girin.'));

    const ok = await save.run((client) =>
      updateAccount(client, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        currentPassword: emailChanged ? currentPassword : undefined,
      })
    );
    if (ok) {
      await reloadProfile();
      router.back();
    }
  };

  return (
    <Page>
      <TextField label={t('Ad soyad')} value={name} onChangeText={setName} autoCapitalize="words" textContentType="name" maxLength={80} />
      <TextField
        label={t('E-posta (giriş adresiniz)')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      {emailChanged ? (
        <TextField
          label={t('Mevcut şifreniz')}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          textContentType="password"
          hint={t('Giriş adresinizi değiştirmek için şifrenizi doğrulayın.')}
        />
      ) : null}
      <TextField label={t('Telefon')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder={t('0532 000 00 00')} />
      <InlineError message={formError ?? save.error} />
      <Button label={t('Kaydet')} icon="check" onPress={submit} busy={save.busy} />
    </Page>
  );
}
