import { router, type Href } from 'expo-router';
import { useId, useState, type ReactNode } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';

import { updateAppointmentStatus } from '@/api/appointments';
import { fetchSummary, isRestaurantSector, type DashboardSummary } from '@/api/panel';
import { useAccount, useAuth } from '@/auth/AuthProvider';
import { AppointmentCard } from '@/components/AppointmentCard';
import { AppointmentSheet } from '@/components/AppointmentSheet';
import { EmptyState } from '@/components/EmptyState';
import { AreaChart, Sparkline } from '@/components/charts';
import { Icon, icons } from '@/components/Icon';
import { BarButton, Screen } from '@/components/Screen';
import { statusTones } from '@/components/StatusBadge';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { useApiQuery } from '@/hooks/useApiQuery';
import { formatPrice, longDate, statusMeta, type Appointment, type AppointmentStatus } from '@/lib/appointments';
import { errorMessage } from '@/lib/errorMessage';
import { accentColors, elevation, makeStyles, radius, spacing, useTheme, type Accent } from '@/theme';
import { t } from '@/i18n';

const MONTHS = [t('Ocak'), t('Şubat'), t('Mart'), t('Nisan'), t('Mayıs'), t('Haziran'), t('Temmuz'), t('Ağustos'), t('Eylül'), t('Ekim'), t('Kasım'), t('Aralık')];

/**
 * "Özet": the same overview as the web panel's dashboard page (GET /api/dashboard/summary). A team member
 * gets it for their own bookings only, without the owner's subscription banner and shortcuts.
 */
