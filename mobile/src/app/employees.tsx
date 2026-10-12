import { router, Stack } from 'expo-router';
import { View } from 'react-native';

import { fetchEmployees } from '@/api/business';
import { EmptyState } from '@/components/EmptyState';
import { icons } from '@/components/Icon';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { HeaderButton, ListRow, Page, Pill } from '@/components/ui';
import { useApiQuery } from '@/hooks/useApiQuery';
import { makeStyles, spacing } from '@/theme';

export default function EmployeesScreen() {
  const styles = useStyles();
  const { data, loading, error, refreshing, refresh, retry } = useApiQuery(fetchEmployees);
  const sorted = [...(data ?? [])].sort((a, b) => Number(b.isActive) - Number(a.isActive) || a.name.localeCompare(b.name, 'tr'));

  return (
    <Page onRefresh={refresh} refreshing={refreshing}>
      <Stack.Screen options={{ headerRight: () => <HeaderButton label="Ekle" onPress={() => router.push('/employees/edit')} /> }} />

      {loading ? <LoadingView /> : null}
      {error ? <ErrorView message={error} onRetry={retry} /> : null}
      {data && !error ? (
        sorted.length === 0 ? (
          <EmptyState title="Henüz çalışan yok" description="Randevu alınabilmesi için en az bir çalışan ekleyin." />
        ) : (
          <View style={styles.list}>
            {sorted.map((e) => (
              <ListRow
                key={e.id}
                icon={icons.employees}
                title={e.name}
                subtitle={[e.specialty, e.employeeServices.length ? `${e.employeeServices.length} hizmet` : 'Tüm hizmetler'].join(' · ')}
                muted={!e.isActive}
                right={!e.isActive ? <Pill label="Pasif" /> : undefined}
                onPress={() => router.push({ pathname: '/employees/edit', params: { id: e.id } })}
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
