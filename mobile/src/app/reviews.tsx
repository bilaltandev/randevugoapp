import { useState } from 'react';
import { Text, View } from 'react-native';

import { fetchReviews, replyToReview, type Review } from '@/api/panel';
import { EmptyState } from '@/components/EmptyState';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { Button, Card, InlineError, Page, TextField } from '@/components/ui';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { makeStyles, spacing, useTheme } from '@/theme';

export default function ReviewsScreen() {
  const { typography } = useTheme();
  const styles = useStyles();
  const { data, setData, loading, error, refreshing, refresh, retry } = useApiQuery(fetchReviews);
  const reviews = data?.reviews ?? [];
  const average = reviews.length ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;

  const onReplied = (id: string, businessReply: string) =>
    setData((d) => (d ? { ...d, reviews: d.reviews.map((r) => (r.id === id ? { ...r, businessReply, replyDate: new Date().toISOString() } : r)) } : d));

  return (
    <Page onRefresh={refresh} refreshing={refreshing}>
      {loading ? <LoadingView /> : null}
      {error ? <ErrorView message={error} onRetry={retry} /> : null}
      {data && !error ? (
        reviews.length === 0 ? (
          <EmptyState title="Henüz değerlendirme yok" description="Müşterileriniz randevu sonrası yorum bıraktığında burada görünür." />
        ) : (
          <>
            <Card>
              <Text style={typography.caption}>Ortalama puan</Text>
              <View style={styles.summary}>
                <Text style={typography.display}>{average.toFixed(1).replace('.', ',')}</Text>
                <Stars rating={Math.round(average)} size={20} />
              </View>
              <Text style={typography.caption}>{reviews.length} değerlendirme</Text>
            </Card>
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} onReplied={onReplied} />
            ))}
          </>
        )
      ) : null}
    </Page>
  );
}

function ReviewCard({ review: r, onReplied }: { review: Review; onReplied: (id: string, reply: string) => void }) {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  const [replying, setReplying] = useState(false);
  const [text, setText] = useState(r.businessReply ?? '');
  const save = useApiMutation();
  const meta = [r.appointment?.service?.name, r.employee?.name, new Date(r.createdAt).toLocaleDateString('tr-TR')].filter(Boolean).join(' · ');

  const submit = async () => {
    const reply = text.trim();
    if (!reply) return save.setError('Yanıt boş olamaz.');
    if (await save.run((client) => replyToReview(client, r.id, reply))) {
      onReplied(r.id, reply);
      setReplying(false);
    }
  };

  return (
    <Card>
      <View style={styles.header}>
        <Text style={[typography.heading, styles.flex]} numberOfLines={1}>
          {r.customerName}
        </Text>
        <Stars rating={r.rating} />
      </View>
      <Text style={typography.caption}>{meta}</Text>
      <Text style={[typography.body, { color: colors.ink }]}>{r.comment}</Text>

      {r.businessReply && !replying ? (
        <View style={styles.reply}>
          <Text style={typography.caption}>Yanıtınız</Text>
          <Text style={typography.body}>{r.businessReply}</Text>
        </View>
      ) : null}

      {replying ? (
        <>
          <TextField label="Yanıtınız" value={text} onChangeText={setText} multiline maxLength={1000} autoFocus />
          <InlineError message={save.error} />
          <View style={styles.actions}>
            <View style={styles.flex}>
              <Button label="Vazgeç" variant="secondary" onPress={() => setReplying(false)} />
            </View>
            <View style={styles.flex}>
              <Button label="Yanıtı kaydet" onPress={submit} busy={save.busy} />
            </View>
          </View>
        </>
      ) : (
        <Button label={r.businessReply ? 'Yanıtı düzenle' : 'Yanıtla'} variant="secondary" onPress={() => setReplying(true)} />
      )}
    </Card>
  );
}

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  const { colors } = useTheme();
  return (
    <Text accessibilityLabel={`5 üzerinden ${rating} yıldız`} style={{ fontSize: size, color: colors.pending, letterSpacing: 1 }}>
      {'★'.repeat(rating)}
      <Text style={{ color: colors.lineStrong }}>{'★'.repeat(Math.max(0, 5 - rating))}</Text>
    </Text>
  );
}

const useStyles = makeStyles((colors) => ({
  summary: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  reply: { gap: 2, padding: spacing.md, borderRadius: 12, backgroundColor: colors.surfaceMuted, borderLeftWidth: 3, borderLeftColor: colors.brand },
  actions: { flexDirection: 'row', gap: spacing.md },
}));