export default function HomeScreen() {
  const { colors } = useTheme();
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
  const newBooking = (mode?: 'block') =>
    router.push({ pathname: '/appointment/new', params: { ...(data ? { date: data.todayStr } : {}), ...(mode ? { mode } : {}) } });

  return (
    <Screen
      title={firstName ? t('Merhaba, {0}', firstName) : t('Özet')}
      subtitle={longDate(today)}
      onRefresh={refresh}
      refreshing={refreshing}
      right={<BarButton icon="add" label={t('Yeni randevu')} primary onPress={() => newBooking()} />}>
      {loading ? <LoadingView /> : null}
      {error ? <ErrorView message={error} onRetry={retry} /> : null}

      {data ? (
        <>
          {isMember ? null : <SubscriptionBanner status={data.subscription.status} daysRemaining={data.subscription.daysRemaining} />}
          <TodayHero data={data} />

          <View style={styles.actions}>
            <Action icon="add" accent="brand" label={t('Randevu ekle')} onPress={() => newBooking()} />
            <Action icon="block" accent="amber" label={t('Saat kapat')} onPress={() => newBooking('block')} />
            <Action icon="calendar" accent="blue" label={t('Takvim')} onPress={() => router.navigate('/calendar')} />
            {isMember ? null : <Action icon="analytics" accent="violet" label={t('İstatistikler')} onPress={() => router.push('/analytics')} />}
          </View>

          <Stats data={data} isMember={isMember} />

          <View style={styles.chartCard}>
            <View style={styles.chartHead}>
              <View style={[styles.tile, { backgroundColor: colors.brandSoft }]}>
                <Icon name={icons.trendUp} size={16} color={colors.brand} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.cardTitle}>{t('Son 7 gün')}</Text>
                <Text style={styles.caption}>{t('Tamamlanan gelir')}</Text>
              </View>
              <Text style={styles.cardTitle}>{formatPrice(data.revenuePerDay.reduce((s, v) => s + v, 0))}</Text>
            </View>
            <AreaChart
              height={150}
              data={data.last7.map((key, i) => ({ label: `${Number(key.slice(8, 10))}`, value: data.revenuePerDay[i] }))}
              format={(v) => formatPrice(v)}
            />
          </View>

          {data.pendingAppointments.length > 0 ? (
            <Section title={t('Onay bekleyenler ({0})', data.pendingCount)} icon="hourglass" accent="amber">
              {data.pendingAppointments.map((a) => (
                <View key={a.id} style={styles.pending}>
                  <AppointmentCard appointment={a} showDate onPress={() => setSelected(a)} />
                  <View style={styles.row}>
                    <SmallButton
                      label={t('Onayla')}
                      icon="check"
                      tone="brand"
                      busy={busyId === a.id}
                      disabled={busyId !== null}
                      onPress={() => quickStatus(a, 'CONFIRMED')}
                    />
                    <SmallButton
                      label={t('İptal et')}
                      icon="close"
                      tone="danger"
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
              ))}
              {data.pendingCount > data.pendingAppointments.length ? (
                <Link label={t('Tümünü gör')} onPress={() => router.navigate('/appointments')} />
              ) : null}
            </Section>
          ) : null}

          <Section title={t('Bugünün akışı')} icon="clock" accent="brand">
            {data.todayAppointments.length === 0 ? (
              <EmptyState
                icon="calendar"
                title={t('Bugün için randevu yok')}
                description={t('Rezervasyon bağlantınızı müşterilerinizle paylaşın ya da kendiniz randevu ekleyin.')}
              />
            ) : (
              <View>
                {data.todayAppointments.map((a, i) => (
                  <TimelineItem key={a.id} appointment={a} last={i === data.todayAppointments.length - 1}>
                    <AppointmentCard appointment={a} onPress={() => setSelected(a)} />
                  </TimelineItem>
                ))}
              </View>
            )}
          </Section>

          <Section title={t('Yaklaşan randevular')} icon="calendar" accent="blue">
            {data.upcomingAppointments.length === 0 ? (
              <Text style={styles.body}>{t('Önümüzdeki günler için randevu yok.')}</Text>
            ) : (
              data.upcomingAppointments.map((a) => <AppointmentCard key={a.id} appointment={a} showDate onPress={() => setSelected(a)} />)
            )}
          </Section>

          {isMember ? null : (
            <Section title={t('Kısayollar')} icon="sparkles" accent="violet">
              <View style={styles.shortcuts}>
                <Shortcut icon="calendar" accent="brand" label={t('Takvimi aç')} href="/calendar" />
                {restaurant ? (
                  <Shortcut icon="tables" accent="amber" label={t('Masa planını düzenle')} href="/tables" />
                ) : (
                  <Shortcut icon="services" accent="amber" label={t('Hizmetleri yönet')} href="/services" />
                )}
                <Shortcut icon="pageBuilder" accent="violet" label={t('Web sitesini düzenle')} href="/page-builder" />
                <Shortcut icon="analytics" accent="blue" label={t('İstatistikler')} href="/analytics" />
              </View>
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

/** Today at a glance on a brand-colored card: bookings, how many wait for approval, and a done ring. */
function TodayHero({ data }: { data: DashboardSummary }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const bookings = data.todayAppointments.filter((a) => !a.isBlockedSlot && a.status !== 'CANCELLED');
  const pending = bookings.filter((a) => a.status === 'PENDING').length;
  const done = bookings.filter((a) => a.status === 'COMPLETED').length;
  const share = bookings.length ? done / bookings.length : 0;
  const hint = bookings.length === 0 ? t('Bugün randevu yok') : pending > 0 ? t('{0} tanesi onay bekliyor', pending) : t('Hepsi onaylı');

  const R = 34;
  const C = 2 * Math.PI * R;
  return (
    <Animated.View entering={FadeInDown.duration(420)} style={styles.hero}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <LinearGradient id={`bg${id}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.brand} />
            <Stop offset="1" stopColor={colors.brandInk} />
          </LinearGradient>
          <RadialGradient id={`hi${id}`} cx="95%" cy="0%" rx="70%" ry="90%">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.28} />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
          </RadialGradient>
          <Pattern id={`dots${id}`} width={16} height={16} patternUnits="userSpaceOnUse">
            <Circle cx={1.5} cy={1.5} r={1} fill="#FFFFFF" fillOpacity={0.12} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#bg${id})`} />
        <Rect width="100%" height="100%" fill={`url(#dots${id})`} />
        <Rect width="100%" height="100%" fill={`url(#hi${id})`} />
      </Svg>
      <View style={styles.flex}>
        <Text style={[styles.heroLabel, { color: colors.onBrand }]}>{t('Bugünkü randevular')}</Text>
        <Text style={[styles.heroNumber, { color: colors.onBrand }]}>{bookings.length}</Text>
        <View style={styles.heroHint}>
          <Icon name={pending > 0 ? icons.hourglass : icons.checkCircle} size={13} color={colors.onBrand} />
          <Text style={[styles.heroHintText, { color: colors.onBrand }]} numberOfLines={1}>
            {hint}
          </Text>
        </View>
      </View>
      <View style={styles.ring}>
        <Svg width={84} height={84}>
          <Circle cx={42} cy={42} r={R} stroke={colors.onBrand} strokeOpacity={0.2} strokeWidth={8} fill="none" />
          <Circle
            cx={42}
            cy={42}
            r={R}
            stroke={colors.onBrand}
            strokeWidth={8}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${C * share} ${C}`}
            transform="rotate(-90 42 42)"
          />
        </Svg>
        <View style={styles.ringCenter}>
          <Text style={[styles.ringValue, { color: colors.onBrand }]}>
            {done}/{bookings.length}
          </Text>
        </View>
        <Text style={[styles.ringLabel, { color: colors.onBrand }]} numberOfLines={1}>
          {t('Tamamlandı')}
        </Text>
      </View>
    </Animated.View>
  );
}

function Action({ icon, accent, label, onPress }: { icon: keyof typeof icons; accent: Accent; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { fg, soft } = accentColors(colors, accent);
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
      <View style={[styles.actionIcon, { backgroundColor: soft, borderColor: fg }]}>
        <Icon name={icons[icon]} size={20} color={fg} />
      </View>
      <Text style={styles.actionLabel} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function SubscriptionBanner({ status, daysRemaining }: { status: string; daysRemaining: number }) {
  const { colors } = useTheme();
  const styles = useStyles();
  if (status === 'active') return null;
  const expired = status === 'expired' || status === 'cancelled' || (status === 'trial' && daysRemaining <= 0);
  const tint = expired ? colors.danger : colors.pending;
  const text = expired
    ? t('Aboneliğinizin süresi doldu. Müşterileriniz şu an online randevu alamıyor.')
    : t('Deneme sürenizin bitmesine {0} gün kaldı.', daysRemaining);
  return (
    <Pressable
      onPress={() => router.push('/subscription')}
      accessibilityRole="button"
      style={({ pressed }) => [styles.banner, { borderColor: tint, backgroundColor: expired ? colors.dangerSoft : colors.pendingSoft }, pressed && styles.pressed]}>
      <View style={[styles.tile, { backgroundColor: tint }]}>
        <Icon name={expired ? icons.lock : icons.hourglass} size={16} color={colors.surface} />
      </View>
      <View style={styles.flex}>
        <Text style={[styles.bannerText, { color: tint }]}>{text}</Text>
        <Text style={[styles.caption, { color: tint }]}>{t('Abonelik ayrıntıları ›')}</Text>
      </View>
    </Pressable>
  );
}

function Stats({ data, isMember }: { data: DashboardSummary; isMember: boolean }) {
  const styles = useStyles();
  const month = MONTHS[Number(data.todayStr.slice(5, 7)) - 1];
  const rating = data.avgRating != null ? data.avgRating.toFixed(1).replace('.', ',') : '—';
  const week = data.bookingsPerDay.reduce((s, v) => s + v, 0);

  return (
    <View style={styles.grid}>
      <Stat
        icon="hourglass"
        accent="amber"
        label={t('Onay bekleyen')}
        value={String(data.pendingCount)}
        hint={data.pendingCount > 0 ? t('Bugün ve sonrası') : t('Bekleyen talep yok')}
        onPress={() => router.navigate('/appointments')}
      />
      <Stat
        icon="money"
        accent="blue"
        label={t('{0} geliri', month)}
        value={formatPrice(data.monthRevenue)}
        hint={t('{0} tamamlanan randevudan', data.completedThisMonthCount)}
        trend={data.revenuePerDay}
      />
      <Stat
        icon="appointments"
        accent="brand"
        label={t('Son 7 gün')}
        value={String(week)}
        hint={t('Randevular')}
        trend={data.bookingsPerDay}
        onPress={() => router.navigate('/calendar')}
      />
      <Stat
        icon="reviews"
        accent="violet"
        label={t('Müşteri puanı')}
        value={rating}
        hint={data.reviewCount > 0 ? t('{0} yorum', data.reviewCount) : t('Henüz yorum yok')}
        onPress={isMember ? undefined : () => router.push('/reviews')}
      />
    </View>
  );
}

function Stat(props: { icon: keyof typeof icons; accent: Accent; label: string; value: string; hint: string; trend?: number[]; onPress?: () => void }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { fg, soft } = accentColors(colors, props.accent);
  return (
    <Pressable
      onPress={props.onPress}
      disabled={!props.onPress}
      accessibilityRole={props.onPress ? 'button' : undefined}
      style={({ pressed }) => [styles.stat, pressed && styles.pressed]}>
      <View style={[styles.statGlow, { backgroundColor: soft }]} />
      <View style={styles.statHead}>
        <View style={[styles.tile, { backgroundColor: soft }]}>
          <Icon name={icons[props.icon]} size={16} color={fg} />
        </View>
        {props.trend ? <Sparkline values={props.trend} color={fg} width={60} height={24} /> : null}
      </View>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {props.value}
      </Text>
      <Text style={styles.statLabel} numberOfLines={1}>
        {props.label}
      </Text>
      <Text style={styles.caption} numberOfLines={2}>
        {props.hint}
      </Text>
    </Pressable>
  );
}

function Section({ title, icon, accent, children }: { title: string; icon: keyof typeof icons; accent: Accent; children: ReactNode }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { fg, soft } = accentColors(colors, accent);
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <View style={[styles.tileSmall, { backgroundColor: soft }]}>
          <Icon name={icons[icon]} size={14} color={fg} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

/** Today's bookings on a vertical line, each with a dot in its status color. */
function TimelineItem({ appointment, last, children }: { appointment: Appointment; last: boolean; children: ReactNode }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const tone = statusTones(colors)[statusMeta(appointment).tone];
  return (
    <View style={styles.timelineRow}>
      <View style={styles.rail}>
        <View style={[styles.railDot, { borderColor: tone.fg }]} />
        {last ? null : <View style={styles.railLine} />}
      </View>
      <View style={[styles.flex, !last && styles.timelineGap]}>{children}</View>
    </View>
  );
}

function SmallButton(props: { label: string; icon: keyof typeof icons; tone: 'brand' | 'danger'; onPress: () => void; busy?: boolean; disabled?: boolean }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const fg = props.tone === 'brand' ? colors.onBrand : colors.danger;
  return (
    <Pressable
      onPress={props.onPress}
      disabled={props.disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.smallButton,
        props.tone === 'brand' ? { backgroundColor: colors.brand } : { backgroundColor: colors.dangerSoft, borderWidth: 1, borderColor: colors.danger },
        pressed && styles.pressed,
        props.disabled && !props.busy && styles.disabled,
      ]}>
      <Icon name={icons[props.busy ? 'hourglass' : props.icon]} size={15} color={fg} />
      <Text style={[styles.smallButtonText, { color: fg }]}>{props.label}</Text>
    </Pressable>
  );
}

function Shortcut({ icon, accent, label, href }: { icon: keyof typeof icons; accent: Accent; label: string; href: Href }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { fg, soft } = accentColors(colors, accent);
  return (
    <Pressable onPress={() => router.navigate(href)} accessibilityRole="button" style={({ pressed }) => [styles.shortcut, pressed && styles.pressed]}>
      <View style={styles.shortcutHead}>
        <View style={[styles.tile, { backgroundColor: soft }]}>
          <Icon name={icons[icon]} size={16} color={fg} />
        </View>
        <Icon name={icons.open} size={14} color={colors.ink3} />
      </View>
      <Text style={styles.shortcutLabel} numberOfLines={2}>
        {label}
      </Text>
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

const useStyles = makeStyles((colors, typography) => ({
  row: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.45 },
  body: typography.body,
  caption: typography.caption,
  cardTitle: { ...typography.heading, fontWeight: '700' },
  tile: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  tileSmall: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.brand,
    shadowColor: colors.brand,
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  heroLabel: { fontSize: 13, fontWeight: '700', opacity: 0.85 },
  heroNumber: { fontSize: 56, lineHeight: 62, fontWeight: '800', letterSpacing: -2 },
  heroHint: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: 'rgba(255, 255, 255, 0.16)' },
  heroHintText: { fontSize: 12, fontWeight: '700' },
  ring: { alignItems: 'center', gap: spacing.xs },
  ringCenter: { position: 'absolute', top: 0, width: 84, height: 84, alignItems: 'center', justifyContent: 'center' },
  ringValue: { fontSize: 17, fontWeight: '800' },
  ringLabel: { fontSize: 11, fontWeight: '700', opacity: 0.85, maxWidth: 90 },

  actions: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  action: { flex: 1, alignItems: 'center', gap: spacing.sm },
  actionIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    ...elevation(colors),
  },
  actionLabel: { ...typography.caption, color: colors.ink2, fontWeight: '600', textAlign: 'center' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  stat: {
    flexBasis: '47%',
    flexGrow: 1,
    gap: 2,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...elevation(colors),
  },
  statGlow: { position: 'absolute', top: -40, end: -40, width: 110, height: 110, borderRadius: 55, opacity: 0.8 },
  statHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  statValue: { ...typography.title, fontSize: 24, lineHeight: 30, fontWeight: '800', letterSpacing: -0.6 },
  statLabel: { ...typography.label, color: colors.ink },

  chartCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    ...elevation(colors),
  },
  chartHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },

  section: { gap: spacing.md },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionTitle: { ...typography.heading, fontWeight: '700', fontSize: 18 },
  pending: { gap: spacing.sm },
  smallButton: { flex: 1, height: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: radius.pill },
  smallButtonText: { fontSize: 14, fontWeight: '700' },

  timelineRow: { flexDirection: 'row', gap: spacing.md },
  timelineGap: { paddingBottom: spacing.md },
  rail: { width: 14, alignItems: 'center', paddingTop: spacing.xl },
  railDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 3, backgroundColor: colors.canvas },
  railLine: { flex: 1, width: 2, marginTop: 4, borderRadius: 1, backgroundColor: colors.line },

  banner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1 },
  bannerText: { ...typography.label },

  shortcuts: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  shortcut: {
    flexBasis: '47%',
    flexGrow: 1,
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    ...elevation(colors),
  },
  shortcutHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  shortcutLabel: { ...typography.label, color: colors.ink, fontSize: 14 },
}));
