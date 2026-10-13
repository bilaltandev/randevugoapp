import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { updateAppointmentStatus } from '@/api/appointments';
import { fetchSummary, isRestaurantSector, type DashboardSummary } from '@/api/panel';
import { useAccount, useAuth } from '@/auth/AuthProvider';
import { AppointmentCard } from '@/components/AppointmentCard';
import { AppointmentSheet } from '@/components/AppointmentSheet';
import { EmptyState } from '@/components/EmptyState';
import { AreaChart, Sparkline } from '@/components/charts';
import { Icon, icons } from '@/components/Icon';
import { BarButton, Screen } from '@/components/Screen';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { Button } from '@/components/ui';
import { useApiQuery } from '@/hooks/useApiQuery';
import { formatPrice, longDate, type Appointment, type AppointmentStatus } from '@/lib/appointments';
import { errorMessage } from '@/lib/errorMessage';
import { makeStyles, radius, spacing, useTheme } from '@/theme';
import { t } from '@/i18n';

const MONTHS = [t('Ocak'), t('Şubat'), t('Mart'), t('Nisan'), t('Mayıs'), t('Haziran'), t('Temmuz'), t('Ağustos'), t('Eylül'), t('Ekim'), t('Kasım'), t('Aralık')];

/**
 * "Özet": the same overview as the web panel's dashboard page (GET /api/dashboard/summary). A team member
 * gets it for their own bookings only, without the owner's subscription banner and shortcuts.
 */
