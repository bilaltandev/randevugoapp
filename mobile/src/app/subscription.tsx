import { localeTag, t } from '@/i18n';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { changePlan, type Plan } from '@/api/business';
import { fetchSubscription } from '@/api/panel';
import { useAuth } from '@/auth/AuthProvider';
import { PLAN_INFO, PlanPurchase } from '@/components/PlanPurchase';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { Card, InlineError, Page, Pill, SectionTitle } from '@/components/ui';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { formatUsd, periodSuffix } from '@/lib/plans';
import { makeStyles, spacing, useTheme } from '@/theme';

const formatDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString(localeTag(), { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

/** Current plan and period, buying by bank transfer, and switching plans during the trial or a paid period. */
export default function SubscriptionScreen() {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  const { data, loading, error, refreshing, refresh, retry } = useApiQuery(fetchSubscription);
  const { reloadProfile } = useAuth();
  const switching = useApiMutation();
  const [selected, setSelected] = useState<Plan | null>(null);
  if (loading) return <LoadingView />;
  if (error || !data) return <ErrorView message={error ?? t('Abonelik bilgisi alınamadı.')} onRetry={retry} />;

  const plan: Plan = data.plan === 'TEAM' ? 'TEAM' : 'PERSON';
  const active = data.access ? data.access.active : !data.isExpired;
  const paid = data.access?.kind === 'paid' || data.subscription.status === 'active';
  const status = !active
    ? { label: t('Süresi doldu'), tone: 'danger' as const }
    : paid
      ? { label: t('Aktif'), tone: 'brand' as const }
      : { label: t('Ücretsiz deneme'), tone: 'muted' as const };
  const endDate = data.access?.endsAt ?? (paid ? data.subscription.subscriptionEndDate : data.subscription.trialEndDate);
  const other: Plan = plan === 'TEAM' ? 'PERSON' : 'TEAM';

  const switchTo = async (next: Plan) => {
    if (await switching.run((client) => changePlan(client, next))) {
      // The plan decides what the rest of the app shows (staff limits, invites).
      await Promise.all([refresh(), reloadProfile()]);
    }
  };

  return (
    <Page onRefresh={refresh} refreshing={refreshing}>
      <Card>
        <View style={styles.row}>
          <Text style={[typography.title, styles.flex]}>{`CalendlyGo ${PLAN_INFO[plan].name}`}</Text>
          <Pill label={status.label} tone={status.tone} />
        </View>
        <Text style={[typography.body, !active && { color: colors.danger }]}>
          {!active
            ? t('Panel ve randevu sayfanız kapalı. Devam etmek için aşağıdan bir paket satın alın.')
            : paid
              ? t('Aboneliğiniz {0} tarihine kadar aktif ({1} gün).', formatDate(endDate), data.daysRemaining)
              : t('Ücretsiz denemenizin bitmesine {0} gün kaldı. Süre bitince panel ve randevu sayfanız kapanır.', data.daysRemaining)}
        </Text>
        <Text style={typography.caption}>
          {t('Ücret: {0}', `${formatUsd(data.monthlyPrice)} ${periodSuffix(data.billingPeriod ?? 'MONTHLY')}`)}
        </Text>
      </Card>

      <SectionTitle>{t('Paketler')}</SectionTitle>
      <PlanPurchase info={data} selected={selected ?? plan} onSelect={setSelected} onChanged={refresh} />

      {active ? (
        <>
          <Pressable onPress={() => switchTo(other)} disabled={switching.busy} accessibilityRole="button" style={styles.switch} hitSlop={8}>
            <Text style={[typography.label, { color: colors.brand }]}>
              {paid
                ? t('Sonraki ödemeden itibaren {0} paketine geç', PLAN_INFO[other].name)
                : t('Denemeye {0} paketiyle devam et', PLAN_INFO[other].name)}
            </Text>
          </Pressable>
          <InlineError message={switching.error} />
        </>
      ) : null}
    </Page>
  );
}

const useStyles = makeStyles(() => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  switch: { alignItems: 'center', paddingVertical: spacing.sm },
}));
