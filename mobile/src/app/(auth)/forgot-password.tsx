import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/api/authClient';
import { useAuth } from '@/auth/AuthProvider';
import { loginErrorMessage } from '@/auth/messages';
import { Icon, icons } from '@/components/Icon';
import { Button, InlineError, TextField } from '@/components/ui';
import { isOptionalEmail } from '@/lib/forms';
import { makeStyles, radius, spacing, useTheme } from '@/theme';
import { t } from '@/i18n';

/** Sends the reset e-mail. The new password is set on the web page the e-mail links to. */
export default function ForgotPasswordScreen() {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  const { client } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    setError(null);
    if (!email.trim() || !isOptionalEmail(email)) return setError(t('Geçerli bir e-posta adresi girin.'));
    if (!client) return;
    setBusy(true);
    try {
      await client.requestPasswordReset(email.trim().toLowerCase());
      setSent(true);
    } catch (e) {
      setError(e instanceof ApiError && e.status === 400 ? t(e.message) : loginErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.top}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel={t('Geri')} style={styles.back}>
            <Icon name={icons.chevronLeft} size={20} color={colors.ink} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={typography.display}>{t('Şifremi unuttum')}</Text>
          {sent ? (
            <>
              <Text style={typography.body}>{t('Bu adrese ait bir hesap varsa sıfırlama bağlantısı birkaç dakika içinde gelir. Gelen kutunuzu ve spam klasörünü kontrol edin.')}</Text>
              <Button label={t('Girişe dön')} onPress={() => router.back()} />
            </>
          ) : (
            <>
              <Text style={typography.body}>{t('E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.')}</Text>
              <TextField
                label={t('E-posta adresi')}
                value={email}
                onChangeText={setEmail}
                placeholder="ornek@isletme.com"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
              />
              <InlineError message={error} />
              <Button label={t('Sıfırlama bağlantısı gönder')} onPress={submit} busy={busy} />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((colors) => ({
  safe: { flex: 1, backgroundColor: colors.canvas },
  flex: { flex: 1 },
  top: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  content: { padding: spacing.lg, gap: spacing.lg },
}));