export default function HomeScreen() {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  const { profile, client } = useAuth();
  const { isMember } = useAccount();
  const { data, loading, error, refreshing, refresh, retry } = useApiQuery(fetchSummary);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const firstName = profile?.user.name.trim().split(/\s+/)[0];
  const restaurant = isRestaurantSector(profile?.business.sector);

  const changeStatus = async (id: string, status: AppointmentStatus) => {
    if (!client) return;
    try {
      await updateAppointmentStatus(client, id, status);
    } catch (e) {
      throw new Error(errorMessage(e));
    }
    await refresh();
  };

  const quickStatus = async (a: Appointment, status: AppointmentStatus) => {
    setBusyId(a.id);
    try {
      await changeStatus(a.id, status);
    } catch (e) {
      Alert.alert(t('İşlem tamamlanamadı'), (e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const today = data ? fromKey(data.todayStr) : new Date();

  return (
    <Screen
      title={firstName ? t('Merhaba, {0}', firstName) : t('Özet')}
      subtitle={longDate(today)}
      onRefresh={refresh}
      refreshing={refreshing}
      right={<BarButton icon="add" label={t('Yeni randevu')} onPress={() => router.push({ pathname: '/appointment/new', params: data ? { date: data.todayStr } : {} })} />}>
      {loading ? <LoadingView /> : null}
      {error ? <ErrorView message={error} onRetry={retry} /> : null}

      {data ? (
        <>
          {isMember ? null : <SubscriptionBanner status={data.subscription.status} daysRemaining={data.subscription.daysRemaining} />}
          <Stats data={data} isMember={isMember} />

          <View style={styles.row}>
            <View style={styles.flex}>
              <Button label={t('Randevu ekle')} icon="add" onPress={() => router.push({ pathname: '/appointment/new', params: { date: data.todayStr } })} />
            </View>
            <View style={styles.flex}>
              <Button
                label={t('Saat kapat')}
                icon="block"
                variant="secondary"
                onPress={() => router.push({ pathname: '/appointment/new', params: { date: data.todayStr, mode: 'block' } })}
              />
            </View>
          </View>

          <View style={styles.chartCard}>
            <View style={styles.chartHead}>
              <Icon name={icons.trendUp} size={18} color={colors.brand} />
              <Text style={[typography.heading, styles.flex]}>{t('Son 7 gün')}</Text>
              <Text style={typography.caption}>{t('Tamamlanan gelir')}</Text>
            </View>
            <AreaChart
              height={150}
              data={data.last7.map((key, i) => ({ label: `${Number(key.slice(8, 10))}`, value: data.revenuePerDay[i] }))}
              format={(v) => formatPrice(v)}
            />
          </View>

          {data.pendingAppointments.length > 0 ? (
            <Section title={t('Onay bekleyenler ({0})', data.pendingCount)} icon="hourglass">
              {data.pendingAppointments.map((a) => (
                <View key={a.id} style={styles.pending}>
                  <AppointmentCard appointment={a} showDate onPress={() => setSelected(a)} />
                  <View style={styles.row}>
                    <View style={styles.flex}>
                      <Button label={t('Onayla')} icon="check" onPress={() => quickStatus(a, 'CONFIRMED')} busy={busyId === a.id} disabled={busyId !== null} />
                    </View>
                    <View style={styles.flex}>
                      <Button
                        label={t('İptal et')}
                        icon="close"
                        variant="danger"
                        disabled={busyId !== null}
                        onPress={() =>
                          Alert.alert(t('İptal et'), t('Randevu iptal edilecek.'), [
                            { text: t('Vazgeç'), style: 'cancel' },
                            { text: t('İptal et'), style: 'destructive', onPress: () => quickStatus(a, 'CANCELLED') },
                          ])
                        }
                      />
                    </View>
                  </View>
                </View>
              ))}
              {data.pendingCount > data.pendingAppointments.length ? (
                <Link label={t('Tümünü gör')} onPress={() => router.navigate('/appointments')} />
              ) : null}
            </Section>
          ) : null}

          <Section title={t('Bugünün akışı')} icon="clock">
            {data.todayAppointments.length === 0 ? (
              <EmptyState
                title={t('Bugün için randevu yok')}
                description={t('Rezervasyon bağlantınızı müşterilerinizle paylaşın ya da kendiniz randevu ekleyin.')}
              />
            ) : (
              data.todayAppointments.map((a) => <AppointmentCard key={a.id} appointment={a} onPress={() => setSelected(a)} />)
            )}
          </Section>

          <Section title={t('Yaklaşan randevular')} icon="calendar">
            {data.upcomingAppointments.length === 0 ? (
              <Text style={typography.body}>{t('Önümüzdeki günler için randevu yok.')}</Text>
            ) : (
              data.upcomingAppointments.map((a) => <AppointmentCard key={a.id} appointment={a} showDate onPress={() => setSelected(a)} />)
            )}
          </Section>

          {isMember ? null : (
            <Section title={t('Kısayollar')} icon="sparkles">
              <Shortcut icon="calendar" label={t('Takvimi aç')} href="/calendar" />
              {restaurant ? <Shortcut icon="tables" label={t('Masa planını düzenle')} href="/tables" /> : <Shortcut icon="services" label={t('Hizmetleri yönet')} href="/services" />}
              <Shortcut icon="pageBuilder" label={t('Web sitesini düzenle')} href="/page-builder" />
              <Shortcut icon="analytics" label={t('İstatistikler')} href="/analytics" />
            </Section>
          )}
        </>
      ) : null}

      <AppointmentSheet appointment={selected} onClose={() => setSelected(null)} onChangeStatus={changeStatus} />
    </Screen>
  );
}

function fromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function SubscriptionBanner({ status, daysRemaining }: { status: string; daysRemaining: number }) {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  if (status === 'active') return null;
  const expired = status === 'expired' || status === 'cancelled' || (status === 'trial' && daysRemaining <= 0);
  const text = expired
    ? t('Aboneliğinizin süresi doldu. Müşterileriniz şu an online randevu alamıyor.')
    : t('Deneme sürenizin bitmesine {0} gün kaldı.', daysRemaining);
  return (
    <Pressable
      onPress={() => router.push('/subscription')}
      accessibilityRole="button"
      style={[styles.banner, expired ? styles.bannerDanger : styles.bannerPending]}>
      <Text style={[typography.label, { color: expired ? colors.danger : colors.pending }]}>{text}</Text>
      <Text style={[typography.caption, { color: expired ? colors.danger : colors.pending }]}>{t('Abonelik ayrıntıları ›')}</Text>
    </Pressable>
  );
}

function Stats({ data, isMember }: { data: DashboardSummary; isMember: boolean }) {
  const styles = useStyles();
  const bookingsToday = data.todayAppointments.filter((a) => !a.isBlockedSlot && a.status !== 'CANCELLED');
  const pendingToday = bookingsToday.filter((a) => a.status === 'PENDING').length;
  const month = MONTHS[Number(data.todayStr.slice(5, 7)) - 1];
  const rating = data.avgRating != null ? data.avgRating.toFixed(1).replace('.', ',') : '—';

  return (
    <View style={styles.grid}>
      <Stat
        icon="appointments"
        label={t('Bugünkü randevular')}
        value={String(bookingsToday.length)}
        hint={bookingsToday.length === 0 ? t('Bugün randevu yok') : pendingToday > 0 ? t('{0} tanesi onay bekliyor', pendingToday) : t('Hepsi onaylı')}
        trend={data.bookingsPerDay}
        onPress={() => router.navigate('/calendar')}
      />
      <Stat
        icon="hourglass"
        label={t('Onay bekleyen')}
        value={String(data.pendingCount)}
        hint={data.pendingCount > 0 ? t('Bugün ve sonrası') : t('Bekleyen talep yok')}
        attention={data.pendingCount > 0}
        onPress={() => router.navigate('/appointments')}
      />
      <Stat
        icon="money"
        label={t('{0} geliri', month)}
        value={formatPrice(data.monthRevenue)}
        hint={t('{0} tamamlanan randevudan', data.completedThisMonthCount)}
        trend={data.revenuePerDay}
      />
      <Stat
        icon="reviews"
        label={t('Müşteri puanı')}
        value={rating}
        hint={data.reviewCount > 0 ? t('{0} yorum', data.reviewCount) : t('Henüz yorum yok')}
        onPress={isMember ? undefined : () => router.push('/reviews')}
      />
    </View>
  );
}

function Stat(props: {
  icon: keyof typeof icons;
  label: string;
  value: string;
  hint: string;
  trend?: number[];
  attention?: boolean;
  onPress?: () => void;
}) {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  const tint = props.attention ? colors.pending : colors.brand;
  return (
    <Pressable
      onPress={props.onPress}
      disabled={!props.onPress}
      accessibilityRole={props.onPress ? 'button' : undefined}
      style={({ pressed }) => [styles.stat, props.attention && styles.statAttention, pressed && styles.pressed]}>
      <View style={styles.statHead}>
        <View style={[styles.statIcon, { backgroundColor: props.attention ? colors.pendingSoft : colors.brandSoft }]}>
          <Icon name={icons[props.icon]} size={16} color={tint} />
        </View>
        {props.trend ? <Sparkline values={props.trend} color={tint} width={64} height={24} /> : null}
      </View>
      <Text style={[typography.title, props.attention && { color: colors.pending }]} numberOfLines={1} adjustsFontSizeToFit>
        {props.value}
      </Text>
      <Text style={typography.label} numberOfLines={1}>
        {props.label}
      </Text>
      <Text style={typography.caption} numberOfLines={2}>
        {props.hint}
      </Text>
    </Pressable>
  );
}

function Section({ title, icon, children }: { title: string; icon: keyof typeof icons; children: React.ReactNode }) {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Icon name={icons[icon]} size={18} color={colors.brand} />
        <Text style={typography.heading}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Shortcut({ icon, label, href }: { icon: keyof typeof icons; label: string; href: Href }) {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  return (
    <Pressable onPress={() => router.navigate(href)} accessibilityRole="button" style={({ pressed }) => [styles.shortcut, pressed && styles.pressed]}>
      <View style={styles.statIcon}>
        <Icon name={icons[icon]} size={16} color={colors.brand} />
      </View>
      <Text style={[typography.body, { color: colors.ink, flex: 1 }]}>{label}</Text>
      <Icon name={icons.chevronRight} size={16} color={colors.ink3} />
    </Pressable>
  );
}

function Link({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors, typography } = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" hitSlop={8}>
      <Text style={[typography.label, { color: colors.brand }]}>{label}</Text>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  row: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  stat: {
    flexBasis: '47%',
    flexGrow: 1,
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  statAttention: { borderColor: colors.pending },
  statHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  statIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brandSoft },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  chartCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  chartHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  pressed: { opacity: 0.8 },
  section: { gap: spacing.md },
  pending: { gap: spacing.sm },
  banner: { gap: spacing.xs, padding: spacing.md, borderRadius: radius.md, borderWidth: 1 },
  bannerPending: { borderColor: colors.pending, backgroundColor: colors.pendingSoft },
  bannerDanger: { borderColor: colors.danger, backgroundColor: colors.dangerSoft },
  shortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
}));
