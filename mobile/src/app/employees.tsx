import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, Share, Text, View } from 'react-native';

import { createInviteCode, fetchInviteCodes, fetchTeam, revokeInviteCodes, sendInviteEmail, type Employee } from '@/api/business';
import { useAuth } from '@/auth/AuthProvider';
import { EmptyState } from '@/components/EmptyState';
import { icons } from '@/components/Icon';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { Button, Card, HeaderButton, InlineError, ListRow, Page, Pill, TextField } from '@/components/ui';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { makeStyles, radius, spacing, useTheme } from '@/theme';
import { localeTag, t } from '@/i18n';

/**
 * Staff list. TEAM plan: each record shows whether its member joined or an invite is open, and the owner can
 * hand out single-use sign-up codes ("Hazır ekibe katıl"), up to the member limit.
 */
export default function EmployeesScreen() {
  const styles = useStyles();
  const { typography } = useTheme();
  const { data, loading, error, refreshing, refresh, retry } = useApiQuery(fetchTeam);
  const employees = data?.employees ?? [];
  const sorted = [...employees].sort((a, b) => Number(b.isActive) - Number(a.isActive) || a.name.localeCompare(b.name, 'tr'));
  // PERSON: one person takes the bookings, so a second record needs the TEAM plan.
  const canAdd = data ? data.plan === 'TEAM' || employees.length === 0 : false;
  const members = employees.filter((e) => e.memberEmail).length;

  return (
    <Page onRefresh={refresh} refreshing={refreshing}>
      <Stack.Screen
        options={{ headerRight: canAdd ? () => <HeaderButton label={t('Ekle')} onPress={() => router.push('/employees/edit')} /> : undefined }}
      />

      {loading ? <LoadingView /> : null}
      {error ? <ErrorView message={error} onRetry={retry} /> : null}
      {data && !error ? (
        <>
          {data.plan === 'PERSON' ? (
            <Card>
              <Text style={typography.heading}>{t('Person planı: tek kişi')}</Text>
              <Text style={typography.body}>
                {t('Ekip arkadaşlarınızı davet etmek ve randevuların onlara düşmesi için Team planına geçin.')}
              </Text>
              <Button label={t('Team planına geç')} variant="secondary" onPress={() => router.push('/subscription')} />
            </Card>
          ) : (
            <InviteCodeCard members={members} limit={data.memberLimit} onCreated={refresh} />
          )}
          {sorted.length === 0 ? (
            <EmptyState title={t('Henüz çalışan yok')} description={t('Randevu alınabilmesi için en az bir çalışan ekleyin.')} />
          ) : (
            <View style={styles.list}>
              {sorted.map((e) => (
                <ListRow
                  key={e.id}
                  icon={icons.employees}
                  title={e.name}
                  subtitle={[e.specialty, e.employeeServices.length ? t('{0} hizmet', e.employeeServices.length) : t('Tüm hizmetler')].join(' · ')}
                  muted={!e.isActive}
                  right={<StatusPill employee={e} />}
                  onPress={() => router.push({ pathname: '/employees/edit', params: { id: e.id } })}
                />
              ))}
            </View>
          )}
        </>
      ) : null}
    </Page>
  );
}

