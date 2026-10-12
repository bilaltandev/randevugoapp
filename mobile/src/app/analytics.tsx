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

const PERIODS = [
  { days: 7, label: '7 gün' },
  { days: 30, label: '30 gün' },
  { days: 90, label: '3 ay' },
  { days: 365, label: '1 yıl' },
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
  if (error || !data) return <ErrorView message={error ?? 'İstatistikler yüklenemedi.'} onRetry={retry} />;

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
        <Kpi icon="money" label="Gelir" value={formatPrice(report.revenue)} change={report.revenueChange} />
        <Kpi icon="appointments" label="Randevu" value={String(report.bookings)} change={report.bookingsChange} />
        <Kpi icon="trendUp" label="Ortalama tutar" value={formatPrice(report.averageTicket)} />
        <Kpi icon="cancel" label="İptal oranı" value={`%${report.cancelRate}`} invert />
      </View>

      <Card>
        <SectionTitle hint="Onaylanan ve tamamlanan randevular">Gelir trendi</SectionTitle>
        <AreaChart data={report.series.map((s) => ({ label: s.label, value: s.revenue }))} format={shortPrice} />
      </Card>

      <Card>
        <SectionTitle hint={days > 31 ? 'Haftalık' : 'Günlük'}>Randevu sayısı</SectionTitle>
        <BarChart
          data={report.series.slice(-14).map((s) => ({ label: s.label.split(' ')[0], value: s.count }))}
          color={colors.chart2}
          format={(v) => `${v} randevu`}
        />
        {report.series.length > 14 ? <Text style={typography.caption}>Son 14 {days > 31 ? 'hafta' : 'gün'} gösteriliyor.</Text> : null}
      </Card>

      <Card>
        <SectionTitle>Randevu durumları</SectionTitle>
        <DonutChart
          centerLabel="randevu"
          data={[
            { label: 'Tamamlandı', value: report.status.COMPLETED, color: colors.brand },
            { label: 'Onaylandı', value: report.status.CONFIRMED, color: colors.chart2 },
            { label: 'Onay bekliyor', value: report.status.PENDING, color: colors.pending },
            { label: 'İptal', value: report.status.CANCELLED, color: colors.danger },
          ]}
        />
      </Card>

      <Card>
        <SectionTitle hint="Güne göre randevu sayısı">Haftalık yoğunluk</SectionTitle>
        <BarChart data={DAY_NAMES.map((name, i) => ({ label: name.slice(0, 3), value: d.byDay[i] }))} format={(v) => `${v} randevu`} />
      </Card>

      <Card>
        <SectionTitle hint="Başlangıç saatine göre">Saatlik yoğunluk</SectionTitle>
        <BarChart data={d.hours.map((h, i) => ({ label: String(h), value: d.byHour[i] }))} color={colors.chart3} format={(v) => `${v} randevu`} />
      </Card>

      <Card>
        <SectionTitle>En çok tercih edilen hizmetler</SectionTitle>
        <RankBars data={report.topServices} format={(v) => `${v}`} />
      </Card>

      <Card>
        <SectionTitle>En çok randevu alan çalışanlar</SectionTitle>
        <RankBars data={report.topEmployees} format={(v) => `${v}`} />
      </Card>

      <Card>
        <View style={styles.row}>
          <View style={styles.iconBadge}>
            <Icon name={icons.repeat} size={18} color={colors.brand} />
          </View>
          <View style={styles.flex}>
            <Text style={typography.heading}>Tekrar gelen müşteri</Text>
            <Text style={typography.caption}>{overall.customerCount} müşteri içinde (tüm zamanlar)</Text>
          </View>
          <Text style={[typography.title, { color: colors.brand }]}>%{overall.repeatRate}</Text>
        </View>
      </Card>

      <Card>
        <SectionTitle>Büyüme önerileri</SectionTitle>
        <Text style={typography.body}>
          {d.peakDay && d.peakHour
            ? `Bu dönemde en yoğun gününüz ${d.peakDay}, en yoğun başlangıç saatiniz ${d.peakHour}. Sakin saatler için kampanya düşünebilirsiniz.`
            : 'Yoğunluk analizi için bu dönemde yeterli randevu yok.'}
        </Text>
        {insights ? (
          insights.actionableTips.map((tip) => (
            <View key={tip} style={styles.tip}>
              <Icon name={icons.sparkles} size={16} color={colors.brand} />
              <Text style={[typography.body, styles.flex]}>{tip}</Text>
            </View>
          ))
        ) : (
          <Button label="Sektör önerilerini getir" icon="sparkles" variant="secondary" onPress={loadInsights} busy={ai.busy} />
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
          {change === null ? 'Önceki dönemde veri yok' : `${change > 0 ? '▲' : change < 0 ? '▼' : '•'} %${Math.abs(change)} önceki döneme göre`}
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
