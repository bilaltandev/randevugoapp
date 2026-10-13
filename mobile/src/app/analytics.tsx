import { useState } from 'react';
import { Text, View } from 'react-native';

import { fetchAiInsights, fetchAnalyticsData, type AiInsights } from '@/api/panel';
import { useAuth } from '@/auth/AuthProvider';
import { AreaChart, BarChart, DonutChart, RankBars } from '@/components/charts';
import { Icon, icons } from '@/components/Icon';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { Button, Card, Chip, ChipRow, InlineError, Page, SectionTitle } from '@/components/ui';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { computeAnalytics, DAY_NAMES, periodReport } from '@/lib/analytics';
import { dateKey, formatPrice } from '@/lib/appointments';
import { makeStyles, radius, spacing, useTheme } from '@/theme';
import { t } from '@/i18n';

const PERIODS = [
  { days: 7, label: t('7 gün') },
  { days: 30, label: t('30 gün') },
  { days: 90, label: t('3 ay') },
  { days: 365, label: t('1 yıl') },
];

const shortPrice = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1).replace('.', ',')}B ₺` : `${Math.round(v)} ₺`);

export default function AnalyticsScreen() {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  const { profile } = useAuth();
  const { data, loading, error, refreshing, refresh, retry } = useApiQuery(fetchAnalyticsData);
  const [days, setDays] = useState(30);
  const [insights, setInsights] = useState<AiInsights | null>(null);
  const ai = useApiMutation();

  if (loading) return <LoadingView />;
  if (error || !data) return <ErrorView message={error ?? t('İstatistikler yüklenemedi.')} onRetry={retry} />;

  const report = periodReport(data.appointments, dateKey(new Date()), days);
  const overall = computeAnalytics(data.appointments, data.customers);
  const d = report.distribution;

  const loadInsights = () =>
    ai.run(async (client) => {
      if (!profile) return;
      setInsights(await fetchAiInsights(client, { name: profile.business.name, sector: profile.business.sector }));
    });

  return (
    <Page onRefresh={refresh} refreshing={refreshing}>
      <ChipRow>
        {PERIODS.map((p) => (
          <Chip key={p.days} label={p.label} selected={days === p.days} onPress={() => setDays(p.days)} />
        ))}
      </ChipRow>

      <View style={styles.grid}>
        <Kpi icon="money" label={t('Gelir')} value={formatPrice(report.revenue)} change={report.revenueChange} />
        <Kpi icon="appointments" label={t('Randevu')} value={String(report.bookings)} change={report.bookingsChange} />
        <Kpi icon="trendUp" label={t('Ortalama tutar')} value={formatPrice(report.averageTicket)} />
        <Kpi icon="cancel" label={t('İptal oranı')} value={`%${report.cancelRate}`} invert />
      </View>

      <Card>
        <SectionTitle hint={t('Onaylanan ve tamamlanan randevular')}>{t('Gelir trendi')}</SectionTitle>
        <AreaChart data={report.series.map((s) => ({ label: s.label, value: s.revenue }))} format={shortPrice} />
      </Card>

      <Card>
        <SectionTitle hint={days > 31 ? t('Haftalık') : t('Günlük')}>{t('Randevu sayısı')}</SectionTitle>
        <BarChart
          data={report.series.slice(-14).map((s) => ({ label: s.label.split(' ')[0], value: s.count }))}
          color={colors.chart2}
          format={(v) => `${v} randevu`}
        />
        {report.series.length > 14 ? <Text style={typography.caption}>{days > 31 ? t('Son 14 hafta gösteriliyor.') : t('Son 14 gün gösteriliyor.')}</Text> : null}
      </Card>

      <Card>
        <SectionTitle>{t('Randevu durumları')}</SectionTitle>
        <DonutChart
          centerLabel="randevu"
          data={[
            { label: t('Tamamlandı'), value: report.status.COMPLETED, color: colors.brand },
            { label: t('Onaylandı'), value: report.status.CONFIRMED, color: colors.chart2 },
            { label: t('Onay bekliyor'), value: report.status.PENDING, color: colors.pending },
            { label: t('İptal'), value: report.status.CANCELLED, color: colors.danger },
          ]}
        />
      </Card>

      <Card>
        <SectionTitle hint={t('Güne göre randevu sayısı')}>{t('Haftalık yoğunluk')}</SectionTitle>
        <BarChart data={DAY_NAMES.map((name, i) => ({ label: name.slice(0, 3), value: d.byDay[i] }))} format={(v) => `${v} randevu`} />
      </Card>

      <Card>
        <SectionTitle hint={t('Başlangıç saatine göre')}>{t('Saatlik yoğunluk')}</SectionTitle>
        <BarChart data={d.hours.map((h, i) => ({ label: String(h), value: d.byHour[i] }))} color={colors.chart3} format={(v) => `${v} randevu`} />
      </Card>

      <Card>
        <SectionTitle>{t('En çok tercih edilen hizmetler')}</SectionTitle>
        <RankBars data={report.topServices} format={(v) => `${v}`} />
      </Card>

      <Card>
        <SectionTitle>{t('En çok randevu alan çalışanlar')}</SectionTitle>
        <RankBars data={report.topEmployees} format={(v) => `${v}`} />
      </Card>

      <Card>
        <View style={styles.row}>
          <View style={styles.iconBadge}>
            <Icon name={icons.repeat} size={18} color={colors.brand} />
          </View>
          <View style={styles.flex}>
            <Text style={typography.heading}>{t('Tekrar gelen müşteri')}</Text>
            <Text style={typography.caption}>{t('{0} müşteri içinde (tüm zamanlar)', overall.customerCount)}</Text>
          </View>
          <Text style={[typography.title, { color: colors.brand }]}>%{overall.repeatRate}</Text>
        </View>
      </Card>

      <Card>
        <SectionTitle>{t('Büyüme önerileri')}</SectionTitle>
        <Text style={typography.body}>
          {d.peakDay && d.peakHour
            ? t('Bu dönemde en yoğun gününüz {0}, en yoğun başlangıç saatiniz {1}. Sakin saatler için kampanya düşünebilirsiniz.', d.peakDay, d.peakHour)
            : t('Yoğunluk analizi için bu dönemde yeterli randevu yok.')}
        </Text>
        {insights ? (
          insights.actionableTips.map((tip) => (
            <View key={tip} style={styles.tip}>
              <Icon name={icons.sparkles} size={16} color={colors.brand} />
              <Text style={[typography.body, styles.flex]}>{tip}</Text>
            </View>
          ))
        ) : (
          <Button label={t('Sektör önerilerini getir')} icon="sparkles" variant="secondary" onPress={loadInsights} busy={ai.busy} />
        )}
        <InlineError message={ai.error} />
      </Card>
    </Page>
  );
}

/** KPI tile with the change against the previous period (green up / red down; `invert` for "lower is better"). */
function Kpi({ icon, label, value, change, invert }: { icon: keyof typeof icons; label: string; value: string; change?: number | null; invert?: boolean }) {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  const good = change != null && (invert ? change < 0 : change > 0);
  const bad = change != null && (invert ? change > 0 : change < 0);
  return (
    <View style={styles.kpi}>
      <View style={styles.row}>
        <Icon name={icons[icon]} size={16} color={colors.ink3} />
        <Text style={typography.caption}>{label}</Text>
      </View>
      <Text style={typography.title} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {change !== undefined ? (
        <Text style={[typography.caption, { color: good ? colors.brand : bad ? colors.danger : colors.ink3, fontWeight: '600' }]}>
          {change === null ? t('Önceki dönemde veri yok') : t('{0} %{1} önceki döneme göre', change > 0 ? '▲' : change < 0 ? '▼' : '•', Math.abs(change))}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  kpi: {
    flexBasis: '47%',
    flexGrow: 1,
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  iconBadge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brandSoft },
  tip: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
}));
