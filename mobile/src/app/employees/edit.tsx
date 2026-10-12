import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Text } from 'react-native';

import { createEmployee, deleteEmployee, fetchEmployees, fetchServices, updateEmployee, type Employee, type Service } from '@/api/business';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { Button, Card, Chip, ChipRow, InlineError, Page, SectionTitle, SwitchRow, TextField } from '@/components/ui';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { isOptionalEmail } from '@/lib/forms';
import { useTheme } from '@/theme';

/** Create (no id) or edit an employee. */
export default function EmployeeEditScreen() {
  const { typography } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const load = useCallback(
    async (client: Parameters<typeof fetchEmployees>[0]) => {
      const [employees, services] = await Promise.all([fetchEmployees(client), fetchServices(client)]);
      return { employee: employees.find((e) => e.id === id) ?? null, services };
    },
    [id]
  );
  const query = useApiQuery(load);

  if (query.loading) return <LoadingView />;
  if (query.error || !query.data) return <ErrorView message={query.error ?? 'Yüklenemedi.'} onRetry={query.retry} />;
  if (id && !query.data.employee) {
    return (
      <Page>
        <Text style={typography.body}>Çalışan bulunamadı.</Text>
      </Page>
    );
  }
  // Quiet reloads pass fresh props, but the form keeps what the user typed (state is initialized once).
  return <EmployeeForm employee={query.data.employee} services={query.data.services} />;
}

function EmployeeForm({ employee, services }: { employee: Employee | null; services: Service[] }) {
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
    if (!name.trim()) return setFormError('Çalışanın adını girin.');
    if (!specialty.trim()) return setFormError('Uzmanlık alanını girin (ör. Kuaför).');
    if (!isOptionalEmail(email)) return setFormError('Geçerli bir e-posta adresi girin.');

    const input = { name: name.trim(), specialty: specialty.trim(), phone: phone.trim() || null, email: email.trim() || null, serviceIds };
    const ok = await save.run((client) =>
      employee ? updateEmployee(client, employee.id, { ...input, isActive }) : createEmployee(client, input)
    );
    if (ok) router.back();
  };

  const confirmDelete = () =>
    Alert.alert('Çalışanı sil', 'Bu çalışan kalıcı olarak silinecek. Randevu kaydı olan çalışanlar silinemez; onları pasife alabilirsiniz.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
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
      <Stack.Screen options={{ title: editing ? 'Çalışanı düzenle' : 'Yeni çalışan' }} />

      <TextField label="Ad soyad" value={name} onChangeText={setName} autoCapitalize="words" maxLength={80} />
      <TextField label="Uzmanlık" value={specialty} onChangeText={setSpecialty} placeholder="Ör. Kuaför, Diş hekimi" maxLength={80} />
      <TextField label="Telefon (isteğe bağlı)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TextField label="E-posta (isteğe bağlı)" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

      {editing ? (
        <Card>
          <SwitchRow
            label="Aktif"
            hint="Pasif çalışanlara yeni randevu verilmez; geçmiş randevuları korunur."
            value={isActive}
            onValueChange={setIsActive}
          />
        </Card>
      ) : null}

      {services.length > 0 ? (
        <>
          <SectionTitle hint="Hiçbirini seçmezseniz tüm hizmetleri verebilir.">Verdiği hizmetler</SectionTitle>
          <ChipRow>
            {services.map((s) => (
              <Chip key={s.id} label={s.name} selected={serviceIds.includes(s.id)} onPress={() => toggleService(s.id)} />
            ))}
          </ChipRow>
        </>
      ) : null}

      <InlineError message={formError ?? save.error ?? remove.error} />
      <Button label={editing ? 'Kaydet' : 'Çalışanı ekle'} onPress={submit} busy={save.busy} />
      {editing ? <Button label="Çalışanı sil" variant="danger" onPress={confirmDelete} busy={remove.busy} /> : null}
    </Page>
  );
}
