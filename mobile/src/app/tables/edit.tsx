import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Text } from 'react-native';

import {
  createTable,
  deleteTable,
  fetchTables,
  updateTable,
  type RestaurantArea,
  type RestaurantTable,
  type TableShape,
  type TableStatus,
} from '@/api/panel';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { Button, Card, Chip, ChipRow, InlineError, Page, SectionTitle, SwitchRow, TextField } from '@/components/ui';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { dateKey } from '@/lib/appointments';
import { useTheme } from '@/theme';

const SHAPES: { id: TableShape; label: string }[] = [
  { id: 'ROUND', label: 'Yuvarlak' },
  { id: 'SQUARE', label: 'Kare' },
  { id: 'RECTANGLE', label: 'Dikdörtgen' },
];

/** Create (no id) or edit a table. Position and size on the floor plan are edited on the web. */
export default function TableEditScreen() {
  const { typography } = useTheme();
  const { id, areaId } = useLocalSearchParams<{ id?: string; areaId?: string }>();
  const load = useCallback((client: Parameters<typeof fetchTables>[0]) => fetchTables(client, dateKey(new Date())), []);
  const query = useApiQuery(load);

  if (query.loading) return <LoadingView />;
  if (query.error || !query.data) return <ErrorView message={query.error ?? 'Yüklenemedi.'} onRetry={query.retry} />;
  const table = id ? query.data.tables.find((t) => t.id === id) ?? null : null;
  if (id && !table) {
    return (
      <Page>
        <Text style={typography.body}>Masa bulunamadı.</Text>
      </Page>
    );
  }
  return <TableForm table={table} areas={query.data.areas} tableCount={query.data.tables.length} defaultAreaId={areaId ?? null} />;
}

function TableForm({ table, areas, tableCount, defaultAreaId }: { table: RestaurantTable | null; areas: RestaurantArea[]; tableCount: number; defaultAreaId: string | null }) {
  const editing = !!table;
  const [name, setName] = useState(table?.name ?? '');
  const [capacity, setCapacity] = useState(String(table?.capacity ?? 2));
  const [shape, setShape] = useState<TableShape>(table?.shape ?? 'ROUND');
  const [areaId, setAreaId] = useState<string | null>(table?.areaId ?? defaultAreaId);
  const [description, setDescription] = useState(table?.description ?? '');
  const [isActive, setIsActive] = useState(table?.isActive ?? true);
  const [outOfService, setOutOfService] = useState(table?.status === 'OUT_OF_SERVICE');
  const [formError, setFormError] = useState<string | null>(null);
  const save = useApiMutation();
  const remove = useApiMutation();

  const submit = async () => {
    setFormError(null);
    const cap = Number(capacity);
    if (!name.trim()) return setFormError('Masa adı veya numarası girin.');
    if (!Number.isInteger(cap) || cap < 1 || cap > 50) return setFormError('Kapasite 1–50 arası bir sayı olmalı.');
    const status: TableStatus = outOfService ? 'OUT_OF_SERVICE' : 'AVAILABLE';
    const input = { name: name.trim(), capacity: cap, shape, areaId, description: description.trim() || null, isActive, status };
    const ok = await save.run((client) =>
      table
        ? updateTable(client, table.id, input)
        : // New tables are placed on a grid so they don't stack on the web floor plan.
          createTable(client, { ...input, positionX: 40 + (tableCount % 6) * 110, positionY: 40 + Math.floor(tableCount / 6) * 110 })
    );
    if (ok) router.back();
  };

  const confirmDelete = () =>
    Alert.alert('Masayı sil', 'Masa kalıcı olarak silinecek. Geçmiş rezervasyonlar korunur, masa bilgisi boşalır.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          if (table && (await remove.run((client) => deleteTable(client, table.id)))) router.back();
        },
      },
    ]);

  return (
    <Page>
      <Stack.Screen options={{ title: editing ? 'Masayı düzenle' : 'Yeni masa' }} />

      <TextField label="Masa adı / numarası" value={name} onChangeText={setName} placeholder="Ör. M1, Teras 4" maxLength={30} />
      <TextField label="Kapasite (kişi)" value={capacity} onChangeText={setCapacity} keyboardType="number-pad" maxLength={2} />

      <SectionTitle>Şekil</SectionTitle>
      <ChipRow>
        {SHAPES.map((s) => (
          <Chip key={s.id} label={s.label} selected={shape === s.id} onPress={() => setShape(s.id)} />
        ))}
      </ChipRow>

      <SectionTitle>Alan</SectionTitle>
      <ChipRow>
        <Chip label="Alansız" selected={areaId === null} onPress={() => setAreaId(null)} />
        {areas.map((a) => (
          <Chip key={a.id} label={a.name} selected={areaId === a.id} onPress={() => setAreaId(a.id)} />
        ))}
      </ChipRow>

      <TextField label="Açıklama (isteğe bağlı)" value={description} onChangeText={setDescription} multiline maxLength={200} placeholder="Ör. Cam kenarı, manzaralı" />

      <Card>
        <SwitchRow label="Aktif" hint="Pasif masalar online rezervasyonda sunulmaz." value={isActive} onValueChange={setIsActive} />
        <SwitchRow label="Kullanım dışı" hint="Bakım vb. nedenlerle geçici olarak kapatın." value={outOfService} onValueChange={setOutOfService} />
      </Card>

      <InlineError message={formError ?? save.error ?? remove.error} />
      <Button label={editing ? 'Kaydet' : 'Masayı ekle'} onPress={submit} busy={save.busy} />
      {editing ? <Button label="Masayı sil" variant="danger" onPress={confirmDelete} busy={remove.busy} /> : null}
    </Page>
  );
}
