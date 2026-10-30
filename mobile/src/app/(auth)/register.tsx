import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/api/authClient';
import { SECTORS } from '@/api/panel';
import { useAuth } from '@/auth/AuthProvider';
import { loginErrorMessage } from '@/auth/messages';
import { Icon, icons } from '@/components/Icon';
import { PasswordRules } from '@/components/PasswordRules';
import { PrivacyConsent } from '@/components/PrivacyConsent';
import { Button, Chip, ChipRow, InlineError, TextField } from '@/components/ui';
import { isOptionalEmail, isPhone } from '@/lib/forms';
import { WEAK_PASSWORD, isStrongPassword } from '@/lib/password';
import { businessSlug } from '@/lib/slug';
import { makeStyles, radius, spacing, useTheme } from '@/theme';
import { t } from '@/i18n';

/**
 * Sign-up in two steps like the web page: account, then business. Or "Hazır ekibe katıl": one step with the
 * invite code the business owner gave, which creates a team member account. Signs in on success.
 */
export default function RegisterScreen() {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  const { register, joinTeam } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [mode, setMode] = useState<'business' | 'join'>('business');
  const [code, setCode] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    businessName: '',
    sector: 'BERBER',
    city: '',
    district: '',
    address: '',
    whatsappNumber: '',
  });
  const [noticeAccepted, setNoticeAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));
  const noticeError = t('Devam etmek için aydınlatma metnini okuduğunuzu onaylayın.');

  const next = () => {
    setError(null);
    if (!form.name.trim()) return setError(t('Ad soyadınızı girin.'));
    if (!form.email.trim() || !isOptionalEmail(form.email)) return setError(t('Geçerli bir e-posta adresi girin.'));
    if (!isStrongPassword(form.password)) return setError(t(WEAK_PASSWORD));
    if (!isPhone(form.phone)) return setError(t('Telefon numarası geçerli değil.'));
    if (!noticeAccepted) return setError(noticeError);
    setStep(2);
  };

  const submitJoin = async () => {
    setError(null);
    if (code.replace(/[\s-]/g, '').length < 6) return setError(t('İşletme sahibinin verdiği davet kodunu girin.'));
    if (!form.name.trim()) return setError(t('Ad soyadınızı girin.'));
    if (!form.email.trim() || !isOptionalEmail(form.email)) return setError(t('Geçerli bir e-posta adresi girin.'));
    if (!isStrongPassword(form.password)) return setError(t(WEAK_PASSWORD));
    if (!isPhone(form.phone)) return setError(t('Telefon numarası geçerli değil.'));
    if (!noticeAccepted) return setError(noticeError);
    setSubmitting(true);
    try {
      // On success the guard switches to the app (member view).
      await joinTeam({
        code: code.trim(),
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone.trim(),
        privacyNoticeAccepted: noticeAccepted,
      });
    } catch (e) {
      setError(e instanceof ApiError && e.status !== 429 && e.status < 500 ? t(e.message) : loginErrorMessage(e));
      setSubmitting(false);
    }
  };

  const joining = mode === 'join';

  const submit = async () => {
    setError(null);
    if (!form.businessName.trim()) return setError(t('İşletme adını girin.'));
    if (!form.city.trim() || !form.district.trim() || !form.address.trim()) return setError(t('Lütfen şehir, ilçe ve açık adresi giriniz.'));
    if (form.whatsappNumber.trim() && !isPhone(form.whatsappNumber)) return setError(t('WhatsApp numarası geçerli değil.'));
    setSubmitting(true);
    try {
      // On success the guard switches to the app.
      await register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone.trim(),
        businessName: form.businessName.trim(),
        sector: form.sector,
        city: form.city.trim(),
        district: form.district.trim(),
        address: form.address.trim(),
        whatsappNumber: form.whatsappNumber.trim() || undefined,
        privacyNoticeAccepted: noticeAccepted,
      });
    } catch (e) {
      // The sign-up endpoint answers in Turkish (e.g. "Bu e-posta adresi ile zaten bir hesap mevcut.").
      setError(e instanceof ApiError && e.status === 400 ? t(e.message) : loginErrorMessage(e));
      // E-mail and phone are on the first step; a taken business name stays here on the second.
      if (e instanceof ApiError && /e-posta|telefon/i.test(e.message)) setStep(1);
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.top}>
          <Pressable
            onPress={() => (step === 2 ? setStep(1) : router.back())}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t('Geri')}
            style={styles.back}>
            <Icon name={icons.chevronLeft} size={20} color={colors.ink} />
          </Pressable>
          <Text style={typography.caption}>
            {joining ? t('Hazır ekibe katıl') : t('Adım {0} / 2 · {1}', step, step === 1 ? t('Hesap bilgileri') : t('İşletme bilgileri'))}
          </Text>
        </View>
        {joining ? null : (
          <View style={styles.progress}>
            <View style={[styles.progressBar, styles.progressOn]} />
            <View style={[styles.progressBar, step === 2 && styles.progressOn]} />
          </View>
        )}

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
          {step === 1 ? (
            <Animated.View key="s1" entering={FadeInRight.duration(260)} exiting={FadeOutLeft.duration(160)} style={styles.step}>
              <ChipRow>
                <Chip label={t('Yeni işletme')} selected={!joining} onPress={() => { setMode('business'); setError(null); }} />
                <Chip label={t('Hazır ekibe katıl')} selected={joining} onPress={() => { setMode('join'); setError(null); }} />
              </ChipRow>
              <Text style={typography.display}>{joining ? t('Ekibe katılın') : t('Hesabınızı oluşturun')}</Text>
              <Text style={typography.body}>
                {joining
                  ? t('İşletme sahibinin size verdiği davet kodunu girin. Size alınan randevuları uygulamada görürsünüz.')
                  : t('3 gün ücretsiz deneyin. Kredi kartı gerekmez.')}
              </Text>
              {joining ? (
                <TextField
                  label={t('Davet kodu')}
                  value={code}
                  onChangeText={(v) => setCode(v.toUpperCase())}
                  placeholder="K7M2-QXAB"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={12}
                />
              ) : null}
              <TextField label={t('Ad soyad')} value={form.name} onChangeText={set('name')} placeholder={t('Ahmet Yılmaz')} autoCapitalize="words" textContentType="name" />
              <TextField
                label={t('E-posta adresi')}
                value={form.email}
                onChangeText={set('email')}
                placeholder="ornek@isletme.com"
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
              />
              <TextField
                label={t('Şifre')}
                value={form.password}
                onChangeText={set('password')}
                placeholder={t('Şifre belirleyin')}
                secureTextEntry
                textContentType="newPassword"
                autoComplete="new-password"
              />
              <PasswordRules password={form.password} />
              <TextField label={t('Telefon')} value={form.phone} onChangeText={set('phone')} placeholder={t('0532 000 00 00')} keyboardType="phone-pad" />
              <PrivacyConsent checked={noticeAccepted} onChange={setNoticeAccepted} />
              <InlineError message={error} />
              {joining ? (
                <Button label={t('Ekibe katıl')} icon="check" onPress={submitJoin} busy={submitting} />
              ) : (
                <Button label={t('Devam et')} icon="chevronRight" onPress={next} />
              )}
            </Animated.View>
          ) : (
            <Animated.View key="s2" entering={FadeInRight.duration(260)} exiting={FadeOutLeft.duration(160)} style={styles.step}>
              <Text style={typography.display}>{t('İşletmenizi tanıtın')}</Text>
              <Text style={typography.body}>{t('Bu bilgiler online randevu sayfanızda görünür; sonradan değiştirebilirsiniz.')}</Text>
              <TextField
                label={t('İşletme adı')}
                value={form.businessName}
                onChangeText={set('businessName')}
                placeholder={t('Örn: Ahmet Berber & Stil')}
                hint={t('Randevu adresiniz: {0}', `calendlygo.com/${form.businessName.trim() ? businessSlug(form.businessName) : t('isletmeniz')}`)}
              />
              <Text style={typography.label}>{t('Sektör')}</Text>
              <ChipRow>
                {SECTORS.map((s) => (
                  <Chip key={s.id} label={s.name} selected={form.sector === s.id} onPress={() => set('sector')(s.id)} />
                ))}
              </ChipRow>
              <TextField label={t('Şehir')} value={form.city} onChangeText={set('city')} placeholder={t('Örn: Adana')} />
              <TextField label={t('İlçe')} value={form.district} onChangeText={set('district')} placeholder={t('Örn: Seyhan')} />
              <TextField label={t('WhatsApp (isteğe bağlı)')} value={form.whatsappNumber} onChangeText={set('whatsappNumber')} keyboardType="phone-pad" placeholder={t('0532 000 00 00')} />
              <TextField label={t('Açık adres')} value={form.address} onChangeText={set('address')} multiline placeholder={t('Mahalle, cadde, no, ilçe')} />
              <InlineError message={error} />
              <Button label={t('Hesabı oluştur')} icon="check" onPress={submit} busy={submitting} />
            </Animated.View>
          )}

          <View style={styles.loginRow}>
            <Text style={typography.body}>{t('Zaten hesabınız var mı?')}</Text>
            <Pressable onPress={() => router.back()} hitSlop={8} accessibilityRole="link">
              <Text style={[typography.body, { color: colors.brand, fontWeight: '700' }]}>{t('Giriş yapın')}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((colors) => ({
  safe: { flex: 1, backgroundColor: colors.canvas },
  flex: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  progress: { flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  progressBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.line },
  progressOn: { backgroundColor: colors.brand },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.xl },
  step: { gap: spacing.lg },
  loginRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.xs },
}));
