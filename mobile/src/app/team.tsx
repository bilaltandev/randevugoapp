import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { fetchTeamRoster } from '@/api/business';
import { absoluteUrl } from '@/api/panel';
import { EmptyState } from '@/components/EmptyState';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { Card, ListGroup, Page, Pill, SectionTitle } from '@/components/ui';
import { useApiQuery } from '@/hooks/useApiQuery';
import { accentColors, makeStyles, spacing, useTheme, type Accent } from '@/theme';
import { t } from '@/i18n';

const AVATAR_COLORS: Accent[] = ['blue', 'violet', 'amber', 'brand'];

/** "Ekip" for team members: who runs the team and who works in it. Read-only. */
export default function TeamScreen() {
  const { typography } = useTheme();
  const styles = useStyles();
  const { data, loading, error, refreshing, refresh, retry } = useApiQuery(fetchTeamRoster);

  return (
    <Page onRefresh={refresh} refreshing={refreshing}>
      {loading ? <LoadingView /> : null}
      {error ? <ErrorView message={error} onRetry={retry} /> : null}
      {data && !error ? (
        <>
          <SectionTitle hint={data.businessName}>{t('Ekip yöneticisi')}</SectionTitle>
          <Card>
            <View style={styles.row}>
              <PersonAvatar name={data.manager.name} photo={data.manager.photo} size={56} accent="brand" />
              <View style={styles.flex}>
                <Text style={typography.heading} numberOfLines={1}>
                  {data.manager.name}
                </Text>
                {data.manager.specialty ? (
                  <Text style={typography.body} numberOfLines={1}>
                    {data.manager.specialty}
                  </Text>
                ) : null}
              </View>
              <Pill label={t('Yönetici')} tone="brand" />
            </View>
          </Card>

          <SectionTitle hint={t('Ekip üyeleri: {0}', data.members.length)}>{t('Ekip')}</SectionTitle>
          {data.members.length === 0 ? (
            <EmptyState icon="employees" title={t('Henüz başka ekip üyesi yok')} description={t('Yöneticiniz yeni kişiler eklediğinde burada görünür.')} />
          ) : (
            <ListGroup>
              {data.members.map((m, i) => (
                <View key={m.id} style={styles.member}>
                  <PersonAvatar name={m.name} photo={m.photo} size={44} accent={AVATAR_COLORS[i % AVATAR_COLORS.length]} />
                  <View style={styles.flex}>
                    <Text style={typography.heading} numberOfLines={1}>
                      {m.name}
                    </Text>
                    <Text style={typography.body} numberOfLines={1}>
                      {m.specialty}
                    </Text>
                  </View>
                  {m.isMe ? <Pill label={t('Siz')} tone="brand" /> : null}
                </View>
              ))}
            </ListGroup>
          )}
        </>
      ) : null}
    </Page>
  );
}

function PersonAvatar({ name, photo, size, accent }: { name: string; photo: string | null; size: number; accent: Accent }) {
  const { colors } = useTheme();
  const { fg, soft } = accentColors(colors, accent);
  const url = absoluteUrl(photo);
  const round = { width: size, height: size, borderRadius: size / 2 };
  if (url) return <Image source={{ uri: url }} style={round} contentFit="cover" alt="" />;
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toLocaleUpperCase('tr-TR'))
    .join('');
  return (
    <View style={[round, { alignItems: 'center', justifyContent: 'center', backgroundColor: soft }]}>
      <Text style={{ color: fg, fontSize: size * 0.36, fontWeight: '800' }}>{initials || '?'}</Text>
    </View>
  );
}

const useStyles = makeStyles(() => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  member: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  flex: { flex: 1, gap: 2 },
}));
