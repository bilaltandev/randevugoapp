import { router, Stack } from 'expo-router';
import { View } from 'react-native';

import { fetchServices } from '@/api/business';
import { EmptyState } from '@/components/EmptyState';
import { icons } from '@/components/Icon';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { HeaderButton, ListRow, Page, Pill } from '@/components/ui';
import { useApiQuery } from '@/hooks/useApiQuery';
import { formatPrice } from '@/lib/appointments';
import { makeStyles, spacing } from '@/theme';

export default function ServicesScreen() {
  const styles = useStyles();
  const { data, loading, error, refreshing, refresh, retry } = useApiQuery(fetchServices);
  // Active first, then by name.
  const sorted = [...(data ?? [])].sort((a, b) => Number(b.isActive) - Number(a.isActive) || a.name.localeCompare(b.name, 'tr'));

  return (
    <Page onRefresh={refresh} refreshing={refreshing}>
      <Stack.Screen options={{ headerRight: () => <HeaderButton label="Ekle" onPress={() => router.push('/services/edit')} /> }} />

      {loading ? <LoadingView /> : null}
      {error ? <ErrorView message={error} onRetry={retry} /> : null}
      {data && !error ? (
        sorted.length === 0 ? (
          <EmptyState title="Henüz hizmet yok" description="Sağ üstteki “Ekle” ile ilk hizmetinizi oluşturun." />
        ) : (
          <View style={styles.list}>
            {sorted.map((s) => (
              <ListRow
                key={s.id}
                icon={icons.services}
                title={s.name}
                subtitle={`${s.durationMinutes} dk${s.employeeServices.length ? ` · ${s.employeeServices.map((es) => es.employee.name).join(', ')}` : ''}`}
                meta={formatPrice(s.price)}
                muted={!s.isActive}
                right={!s.isActive ? <Pill label="Pasif" /> : undefined}
                onPress={() => router.push({ pathname: '/services/edit', params: { id: s.id } })}
              />
            ))}
          </View>
        )
      ) : null}
    </Page>
  );
}

const useStyles = makeStyles(() => ({
  list: { gap: spacing.sm },
}));
