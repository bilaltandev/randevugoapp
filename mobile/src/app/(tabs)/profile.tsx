import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Alert, Pressable, Text, View } from 'react-native';

import { fetchSubscription, SECTORS } from '@/api/panel';
import { useAuth } from '@/auth/AuthProvider';
import { Icon, icons } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { Card, ListRow, Pill, SectionTitle } from '@/components/ui';
import { useApiQuery } from '@/hooks/useApiQuery';
import { formatPrice } from '@/lib/appointments';
import { makeStyles, radius, spacing, useTheme, type ThemePreference } from '@/theme';

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: keyof typeof icons }[] = [
  { value: 'system', label: 'Sistem', icon: 'auto' },
  { value: 'light', label: 'Açık', icon: 'sun' },
  { value: 'dark', label: 'Koyu', icon: 'moon' },
];

const SUB_STATUS: Record<string, { label: string; tone: 'brand' | 'muted' | 'danger' }> = {
  trial: { label: 'Deneme', tone: 'muted' },
  active: { label: 'Aktif', tone: 'brand' },
  expired: { label: 'Süresi doldu', tone: 'danger' },
  cancelled: { label: 'İptal edildi', tone: 'danger' },
};

export default function ProfileScreen() {
  const { colors, typography, preference, setPreference } = useTheme();
  const styles = useStyles();
  const { profile, signOut } = useAuth();
  const sub = useApiQuery(fetchSubscription);

  const name = profile?.user.name ?? '';
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toLocaleUpperCase('tr-TR'))
    .join('');
  const sector = SECTORS.find((s) => s.id === profile?.business.sector)?.name;

  const confirmSignOut = () =>
    Alert.alert('Çıkış yap', 'Bu cihazdaki oturumunuz kapatılacak.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Çıkış yap', style: 'destructive', onPress: () => signOut() },
    ]);

  return (
    <Screen title="Profil" onRefresh={sub.refresh} refreshing={sub.refreshing}>
      <Card>
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={[typography.title, { color: colors.onBrand }]}>{initials || '?'}</Text>
          </View>
          <View style={styles.flex}>
            <Text style={typography.title} numberOfLines={1}>
              {name}
            </Text>
            <Text style={typography.body} numberOfLines={1}>
              {profile?.user.email}
            </Text>
            <Text style={typography.caption} numberOfLines={1}>
              {profile?.business.name}
              {sector ? ` · ${sector}` : ''}
            </Text>
          </View>
        </View>
      </Card>

      <View style={styles.section}>
        <SectionTitle>Abonelik</SectionTitle>
        <Pressable onPress={() => router.push('/subscription')} accessibilityRole="button" style={({ pressed }) => pressed && styles.pressed}>
          <SubscriptionCard data={sub.data} loading={sub.loading} error={sub.error} />
        </Pressable>
      </View>

      <View style={styles.section}>
        <SectionTitle>Hesap</SectionTitle>
        <ListRow icon={icons.edit} title="Profili düzenle" subtitle="Ad, e-posta ve telefon" onPress={() => router.push('/profile/edit')} />
        <ListRow icon={icons.key} title="Şifre değiştir" subtitle="Diğer cihazlardaki oturumlar kapanır" onPress={() => router.push('/profile/password')} />
      </View>

      <View style={styles.section}>
        <SectionTitle>Görünüm</SectionTitle>
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
        <Text style={typography.caption}>“Sistem”, telefonunuzun açık/koyu ayarını takip eder.</Text>
      </View>

      <View style={styles.section}>
        <SectionTitle>İşletme</SectionTitle>
        <ListRow icon={icons.settings} title="İşletme ayarları" subtitle="Bilgiler, logo ve çalışma saatleri" onPress={() => router.push('/settings')} />
        <ListRow icon={icons.pageBuilder} title="Web sitesi düzenleyici" subtitle="Tema, içerik ve bölümler" onPress={() => router.push('/page-builder')} />
        <ListRow icon={icons.support} title="Destek" subtitle="Ekibimize yazın" onPress={() => router.push('/support')} />
      </View>

      <Pressable onPress={confirmSignOut} accessibilityRole="button" style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}>
        <Icon name={icons.logout} size={20} color={colors.danger} />
        <Text style={[typography.heading, { color: colors.danger }]}>Çıkış yap</Text>
      </Pressable>
      <Text style={[typography.caption, styles.center]}>RandevuGo {Constants.expoConfig?.version ?? ''} · by VASTLAB</Text>
    </Screen>
  );
}

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
        <Text style={typography.body}>{error ?? 'Abonelik bilgisi yükleniyor…'}</Text>
      </Card>
    );
  }
  const { subscription: s, daysRemaining, isExpired, monthlyPrice } = data;
  const status = SUB_STATUS[s.status] ?? { label: s.status, tone: 'muted' as const };
  // Trial bar: 3-day trial on sign-up; active period: 30 days.
  const total = s.status === 'trial' ? 3 : 30;
  const fill = isExpired ? 0 : Math.max(0.04, Math.min(1, daysRemaining / total));

  return (
    <Card>
      <View style={styles.subHeader}>
        <View style={styles.subIcon}>
          <Icon name={icons.subscription} size={20} color={colors.brand} />
        </View>
        <View style={styles.flex}>
          <Text style={typography.heading}>{s.planType === 'TRIAL' ? 'Deneme paketi' : 'RandevuGo Pro'}</Text>
          <Text style={typography.caption}>{formatPrice(monthlyPrice)} / ay</Text>
        </View>
        <Pill label={status.label} tone={status.tone} />
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${fill * 100}%`, backgroundColor: isExpired ? colors.danger : colors.brand }]} />
      </View>
      <View style={styles.subFooter}>
        <Text style={[typography.label, isExpired && { color: colors.danger }]}>
          {isExpired ? 'Süre doldu — online randevu kapalı' : `${daysRemaining} gün kaldı`}
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
