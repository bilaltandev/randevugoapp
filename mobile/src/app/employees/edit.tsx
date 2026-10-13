import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import { Alert, Share, Text } from 'react-native';

import {
  createEmployee,
  createInvite,
  deleteEmployee,
  fetchServices,
  fetchTeam,
  removeMember,
  revokeInvite,
  updateEmployee,
  type Employee,
  type Service,
} from '@/api/business';
import { absoluteUrl } from '@/api/panel';
import { useAuth } from '@/auth/AuthProvider';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { Button, Card, Chip, ChipRow, InlineError, Page, SectionTitle, SwitchRow, TextField } from '@/components/ui';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { isOptionalEmail } from '@/lib/forms';
import { useTheme } from '@/theme';
import { localeTag, t } from '@/i18n';

/** Create (no id) or edit an employee. TEAM plan: invite the person behind the record, or remove them. */
export default function EmployeeEditScreen() {
  const { typography } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const load = useCallback(
    async (client: Parameters<typeof fetchTeam>[0]) => {
      const [team, services] = await Promise.all([fetchTeam(client), fetchServices(client)]);
      return { employee: team.employees.find((e) => e.id === id) ?? null, services, plan: team.plan };
    },
    [id]
  );
  const query = useApiQuery(load);

  if (query.loading) return <LoadingView />;
  if (query.error || !query.data) return <ErrorView message={query.error ?? t('Yüklenemedi.')} onRetry={query.retry} />;
  if (id && !query.data.employee) {
    return (
      <Page>
        <Text style={typography.body}>{t('Çalışan bulunamadı.')}</Text>
      </Page>
    );
  }
  // Quiet reloads pass fresh props, but the form keeps what the user typed (state is initialized once).
  const { employee, services, plan } = query.data;
  return (
    <EmployeeForm
      employee={employee}
      services={services}
      team={employee && plan === 'TEAM' ? <TeamCard employee={employee} onChanged={query.refresh} /> : null}
    />
  );
}

