import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { fetchMemberContext, uploadMemberPhoto } from '@/api/business';
import { absoluteUrl, fetchSubscription, SECTORS } from '@/api/panel';
import { useAccount, useAuth } from '@/auth/AuthProvider';
import { Icon, icons } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { Button, Card, InlineError, ListRow, Pill, SectionTitle } from '@/components/ui';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { pickImage } from '@/lib/pickImage';
import { formatUsd, periodSuffix } from '@/lib/plans';
import { makeStyles, radius, spacing, useTheme, type ThemePreference } from '@/theme';
import { getLanguagePreference, LANGUAGES, t, tc } from '@/i18n';

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: keyof typeof icons }[] = [
  { value: 'system', label: t('Sistem'), icon: 'auto' },
  { value: 'light', label: tc('tema', 'Açık'), icon: 'sun' },
  { value: 'dark', label: t('Koyu'), icon: 'moon' },
];

const SUB_STATUS: Record<string, { label: string; tone: 'brand' | 'muted' | 'danger' }> = {
  trial: { label: t('Deneme'), tone: 'muted' },
  active: { label: t('Aktif'), tone: 'brand' },
  expired: { label: t('Süresi doldu'), tone: 'danger' },
  cancelled: { label: t('İptal edildi'), tone: 'danger' },
};

