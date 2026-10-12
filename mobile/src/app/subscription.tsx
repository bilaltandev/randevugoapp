import { Text, View } from 'react-native';

import { fetchSubscription } from '@/api/panel';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { Card, Page, Pill } from '@/components/ui';
import { useApiQuery } from '@/hooks/useApiQuery';
import { formatPrice } from '@/lib/appointments';
import { makeStyles, spacing, useTheme } from '@/theme';

const STATUS: Record<string, { label: string; tone: 'brand' | 'muted' | 'danger' }> = {
  trial: { label: 'Deneme süresi', tone: 'muted' },
  active: { label: 'Aktif', tone: 'brand' },
  expired: { label: 'Süresi doldu', tone: 'danger' },
  cancelled: { label: 'İptal edildi', tone: 'danger' },
};

const formatDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—');

/**
 * Subscription status only. Payments are taken on the web panel: in-app sale of the subscription would need
 * the stores' own billing, so the app shows the state and where to manage it.
 */
export default function SubscriptionScreen() {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  const { data, loading, error, refreshing, refresh, retry } = useApiQuery(fetchSubscription);
  if (loading) return <LoadingView />;
  if (error || !data) return <ErrorView message={error ?? 'Abonelik bilgisi alınamadı.'} onRetry={retry} />;

  const { subscription: sub, daysRemaining, isExpired, monthlyPrice } = data;
  const status = STATUS[sub.status] ?? { label: sub.status, tone: 'muted' as const };
  const endDate = sub.status === 'active' ? sub.subscriptionEndDate : sub.trialEndDate;

  return (
    <Page onRefresh={refresh} refreshing={refreshing}>
      <Card>
        <View style={styles.row}>
          <Text style={[typography.title, styles.flex]}>{sub.planType === 'TRIAL' ? 'Deneme' : 'RandevuGo Pro'}</Text>
          <Pill label={status.label} tone={status.tone} />
        </View>
        {isExpired ? (
          <Text style={[typography.body, { color: colors.danger }]}>
            Aboneliğinizin süresi doldu. Müşterileriniz şu an online randevu alamıyor.
          </Text>
        ) : (
          <Text style={typography.body}>
            {sub.status === 'trial' ? 'Deneme sürenizin bitmesine' : 'Dönem sonuna'} <Text style={{ color: colors.ink, fontWeight: '700' }}>{daysRemaining} gün</Text> kaldı.
          </Text>
        )}
      </Card>

      <Card>
        <Row label={sub.status === 'active' ? 'Dönem bitişi' : 'Deneme bitişi'} value={formatDate(endDate)} />
        <Row label="Aylık ücret" value={formatPrice(monthlyPrice)} />
        {sub.paymentProvider ? <Row label="Ödeme altyapısı" value={sub.paymentProvider} /> : null}
      </Card>

      <Text style={typography.caption}>Abonelik yenileme, indirim kodu ve ödeme işlemleri web panelindeki Abonelik sayfasından yapılır.</Text>
    </Page>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const { typography } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <Text style={[typography.body, styles.flex]}>{label}</Text>
      <Text style={[typography.heading]}>{value}</Text>
    </View>
  );
}

const useStyles = makeStyles(() => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
}));