function EmployeeForm({ employee, services, team }: { employee: Employee | null; services: Service[]; team: ReactNode }) {
  const editing = !!employee;
  const [name, setName] = useState(employee?.name ?? '');
  const [specialty, setSpecialty] = useState(employee?.specialty ?? '');
  const [phone, setPhone] = useState(employee?.phone ?? '');
  const [email, setEmail] = useState(employee?.email ?? '');
  const [isActive, setIsActive] = useState(employee?.isActive ?? true);
  const [serviceIds, setServiceIds] = useState<string[]>(() => employee?.employeeServices.map((es) => es.service.id) ?? []);
  const [formError, setFormError] = useState<string | null>(null);
  const save = useApiMutation();
  const remove = useApiMutation();

  const submit = async () => {
    setFormError(null);
    if (!name.trim()) return setFormError(t('Çalışanın adını girin.'));
    if (!specialty.trim()) return setFormError(t('Uzmanlık alanını girin (ör. Kuaför).'));
    if (!isOptionalEmail(email)) return setFormError(t('Geçerli bir e-posta adresi girin.'));

    const input = { name: name.trim(), specialty: specialty.trim(), phone: phone.trim() || null, email: email.trim() || null, serviceIds };
    const ok = await save.run((client) =>
      employee ? updateEmployee(client, employee.id, { ...input, isActive }) : createEmployee(client, input)
    );
    if (ok) router.back();
  };

  const confirmDelete = () =>
    Alert.alert(t('Çalışanı sil'), t('Bu çalışan kalıcı olarak silinecek. Randevu kaydı olan çalışanlar silinemez; onları pasife alabilirsiniz.'), [
      { text: t('Vazgeç'), style: 'cancel' },
      {
        text: t('Sil'),
        style: 'destructive',
        onPress: async () => {
          if (employee && (await remove.run((client) => deleteEmployee(client, employee.id)))) router.back();
        },
      },
    ]);

  const toggleService = (serviceId: string) =>
    setServiceIds((ids) => (ids.includes(serviceId) ? ids.filter((x) => x !== serviceId) : [...ids, serviceId]));

  return (
    <Page>
      <Stack.Screen options={{ title: editing ? t('Çalışanı düzenle') : t('Yeni çalışan') }} />

      <TextField label={t('Ad soyad')} value={name} onChangeText={setName} autoCapitalize="words" maxLength={80} />
      <TextField label={t('Uzmanlık')} value={specialty} onChangeText={setSpecialty} placeholder={t('Ör. Kuaför, Diş hekimi')} maxLength={80} />
      <TextField label={t('Telefon (isteğe bağlı)')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TextField label={t('E-posta (isteğe bağlı)')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

      {editing ? (
        <Card>
          <SwitchRow
            label={t('Aktif')}
            hint={t('Pasif çalışanlara yeni randevu verilmez; geçmiş randevuları korunur.')}
            value={isActive}
            onValueChange={setIsActive}
          />
        </Card>
      ) : null}

      {services.length > 0 ? (
        <>
          <SectionTitle hint={t('Hiçbirini seçmezseniz tüm hizmetleri verebilir.')}>{t('Verdiği hizmetler')}</SectionTitle>
          <ChipRow>
            {services.map((s) => (
              <Chip key={s.id} label={s.name} selected={serviceIds.includes(s.id)} onPress={() => toggleService(s.id)} />
            ))}
          </ChipRow>
        </>
      ) : null}

      <InlineError message={formError ?? save.error ?? remove.error} />
      <Button label={editing ? t('Kaydet') : t('Çalışanı ekle')} onPress={submit} busy={save.busy} />
      {team}
      {editing ? <Button label={t('Çalışanı sil')} variant="danger" onPress={confirmDelete} busy={remove.busy} /> : null}
    </Page>
  );
}

/**
 * TEAM plan: the person behind this staff record. Not joined → share an invite link (a new link replaces the
 * old one); joined → their sign-in e-mail and "remove from team" (their account ends, bookings stay).
 */
function TeamCard({ employee, onChanged }: { employee: Employee; onChanged: () => unknown }) {
  const { typography } = useTheme();
  const { profile } = useAuth();
  const action = useApiMutation();
  const businessName = profile?.business.name ?? '';

  const shareInvite = async () => {
    let link: string | null = null;
    const ok = await action.run(async (client) => {
      link = absoluteUrl((await createInvite(client, employee.id)).path);
    });
    if (!ok || !link) return;
    onChanged();
    const message = t('{0} ekibine katılmak için bu bağlantıyı açın: {1}', businessName, link);
    await Share.share({ message, url: link }).catch(() => {});
  };

  const cancelInvite = () =>
    Alert.alert(t('Daveti iptal et'), t('Gönderdiğiniz bağlantı artık çalışmayacak.'), [
      { text: t('Vazgeç'), style: 'cancel' },
      {
        text: t('İptal et'),
        style: 'destructive',
        onPress: async () => {
          if (await action.run((client) => revokeInvite(client, employee.id))) onChanged();
        },
      },
    ]);

  const confirmRemove = () =>
    Alert.alert(t('Ekipten çıkar'), t('{0} uygulamaya artık giriş yapamaz. Geçmiş randevuları korunur; daha sonra yeniden davet edebilirsiniz.', employee.name), [
      { text: t('Vazgeç'), style: 'cancel' },
      {
        text: t('Ekipten çıkar'),
        style: 'destructive',
        onPress: async () => {
          if (await action.run((client) => removeMember(client, employee.id))) onChanged();
        },
      },
    ]);

  let body: ReactNode;
  if (employee.memberEmail) {
    body = (
      <>
        <Text style={typography.body}>{t('Ekibe katıldı: {0}', employee.memberEmail)}</Text>
        <Text style={typography.caption}>{t('Bu çalışana alınan randevular uygulamada kendisine görünür.')}</Text>
        <Button label={t('Ekipten çıkar')} variant="danger" onPress={confirmRemove} busy={action.busy} />
      </>
    );
  } else if (!employee.isActive) {
    body = <Text style={typography.body}>{t('Pasif bir çalışana davet gönderilemez.')}</Text>;
  } else if (employee.inviteExpiresAt) {
    const until = new Date(employee.inviteExpiresAt).toLocaleDateString(localeTag(), { day: 'numeric', month: 'long' });
    body = (
      <>
        <Text style={typography.body}>{t('Davet bağlantısı {0} tarihine kadar geçerli.', until)}</Text>
        <Button label={t('Yeni bağlantı paylaş')} icon="share" variant="secondary" onPress={shareInvite} busy={action.busy} />
        <Button label={t('Daveti iptal et')} variant="danger" onPress={cancelInvite} disabled={action.busy} />
      </>
    );
  } else {
    body = (
      <>
        <Text style={typography.body}>
          {t('Davet bağlantısını paylaşın. Kabul eden kişi kendi hesabıyla giriş yapar ve bu çalışana alınan randevuları görür.')}
        </Text>
        <Button label={t('Davet bağlantısı paylaş')} icon="share" onPress={shareInvite} busy={action.busy} />
      </>
    );
  }

  return (
    <>
      <SectionTitle>{t('Ekip')}</SectionTitle>
      <Card>
        {body}
        <InlineError message={action.error} />
      </Card>
    </>
  );
}
