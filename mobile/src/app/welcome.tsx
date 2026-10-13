import { useState } from 'react';
import { Pressable, Text } from 'react-native';

import { changePlan, type Plan } from '@/api/business';
import { fetchSubscription } from '@/api/panel';
import { useAuth } from '@/auth/AuthProvider';
import { GateFrame } from '@/components/GateFrame';
import { PLAN_INFO, PlanPurchase } from '@/components/PlanPurchase';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { InlineError } from '@/components/ui';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { t } from '@/i18n';
import { makeStyles, spacing, useTheme } from '@/theme';

/** Right after a new business signs up: the plans first, "3 gün ücretsiz deneyin" under them. */
export default function WelcomeScreen() {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  const { finishWelcome, reloadProfile } = useAuth();
  const { data, loading, error, refresh, retry } = useApiQuery(fetchSubscription);
  const [selected, setSelected] = useState<Plan | null>(null);
  const start = useApiMutation();

  if (loading) return <LoadingView />;
  if (error || !data) return <ErrorView message={error ?? t('Abonelik bilgisi alınamadı.')} onRetry={retry} />;

  const current: Plan = data.plan === 'TEAM' ? 'TEAM' : 'PERSON';
  const chosen = selected ?? current;

  const startTrial = async () => {
    if (chosen !== current && !(await start.run((client) => changePlan(client, chosen)))) return;
    await reloadProfile();
    finishWelcome();
  };

  return (
    <GateFrame title={t('Paketinizi seçin')} subtitle={t('Kaydınız tamamlandı. Hemen satın alabilir ya da önce 3 gün ücretsiz deneyebilirsiniz.')}>
      <PlanPurchase info={data} selected={chosen} onSelect={setSelected} onChanged={refresh} />
      <Pressable onPress={startTrial} disabled={start.busy} accessibilityRole="button" style={styles.trial} hitSlop={8}>
        <Text style={[typography.heading, { color: colors.brand }]}>{t('3 gün ücretsiz deneyin →')}</Text>
        <Text style={[typography.caption, styles.center]}>
          {t('{0} paketiyle başlar. Kart bilgisi gerekmez; süre bitince panel kapanır.', PLAN_INFO[chosen].name)}
        </Text>
      </Pressable>
      <InlineError message={start.error} />
    </GateFrame>
  );
}

const useStyles = makeStyles(() => ({
  trial: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.sm },
  center: { textAlign: 'center' },
}));