function InviteCodeCard({ members, limit, onCreated }: { members: number; limit: number; onCreated: () => unknown }) {
  const { typography } = useTheme();
  const styles = useStyles();
  const { profile } = useAuth();
  const open = useApiQuery(fetchInviteCodes);
  const action = useApiMutation();
  // A fresh code is shown only here and only once; the server keeps just its hash.
  const [fresh, setFresh] = useState<{ code: string; expiresAt: string } | null>(null);
  const full = members >= limit;
  const mail = useApiMutation();
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);

  const sendMail = async () => {
    const to = email.trim();
    if (!to) return;
    setSentTo(null);
    if (await mail.run((client) => sendInviteEmail(client, to))) {
      setSentTo(to);
      setEmail('');
      open.refresh();
      onCreated();
    }
  };

  const share = (code: string) =>
    Share.share({
      message: t('{0} ekibine katılmak için CalendlyGo uygulamasında “Hazır ekibe katıl” seçeneğini kullanın. Davet kodunuz: {1}', profile?.business.name ?? '', code),
    }).catch(() => {});

  const create = async () => {
    let created: { code: string; expiresAt: string } | null = null;
    const ok = await action.run(async (client) => {
      created = await createInviteCode(client);
    });
    if (!ok || !created) return;
    setFresh(created);
    open.refresh();
    onCreated();
  };

  const revokeAll = () =>
    Alert.alert(t('Kodları iptal et'), t('Henüz kullanılmamış tüm davet kodları geçersiz olacak.'), [
      { text: t('Vazgeç'), style: 'cancel' },
      {
        text: t('İptal et'),
        style: 'destructive',
        onPress: async () => {
          if (await action.run((client) => revokeInviteCodes(client))) {
            setFresh(null);
            open.refresh();
          }
        },
      },
    ]);

  const until = (iso: string) => new Date(iso).toLocaleDateString(localeTag(), { day: 'numeric', month: 'long' });

  return (
    <Card>
      <Text style={typography.heading}>{t('Ekip üyeleri: {0} / {1}', members, limit)}</Text>
      <Text style={typography.body}>
        {t('Davet kodu oluşturup ekip arkadaşınıza gönderin. Kod tek kullanımlıktır; kayıt olurken “Hazır ekibe katıl” seçeneğine girilir.')}
      </Text>
      {fresh ? (
        <View style={styles.codeBox}>
          <Text style={[typography.display, styles.code]} selectable>
            {fresh.code}
          </Text>
          <Text style={typography.caption}>{t('{0} tarihine kadar geçerli. Bu kod bir daha gösterilmez.', until(fresh.expiresAt))}</Text>
          <Button label={t('Kodu paylaş')} icon="share" onPress={() => share(fresh.code)} />
        </View>
      ) : null}
      {full ? (
        <Text style={typography.caption}>{t('Ekip üyesi sınırına ulaştınız. Sınırı artırmak için destek ekibine yazın.')}</Text>
      ) : (
        <>
          <Button label={t('Davet kodu oluştur')} icon="add" variant={fresh ? 'secondary' : 'primary'} onPress={create} busy={action.busy} />
          <View style={styles.mailBox}>
            <TextField
              label={t('E-posta ile davet et')}
              value={email}
              onChangeText={setEmail}
              placeholder="ornek@mail.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              hint={t('Kişiye katılma bağlantısı ve tek kullanımlık kod gönderilir.')}
            />
            <Button label={t('Daveti gönder')} icon="mail" variant="secondary" onPress={sendMail} busy={mail.busy} disabled={!email.trim()} />
            {sentTo ? <Text style={typography.caption}>{t('Davet {0} adresine gönderildi.', sentTo)}</Text> : null}
            <InlineError message={mail.error} />
          </View>
        </>
      )}
      {open.data && open.data.count > 0 ? (
        <>
          <Text style={typography.caption}>{t('Kullanılmamış kod: {0}', open.data.count)}</Text>
          <Button label={t('Kodları iptal et')} variant="danger" onPress={revokeAll} disabled={action.busy} />
        </>
      ) : null}
      <InlineError message={action.error} />
    </Card>
  );
}

function StatusPill({ employee }: { employee: Employee }) {
  if (!employee.isActive) return <Pill label={t('Pasif')} />;
  if (employee.memberEmail) return <Pill label={t('Ekipte')} tone="brand" />;
  if (employee.inviteExpiresAt) return <Pill label={t('Davet gönderildi')} />;
  return null;
}

const useStyles = makeStyles((colors) => ({
  list: { gap: spacing.sm },
  codeBox: { gap: spacing.sm, alignItems: 'center', padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.brandSoft },
  code: { letterSpacing: 2 },
  mailBox: { gap: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.line },
}));
