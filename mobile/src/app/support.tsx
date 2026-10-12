import { router, Stack } from 'expo-router';
import { View } from 'react-native';

import { fetchTickets, TICKET_CATEGORIES, TICKET_STATUSES } from '@/api/panel';
import { EmptyState } from '@/components/EmptyState';
import { icons } from '@/components/Icon';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { Button, HeaderButton, ListRow, Page, Pill } from '@/components/ui';
import { useApiQuery } from '@/hooks/useApiQuery';
import { makeStyles, spacing } from '@/theme';

export default function SupportScreen() {
  const styles = useStyles();
  const { data, loading, error, refreshing, refresh, retry } = useApiQuery(fetchTickets);

  return (
    <Page onRefresh={refresh} refreshing={refreshing}>
      <Stack.Screen options={{ headerRight: () => <HeaderButton label="Yeni talep" onPress={() => router.push('/support/new')} /> }} />

      {loading ? <LoadingView /> : null}
      {error ? <ErrorView message={error} onRetry={retry} /> : null}
      {data && !error ? (
        data.length === 0 ? (
          <>
            <EmptyState title="Destek talebiniz yok" description="Bir sorun veya sorunuz olduğunda ekibimize buradan yazabilirsiniz." />
            <Button label="Destek talebi oluştur" onPress={() => router.push('/support/new')} />
          </>
        ) : (
          <View style={styles.list}>
            {data.map((t) => (
              <ListRow
                key={t.id}
                icon={icons.chat}
                title={t.subject}
                subtitle={`${TICKET_CATEGORIES.find((c) => c.id === t.category)?.label ?? t.category} · ${t.messageCount} mesaj · ${new Date(t.updatedAt).toLocaleDateString('tr-TR')}`}
                muted={t.status === 'CLOSED'}
                right={
                  t.awaitingOwner ? <Pill label="Yanıt geldi" tone="brand" /> : <Pill label={TICKET_STATUSES[t.status] ?? t.status} />
                }
                onPress={() => router.push({ pathname: '/support/[id]', params: { id: t.id } })}
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
