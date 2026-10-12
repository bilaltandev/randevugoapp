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
import { Button, Chip, ChipRow, InlineError, TextField } from '@/components/ui';
import { isOptionalEmail, isPhone } from '@/lib/forms';
import { makeStyles, radius, spacing, useTheme } from '@/theme';

const MIN_PASSWORD = 8;

/** Sign-up in two steps like the web page: account, then business. Signs in on success. */
export default function RegisterScreen() {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  const { register } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    businessName: '',
    sector: 'BERBER',
    city: 'İstanbul',
    address: '',
    whatsappNumber: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const next = () => {
    setError(null);
    if (!form.name.trim()) return setError('Ad soyadınızı girin.');
    if (!form.email.trim() || !isOptionalEmail(form.email)) return setError('Geçerli bir e-posta adresi girin.');
    if (form.password.length < MIN_PASSWORD) return setError(`Şifre en az ${MIN_PASSWORD} karakter olmalı.`);
    if (form.phone.trim() && !isPhone(form.phone)) return setError('Telefon numarası geçerli değil.');
    setStep(2);
  };

  const submit = async () => {
    setError(null);
    if (!form.businessName.trim()) return setError('İşletme adını girin.');
    if (form.whatsappNumber.trim() && !isPhone(form.whatsappNumber)) return setError('WhatsApp numarası geçerli değil.');
    setSubmitting(true);
    try {
      // On success the guard switches to the app.
      await register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone.trim() || undefined,
        businessName: form.businessName.trim(),
        sector: form.sector,
        city: form.city.trim() || undefined,
        address: form.address.trim() || undefined,
        whatsappNumber: form.whatsappNumber.trim() || undefined,
      });
    } catch (e) {
      // The sign-up endpoint answers in Turkish (e.g. "Bu e-posta adresi ile zaten bir hesap mevcut.").
      setError(e instanceof ApiError && e.status === 400 ? e.message : loginErrorMessage(e));
      if (e instanceof ApiError && /e-posta/i.test(e.message)) setStep(1);
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
            accessibilityLabel="Geri"
            style={styles.back}>
            <Icon name={icons.chevronLeft} size={20} color={colors.ink} />
          </Pressable>
          <Text style={typography.caption}>Adım {step} / 2 · {step === 1 ? 'Hesap bilgileri' : 'İşletme bilgileri'}</Text>
        </View>
        <View style={styles.progress}>
          <View style={[styles.progressBar, styles.progressOn]} />
          <View style={[styles.progressBar, step === 2 && styles.progressOn]} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
          {step === 1 ? (
            <Animated.View key="s1" entering={FadeInRight.duration(260)} exiting={FadeOutLeft.duration(160)} style={styles.step}>
              <Text style={typography.display}>Hesabınızı oluşturun</Text>
              <Text style={typography.body}>3 gün ücretsiz deneyin. Kredi kartı gerekmez.</Text>
              <TextField label="Ad soyad" value={form.name} onChangeText={set('name')} placeholder="Ahmet Yılmaz" autoCapitalize="words" textContentType="name" />
              <TextField
                label="E-posta adresi"
                value={form.email}
                onChangeText={set('email')}
                placeholder="ornek@isletme.com"
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
              />
              <TextField
                label="Şifre"
                value={form.password}
                onChangeText={set('password')}
                placeholder="Şifre belirleyin"
                secureTextEntry
                textContentType="newPassword"
                autoComplete="new-password"
                hint={`En az ${MIN_PASSWORD} karakter.`}
              />
              <TextField label="Telefon (isteğe bağlı)" value={form.phone} onChangeText={set('phone')} placeholder="0532 000 00 00" keyboardType="phone-pad" />
              <InlineError message={error} />
              <Button label="Devam et" icon="chevronRight" onPress={next} />
            </Animated.View>
          ) : (
            <Animated.View key="s2" entering={FadeInRight.duration(260)} exiting={FadeOutLeft.duration(160)} style={styles.step}>
              <Text style={typography.display}>İşletmenizi tanıtın</Text>
              <Text style={typography.body}>Bu bilgiler online randevu sayfanızda görünür; sonradan değiştirebilirsiniz.</Text>
              <TextField label="İşletme adı" value={form.businessName} onChangeText={set('businessName')} placeholder="Örn: Ahmet Berber & Stil" />
              <Text style={typography.label}>Sektör</Text>
              <ChipRow>
                {SECTORS.map((s) => (
                  <Chip key={s.id} label={s.name} selected={form.sector === s.id} onPress={() => set('sector')(s.id)} />
                ))}
              </ChipRow>
              <TextField label="Şehir" value={form.city} onChangeText={set('city')} />
              <TextField label="WhatsApp (isteğe bağlı)" value={form.whatsappNumber} onChangeText={set('whatsappNumber')} keyboardType="phone-pad" placeholder="0532 000 00 00" />
              <TextField label="Açık adres (isteğe bağlı)" value={form.address} onChangeText={set('address')} multiline placeholder="Mahalle, cadde, no, ilçe" />
              <InlineError message={error} />
              <Button label="Hesabı oluştur" icon="check" onPress={submit} busy={submitting} />
            </Animated.View>
          )}

          <View style={styles.loginRow}>
            <Text style={typography.body}>Zaten hesabınız var mı?</Text>
            <Pressable onPress={() => router.back()} hitSlop={8} accessibilityRole="link">
              <Text style={[typography.body, { color: colors.brand, fontWeight: '700' }]}>Giriş yapın</Text>
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
