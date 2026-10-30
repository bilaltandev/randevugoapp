import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View, type TextInputInstance } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import wordmarkDark from '../../../assets/images/wordmark-dark.png';
import wordmarkLight from '../../../assets/images/wordmark-light.png';

import { useAuth } from '@/auth/AuthProvider';
import { loginErrorMessage } from '@/auth/messages';
import { AppMark } from '@/components/AppMark';
import { Icon, icons } from '@/components/Icon';
import { makeStyles, radius, spacing, useTheme } from '@/theme';
import { t } from '@/i18n';

const CONFIG_MISSING = t('Uygulamanın sunucu adresi yapılandırılmamış (EXPO_PUBLIC_API_URL).');
const FORGOT_PASSWORD_URL = 'https://www.calendlygo.com/sifremi-unuttum';

export default function LoginScreen() {
  const { colors, typography, scheme } = useTheme();
  const styles = useStyles();
  const { signIn, client, notice, clearNotice } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(client ? null : CONFIG_MISSING);
  const passwordRef = useRef<TextInputInstance>(null);

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
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInDown.duration(420)} style={styles.brand}>
            <AppMark size={96} style={styles.mark} />
            <Image
              source={scheme === 'dark' ? wordmarkDark : wordmarkLight}
              style={styles.wordmark}
              contentFit="contain"
              accessibilityRole="header"
              alt="CalendlyGo"
            />
            <Text style={typography.body}>{t('İşletme paneline giriş yapın')}</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(120).duration(420)} style={styles.form}>
            {message ? (
              <View style={[styles.alert, error ? styles.alertError : styles.alertNotice]} accessibilityRole="alert">
                <Text style={[typography.label, { color: error ? colors.danger : colors.pending }]}>{message}</Text>
              </View>
            ) : null}

            <View style={styles.field}>
              <Text style={typography.label}>E-posta</Text>
              <View style={styles.inputRow}>
                <Icon name={icons.mail} size={18} color={colors.ink3} />
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
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  editable={!submitting}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={typography.label}>{t('Şifre')}</Text>
              <View style={styles.inputRow}>
                <Icon name={icons.lock} size={18} color={colors.ink3} />
                <TextInput
                  ref={passwordRef}
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t('Şifreniz')}
                  placeholderTextColor={colors.ink3}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="current-password"
                  textContentType="password"
                  returnKeyType="go"
                  onSubmitEditing={handleSubmit}
                  editable={!submitting}
                />
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? t('Şifreyi gizle') : t('Şifreyi göster')}>
                  <Icon name={showPassword ? icons.eyeSlash : icons.eye} size={18} color={colors.ink3} />
                </Pressable>
              </View>
              <Pressable
                onPress={() => WebBrowser.openBrowserAsync(FORGOT_PASSWORD_URL)}
                hitSlop={8}
                accessibilityRole="link"
                disabled={submitting}
                style={styles.forgot}>
                <Text style={[typography.label, { color: colors.brand }]}>{t('Şifremi unuttum')}</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canSubmit, busy: submitting }}
              style={({ pressed }) => [styles.button, !canSubmit && styles.buttonDisabled, pressed && styles.pressed]}>
              {submitting ? <ActivityIndicator color={colors.onBrand} /> : <Text style={styles.buttonText}>{t('Giriş yap')}</Text>}
            </Pressable>

            <View style={styles.registerRow}>
              <Text style={typography.body}>{t('Hesabınız yok mu?')}</Text>
              <Pressable onPress={() => router.push('/register')} hitSlop={8} accessibilityRole="link" disabled={submitting}>
                <Text style={[typography.body, { color: colors.brand, fontWeight: '700' }]}>{t('Ücretsiz hesap oluşturun')}</Text>
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((colors, typography) => ({
  safe: { flex: 1, backgroundColor: colors.canvas },
  flex: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.xxl },
  brand: { alignItems: 'center', gap: spacing.sm },
  mark: { marginBottom: spacing.sm },
  wordmark: { width: 220, aspectRatio: 900 / 172 },
  form: { gap: spacing.lg },
  alert: { padding: spacing.md, borderRadius: radius.md, borderWidth: 1 },
  alertError: { borderColor: colors.danger, backgroundColor: colors.dangerSoft },
  alertNotice: { borderColor: colors.pending, backgroundColor: colors.pendingSoft },
  field: { gap: spacing.xs },
  forgot: { alignSelf: 'flex-end', paddingTop: spacing.xs },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 52,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  input: { ...typography.body, flex: 1, height: '100%', color: colors.ink },
  button: { height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.brand, marginTop: spacing.sm },
  buttonDisabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  buttonText: { ...typography.heading, color: colors.onBrand },
  registerRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.xs },
}));
