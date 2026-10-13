import { router } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import type { Plan } from '@/api/business';
import { fetchSubscription } from '@/api/panel';
import { useAccount, useAuth } from '@/auth/AuthProvider';
import { GateFrame } from '@/components/GateFrame';
import { PlanPurchase } from '@/components/PlanPurchase';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { Button, Card } from '@/components/ui';
import { useApiQuery } from '@/hooks/useApiQuery';
import { t } from '@/i18n';
import { useTheme } from '@/theme';

/**
 * Trial or paid period over: the whole app is replaced by this screen until a plan is bought and confirmed.
 * Owners can buy here; team members can only wait for the owner.
 */
export default function LockedScreen() {
  const { isMember } = useAccount();
  return isMember ? <MemberLocked /> : <OwnerLocked />;
}

function OwnerLocked() {
  const { reloadProfile, signOut } = useAuth();
  const { data, loading, error, refreshing, refresh, retry } = useApiQuery(fetchSubscription);
  const [selected, setSelected] = useState<Plan | null>(null);

  if (loading) return <LoadingView />;
  if (error || !data) return <ErrorView message={error ?? t('Abonelik bilgisi alınamadı.')} onRetry={retry} />;

  // Pull to refresh also re-checks the account: once the admin confirms the payment the app opens again.
  const recheck = () => {
    refresh();
    reloadProfile();
  };

  return (
    <GateFrame
      title={t('Deneme süreniz veya aboneliğiniz sona erdi')}
      subtitle={t('Panel ve online randevu sayfanız bir paket satın alana kadar kapalıdır.')}
      onRefresh={recheck}
      refreshing={refreshing}>
      <PlanPurchase
        info={data}
        selected={selected ?? (data.plan === 'TEAM' ? 'TEAM' : 'PERSON')}
        onSelect={setSelected}
        onChanged={refresh}
      />
      <Button label={t('Durumu yenile')} variant="secondary" icon="refresh" onPress={recheck} />
      <Button label={t('Destek')} variant="secondary" icon="support" onPress={() => router.push('/support')} />
      <Button label={t('Çıkış yap')} variant="danger" icon="logout" onPress={signOut} />
    </GateFrame>
  );
}

function MemberLocked() {
  const { typography } = useTheme();
  const { profile, reloadProfile, signOut } = useAuth();
  return (
    <GateFrame title={t('İşletmenin aboneliği sona erdi')}>
      <Card>
        <Text style={typography.body}>
          {t('{0} için abonelik yenilenene kadar uygulama kapalıdır. Lütfen işletme sahibiyle iletişime geçin.', profile?.business.name ?? '')}
        </Text>
      </Card>
      <Button label={t('Durumu yenile')} variant="secondary" icon="refresh" onPress={reloadProfile} />
      <Button label={t('Çıkış yap')} variant="danger" icon="logout" onPress={signOut} />
    </GateFrame>
  );
}