export default function ProfileScreen() {
  const { colors, typography, preference, setPreference } = useTheme();
  const styles = useStyles();
  const { profile, signOut } = useAuth();
  const { isMember } = useAccount();
  // Team members have no subscription of their own (and no access to it).
  const sub = useApiQuery(isMember ? noSubscription : fetchSubscription);
  // A member's photo is their staff photo, which customers see on the booking page.
  const own = useApiQuery(isMember ? fetchMemberContext : noMemberContext);
  const photoUpload = useApiMutation();
  const [photo, setPhoto] = useState<string | null>(null);
  const photoUrl = absoluteUrl(photo ?? own.data?.employee.photo);

  const changePhoto = async () => {
    let image;
    try {
      image = await pickImage({ aspect: [1, 1] });
    } catch (e) {
      return Alert.alert(t('Fotoğraf'), (e as Error).message);
    }
    if (!image) return;
    const picked = image;
    await photoUpload.run(async (client) => setPhoto(await uploadMemberPhoto(client, picked)));
  };

  const name = profile?.user.name ?? '';
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toLocaleUpperCase('tr-TR'))
    .join('');
  const languagePref = getLanguagePreference();
  const languageLabel = languagePref === 'system' ? t('Telefonun dili') : LANGUAGES.find((l) => l.code === languagePref)?.name;
  const sector = SECTORS.find((s) => s.id === profile?.business.sector)?.name;

  const confirmSignOut = () =>
    Alert.alert(t('Çıkış yap'), t('Bu cihazdaki oturumunuz kapatılacak.'), [
      { text: t('Vazgeç'), style: 'cancel' },
      { text: t('Çıkış yap'), style: 'destructive', onPress: () => signOut() },
    ]);

  return (
    <Screen title={t('Profil')} onRefresh={sub.refresh} refreshing={sub.refreshing}>
      <Card>
        <View style={styles.identity}>
          {isMember && photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.avatar} contentFit="cover" alt="" />
          ) : (
            <View style={styles.avatar}>
              <Text style={[typography.title, { color: colors.onBrand }]}>{initials || '?'}</Text>
            </View>
          )}
          <View style={styles.flex}>
            <Text style={typography.title} numberOfLines={1}>
              {name}
            </Text>
            <Text style={typography.body} numberOfLines={1}>
              {profile?.user.email}
            </Text>
            <Text style={typography.caption} numberOfLines={1}>
              {profile?.business.name}
              {isMember ? ` · ${t('Ekip üyesi')}` : sector ? ` · ${sector}` : ''}
            </Text>
          </View>
        </View>
        {isMember ? (
          <>
            <Button label={t('Profil fotoğrafını değiştir')} icon="image" variant="secondary" onPress={changePhoto} busy={photoUpload.busy} />
            <InlineError message={photoUpload.error} />
          </>
        ) : null}
      </Card>

      {isMember ? null : (
        <View style={styles.section}>
          <SectionTitle>{t('Abonelik')}</SectionTitle>
          <Pressable onPress={() => router.push('/subscription')} accessibilityRole="button" style={({ pressed }) => pressed && styles.pressed}>
            <SubscriptionCard data={sub.data} loading={sub.loading} error={sub.error} />
          </Pressable>
        </View>
      )}

      <View style={styles.section}>
        <SectionTitle>{t('Hesap')}</SectionTitle>
        <ListRow icon={icons.edit} title={t('Profili düzenle')} subtitle={t('Ad, e-posta ve telefon')} onPress={() => router.push('/profile/edit')} />
        <ListRow icon={icons.key} title={t('Şifre değiştir')} subtitle={t('Diğer cihazlardaki oturumlar kapanır')} onPress={() => router.push('/profile/password')} />
      </View>

      <View style={styles.section}>
        <SectionTitle>{t('Görünüm')}</SectionTitle>
        <View style={styles.segment} accessibilityRole="radiogroup">
          {THEME_OPTIONS.map((o) => {
            const active = preference === o.value;
            return (
              <Pressable
                key={o.value}
                onPress={() => setPreference(o.value)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                style={[styles.segmentItem, active && styles.segmentActive]}>
                <Icon name={icons[o.icon]} size={18} color={active ? colors.onBrand : colors.ink2} />
                <Text style={[typography.label, { color: active ? colors.onBrand : colors.ink2 }]}>{o.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={typography.caption}>{t('“Sistem”, telefonunuzun açık/koyu ayarını takip eder.')}</Text>
        <ListRow icon={icons.globe} title={t('Dil')} subtitle={languageLabel} onPress={() => router.push('/profile/language')} />
      </View>

      {isMember ? null : (
        <View style={styles.section}>
          <SectionTitle>{t('İşletme')}</SectionTitle>
          <ListRow icon={icons.settings} title={t('İşletme ayarları')} subtitle={t('Bilgiler, logo ve çalışma saatleri')} onPress={() => router.push('/settings')} />
          <ListRow icon={icons.pageBuilder} title={t('Web sitesi düzenleyici')} subtitle={t('Tema, içerik ve bölümler')} onPress={() => router.push('/page-builder')} />
          <ListRow icon={icons.support} title={t('Destek')} subtitle={t('Ekibimize yazın')} onPress={() => router.push('/support')} />
        </View>
      )}

      <Pressable onPress={confirmSignOut} accessibilityRole="button" style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}>
        <Icon name={icons.logout} size={20} color={colors.danger} />
        <Text style={[typography.heading, { color: colors.danger }]}>{t('Çıkış yap')}</Text>
      </Pressable>
      <Text style={[typography.caption, styles.center]}>{t('CalendlyGo')} {Constants.expoConfig?.version ?? ''} {t('· by VASTLAB')}</Text>
    </Screen>
  );
}

const noSubscription = async () => null;
const noMemberContext = async () => null;

function SubscriptionCard({
  data,
  loading,
  error,
}: {
  data: Awaited<ReturnType<typeof fetchSubscription>> | null;
  loading: boolean;
  error: string | null;
}) {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  if (loading || !data) {
    return (
      <Card>
        <Text style={typography.body}>{error ?? t('Abonelik bilgisi yükleniyor…')}</Text>
      </Card>
    );
  }
  const { subscription: s, daysRemaining, isExpired, monthlyPrice } = data;
  const period = data.billingPeriod ?? 'MONTHLY';
  const status = SUB_STATUS[s.status] ?? { label: s.status, tone: 'muted' as const };
  // Trial bar: 3-day trial on sign-up; active period: a month or a year.
  const total = s.status === 'trial' ? 3 : period === 'YEARLY' ? 365 : 30;
  const fill = isExpired ? 0 : Math.max(0.04, Math.min(1, daysRemaining / total));

  return (
    <Card>
      <View style={styles.subHeader}>
        <View style={styles.subIcon}>
          <Icon name={icons.subscription} size={20} color={colors.brand} />
        </View>
        <View style={styles.flex}>
          <Text style={typography.heading}>
            {s.planType === 'TRIAL' ? t('Deneme paketi') : `CalendlyGo ${data.plan === 'TEAM' ? 'Team' : 'Person'}`}
          </Text>
          <Text style={typography.caption}>{`${formatUsd(monthlyPrice)} ${periodSuffix(period)}`}</Text>
        </View>
        <Pill label={status.label} tone={status.tone} />
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${fill * 100}%`, backgroundColor: isExpired ? colors.danger : colors.brand }]} />
      </View>
      <View style={styles.subFooter}>
        <Text style={[typography.label, isExpired && { color: colors.danger }]}>
          {isExpired ? t('Süre doldu — online randevu kapalı') : t('{0} gün kaldı', daysRemaining)}
        </Text>
        <Icon name={icons.chevronRight} size={16} color={colors.ink3} />
      </View>
    </Card>
  );
}

const useStyles = makeStyles((colors) => ({
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  avatar: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brand },
  flex: { flex: 1, gap: 2 },
  section: { gap: spacing.sm },
  pressed: { opacity: 0.8 },
  segment: { flexDirection: 'row', padding: 4, gap: 4, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  segmentItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.sm, borderRadius: radius.sm },
  segmentActive: { backgroundColor: colors.brand },
  signOut: {
    height: 52,
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
  },
  center: { textAlign: 'center' },
  subHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  subIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brandSoft },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  subFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
}));
