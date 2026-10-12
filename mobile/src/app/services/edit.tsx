import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Text } from 'react-native';

import { createService, deleteService, fetchEmployees, fetchServices, updateService, type Employee, type Service } from '@/api/business';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { Button, Card, Chip, ChipRow, InlineError, Page, SectionTitle, SwitchRow, TextField } from '@/components/ui';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { parseDuration, parsePrice } from '@/lib/forms';
import { useTheme } from '@/theme';

/** Create (no id) or edit a service. */
export default function ServiceEditScreen() {
  const { typography } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const load = useCallback(
    async (client: Parameters<typeof fetchServices>[0]) => {
      const [services, employees] = await Promise.all([fetchServices(client), fetchEmployees(client)]);
      return { service: services.find((s) => s.id === id) ?? null, employees: employees.filter((e) => e.isActive) };
    },
    [id]
  );
  const query = useApiQuery(load);

  if (query.loading) return <LoadingView />;
  if (query.error || !query.data) return <ErrorView message={query.error ?? 'Yüklenemedi.'} onRetry={query.retry} />;
  if (id && !query.data.service) {
    return (
      <Page>
        <Text style={typography.body}>Hizmet bulunamadı.</Text>
      </Page>
    );
  }
  // Quiet reloads pass fresh props, but the form keeps what the user typed (state is initialized once).
  return <ServiceForm service={query.data.service} employees={query.data.employees} />;
}

function ServiceForm({ service, employees }: { service: Service | null; employees: Employee[] }) {
  const editing = !!service;
  const [name, setName] = useState(service?.name ?? '');
  const [description, setDescription] = useState(service?.description ?? '');
  const [duration, setDuration] = useState(String(service?.durationMinutes ?? 30));
  const [price, setPrice] = useState(service ? String(service.price).replace('.', ',') : '');
  const [isActive, setIsActive] = useState(service?.isActive ?? true);
  const [employeeIds, setEmployeeIds] = useState<string[]>(() => service?.employeeServices.map((es) => es.employee.id) ?? []);
  const [formError, setFormError] = useState<string | null>(null);
  const save = useApiMutation();
  const remove = useApiMutation();

  const submit = async () => {
    setFormError(null);
    const durationMinutes = parseDuration(duration);
    const amount = parsePrice(price);
    if (!name.trim()) return setFormError('Hizmet adını girin.');
    if (durationMinutes === null) return setFormError('Süreyi 1–1440 arası dakika olarak girin.');
    if (amount === null) return setFormError('Fiyatı sayı olarak girin (ör. 250 veya 249,90).');

    const input = { name: name.trim(), description: description.trim() || null, durationMinutes, price: amount, employeeIds };
    const ok = await save.run((client) =>
      service ? updateService(client, service.id, { ...input, isActive }) : createService(client, input)
    );
    if (ok) router.back();
  };

  const confirmDelete = () =>
    Alert.alert('Hizmeti sil', 'Bu hizmet kalıcı olarak silinecek. Randevu kaydı olan hizmetler silinemez; onları pasife alabilirsiniz.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          if (service && (await remove.run((client) => deleteService(client, service.id)))) router.back();
        },
      },
    ]);

  const toggleEmployee = (empId: string) =>
    setEmployeeIds((ids) => (ids.includes(empId) ? ids.filter((x) => x !== empId) : [...ids, empId]));

  return (
    <Page>
      <Stack.Screen options={{ title: editing ? 'Hizmeti düzenle' : 'Yeni hizmet' }} />

      <TextField label="Hizmet adı" value={name} onChangeText={setName} placeholder="Ör. Saç kesimi" maxLength={80} />
      <TextField label="Açıklama (isteğe bağlı)" value={description} onChangeText={setDescription} multiline maxLength={500} />
      <TextField label="Süre (dakika)" value={duration} onChangeText={setDuration} keyboardType="number-pad" maxLength={4} />
      <TextField label="Fiyat (₺)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="0" maxLength={10} />

      {editing ? (
        <Card>
          <SwitchRow label="Aktif" hint="Pasif hizmetler online randevu sayfasında görünmez." value={isActive} onValueChange={setIsActive} />
        </Card>
      ) : null}

      {employees.length > 0 ? (
        <>
          <SectionTitle hint="Hiçbirini seçmezseniz, hizmet ataması olmayan çalışanlar bu hizmeti verebilir.">Bu hizmeti verenler</SectionTitle>
          <ChipRow>
            {employees.map((e) => (
              <Chip key={e.id} label={e.name} selected={employeeIds.includes(e.id)} onPress={() => toggleEmployee(e.id)} />
            ))}
          </ChipRow>
        </>
      ) : null}

      <InlineError message={formError ?? save.error ?? remove.error} />
      <Button label={editing ? 'Kaydet' : 'Hizmeti ekle'} onPress={submit} busy={save.busy} />
      {editing ? <Button label="Hizmeti sil" variant="danger" onPress={confirmDelete} busy={remove.busy} /> : null}
    </Page>
  );
}
