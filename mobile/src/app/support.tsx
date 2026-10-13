import { localeTag, t } from '@/i18n';
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
      <Stack.Screen options={{ headerRight: () => <HeaderButton label={t('Yeni talep')} onPress={() => router.push('/support/new')} /> }} />

      {loading ? <LoadingView /> : null}
      {error ? <ErrorView message={error} onRetry={retry} /> : null}
      {data && !error ? (
        data.length === 0 ? (
          <>
            <EmptyState title={t('Destek talebiniz yok')} description={t('Bir sorun veya sorunuz olduğunda ekibimize buradan yazabilirsiniz.')} />
            <Button label={t('Destek talebi oluştur')} onPress={() => router.push('/support/new')} />
          </>
        ) : (
          <View style={styles.list}>
            {data.map((ticket) => (
              <ListRow
                key={ticket.id}
                icon={icons.chat}
                title={ticket.subject}
                subtitle={t(
                  '{0} · {1} mesaj · {2}',
                  TICKET_CATEGORIES.find((c) => c.id === ticket.category)?.label ?? ticket.category,
                  ticket.messageCount,
                  new Date(ticket.updatedAt).toLocaleDateString(localeTag())
                )}
                muted={ticket.status === 'CLOSED'}
                right={
                  ticket.awaitingOwner ? (
                    <Pill label={t('Yanıt geldi')} tone="brand" />
                  ) : (
                    <Pill label={TICKET_STATUSES[ticket.status] ?? ticket.status} />
                  )
                }
                onPress={() => router.push({ pathname: '/support/[id]', params: { id: ticket.id } })}
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
