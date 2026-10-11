import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { loginErrorMessage } from '@/auth/messages';
import { colors, radius, spacing, typography } from '@/theme';

const CONFIG_MISSING = 'Uygulamanın sunucu adresi yapılandırılmamış (EXPO_PUBLIC_API_URL).';

export default function LoginScreen() {
  const { signIn, client, notice, clearNotice } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(client ? null : CONFIG_MISSING);
  const passwordRef = useRef<TextInput>(null);

  const canSubmit = !!client && !submitting && email.trim().length > 0 && password.length > 0;

  // On success the protected-route guard switches to the tabs; nothing to navigate here.
  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    clearNotice();
    try {
      await signIn(email.trim(), password);
    } catch (e) {
      setError(loginErrorMessage(e));
      setPassword('');
      setSubmitting(false);
    }
  };

  const message = error ?? notice;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.container}>
          <View style={styles.brand}>
            <Text style={styles.logo}>
              Randevu<Text style={styles.logoAccent}>Go</Text>
            </Text>
            <Text style={typography.body}>İşletme paneline giriş yapın</Text>
          </View>

          <View style={styles.form}>
            {message ? (
              <View style={[styles.alert, error ? styles.alertError : styles.alertNotice]} accessibilityRole="alert">
                <Text style={[typography.label, { color: error ? colors.danger : colors.pending }]}>{message}</Text>
              </View>
            ) : null}

            <View style={styles.field}>
              <Text style={typography.label}>E-posta</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="ornek@isletme.com"
                placeholderTextColor={colors.ink3}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                returnKeyType="next"
                editable={!submitting}
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>

            <View style={styles.field}>
              <Text style={typography.label}>Şifre</Text>
              <TextInput
                ref={passwordRef}
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.ink3}
                secureTextEntry
                autoComplete="password"
                textContentType="password"
                returnKeyType="go"
                editable={!submitting}
                onSubmitEditing={handleSubmit}
              />
            </View>

            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canSubmit, busy: submitting }}
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, !canSubmit && styles.buttonDisabled]}>
              {submitting ? (
                <ActivityIndicator color={colors.onBrand} />
              ) : (
                <Text style={styles.buttonText}>Giriş yap</Text>
              )}
            </Pressable>
          </View>

          <Text style={[typography.caption, styles.footer]}>by VASTLAB</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  flex: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.xxl },
  brand: { gap: spacing.sm },
  logo: { ...typography.display, fontSize: 34, lineHeight: 40 },
  logoAccent: { color: colors.brand },
  form: { gap: spacing.lg },
  field: { gap: spacing.sm },
  alert: { padding: spacing.md, borderRadius: radius.md, borderWidth: 1 },
  alertError: { backgroundColor: colors.dangerSoft, borderColor: colors.danger },
  alertNotice: { backgroundColor: colors.pendingSoft, borderColor: colors.pending },
  input: {
    ...typography.body,
    color: colors.ink,
    height: 50,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  button: {
    height: 52,
    marginTop: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.brand,
  },
  buttonPressed: { backgroundColor: colors.brandHover },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { ...typography.heading, color: colors.onBrand },
  footer: { textAlign: 'center' },
});
