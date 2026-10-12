import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { closeTicket, fetchTicket, MAX_MESSAGE_LENGTH, replyToTicket, TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES } from '@/api/panel';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { Button, InlineError, Page, Pill, TextField } from '@/components/ui';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { makeStyles, radius, spacing, useTheme } from '@/theme';

export default function TicketScreen() {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const load = useCallback((client: Parameters<typeof fetchTicket>[0]) => fetchTicket(client, id), [id]);
  const { data, loading, error, refreshing, refresh, retry } = useApiQuery(load);
  const [reply, setReply] = useState('');
  const send = useApiMutation();
  const close = useApiMutation();

  if (loading) return <LoadingView />;
  if (error || !data) return <ErrorView message={error ?? 'Talep yüklenemedi.'} onRetry={retry} />;
  const { ticket, messages } = data;
  const closed = ticket.status === 'CLOSED';

  const submit = async () => {
    if (!reply.trim()) return send.setError('Mesaj boş olamaz.');
    if (await send.run((client) => replyToTicket(client, ticket.id, reply.trim()))) {
      setReply('');
      await refresh();
    }
  };

  const confirmClose = () =>
    Alert.alert('Talebi kapat', 'Sorununuz çözüldüyse talebi kapatabilirsiniz. Yeniden yazarsanız talep tekrar açılır.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Kapat', style: 'destructive', onPress: async () => (await close.run((client) => closeTicket(client, ticket.id))) && refresh() },
    ]);

  const meta = [
    TICKET_CATEGORIES.find((c) => c.id === ticket.category)?.label,
    `Öncelik: ${TICKET_PRIORITIES.find((p) => p.id === ticket.priority)?.label ?? ticket.priority}`,
    ticket.assignedToName ? `İlgilenen: ${ticket.assignedToName}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Page onRefresh={refresh} refreshing={refreshing}>
      <Stack.Screen options={{ title: 'Destek talebi' }} />
      <View style={styles.header}>
        <Text style={[typography.title, styles.flex]}>{ticket.subject}</Text>
        <Pill label={TICKET_STATUSES[ticket.status] ?? ticket.status} tone={closed ? 'muted' : 'brand'} />
      </View>
      <Text style={typography.caption}>{meta}</Text>

      {messages.map((m) => {
        const mine = m.authorRole === 'OWNER';
        return (
          <View key={m.id} style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
            <Text style={typography.caption}>
              {mine ? 'Siz' : `${m.authorName} · Destek`} · {new Date(m.createdAt).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}
            </Text>
            <Text style={[typography.body, { color: colors.ink }]}>{m.body}</Text>
          </View>
        );
      })}

      <TextField
        label={closed ? 'Yeniden yazarak talebi açın' : 'Yanıtınız'}
        value={reply}
        onChangeText={setReply}
        multiline
        maxLength={MAX_MESSAGE_LENGTH}
      />
      <InlineError message={send.error ?? close.error} />
      <Button label="Gönder" onPress={submit} busy={send.busy} />
      {!closed ? <Button label="Talebi kapat" variant="secondary" onPress={confirmClose} busy={close.busy} /> : null}
    </Page>
  );
}

const useStyles = makeStyles((colors) => ({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  bubble: { gap: spacing.xs, padding: spacing.md, borderRadius: radius.lg, maxWidth: '90%' },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.brandSoft, borderWidth: 1, borderColor: colors.brandLine },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line },
}));
