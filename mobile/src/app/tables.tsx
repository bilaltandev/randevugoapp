import { router, Stack } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { createArea, deleteArea, fetchTables, renameArea, type RestaurantTable, type TableStatus } from '@/api/panel';
import { EmptyState } from '@/components/EmptyState';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { Button, Card, Chip, ChipRow, HeaderButton, InlineError, Page, SectionTitle, TextField } from '@/components/ui';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { dateKey } from '@/lib/appointments';
import { makeStyles, radius, spacing, useTheme, type Colors } from '@/theme';
import { t } from '@/i18n';

const tableStatus = (colors: Colors): Record<TableStatus, { label: string; color: string; bg: string }> => ({
  AVAILABLE: { label: t('Boş'), color: colors.brandInk, bg: colors.brandSoft },
  RESERVED: { label: t('Rezerve'), color: colors.pending, bg: colors.pendingSoft },
  OCCUPIED: { label: t('Dolu'), color: colors.danger, bg: colors.dangerSoft },
  OUT_OF_SERVICE: { label: t('Kullanım dışı'), color: colors.ink3, bg: colors.surfaceMuted },
});

/** Restaurant floor: today's status of every table, grouped by area. The drag-and-drop plan stays on the web. */
export default function TablesScreen() {
  const { colors, typography } = useTheme();
  const TABLE_STATUS = tableStatus(colors);
  const styles = useStyles();
  const load = useCallback((client: Parameters<typeof fetchTables>[0]) => fetchTables(client, dateKey(new Date())), []);
  const { data, loading, error, refreshing, refresh, retry } = useApiQuery(load);
  const [area, setArea] = useState<string>('ALL');
  const [managingAreas, setManagingAreas] = useState(false);

  if (loading) return <LoadingView />;
  if (error || !data) return <ErrorView message={error ?? t('Masalar yüklenemedi.')} onRetry={retry} />;

  const visible = data.tables.filter((x) => area === 'ALL' || (area === 'NONE' ? !x.areaId : x.areaId === area));
  const counts = (Object.keys(TABLE_STATUS) as TableStatus[]).map((s) => ({ s, n: data.tables.filter((x) => x.computedStatus === s).length }));

  return (
    <Page onRefresh={refresh} refreshing={refreshing}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <HeaderButton label={t('Masa ekle')} onPress={() => router.push({ pathname: '/tables/edit', params: area !== 'ALL' && area !== 'NONE' ? { areaId: area } : {} })} />
          ),
        }}
      />

      <View style={styles.legend}>
        {counts.map(({ s, n }) => (
          <View key={s} style={[styles.legendItem, { backgroundColor: TABLE_STATUS[s].bg }]}>
            <Text style={[typography.caption, { color: TABLE_STATUS[s].color, fontWeight: '600' }]}>
              {TABLE_STATUS[s].label}: {n}
            </Text>
          </View>
        ))}
      </View>

      <ChipRow>
        <Chip label={t('Tümü')} selected={area === 'ALL'} onPress={() => setArea('ALL')} />
        {data.areas.map((a) => (
          <Chip key={a.id} label={a.name} selected={area === a.id} onPress={() => setArea(a.id)} />
        ))}
        {data.tables.some((x) => !x.areaId) ? <Chip label={t('Alansız')} selected={area === 'NONE'} onPress={() => setArea('NONE')} /> : null}
      </ChipRow>

      {visible.length === 0 ? (
        <EmptyState title={t('Bu alanda masa yok')} description={t('Sağ üstteki “Masa ekle” ile masa oluşturun.')} />
      ) : (
        <View style={styles.grid}>
          {visible.map((table) => (
            <TableTile key={table.id} table={table} />
          ))}
        </View>
      )}

      <Button label={managingAreas ? t('Alan yönetimini kapat') : t('Alanları yönet')} variant="secondary" onPress={() => setManagingAreas((v) => !v)} />
      {managingAreas ? <AreaManager areas={data.areas} onChanged={refresh} /> : null}
    </Page>
  );
}

function TableTile({ table: tb }: { table: RestaurantTable }) {
  const { colors, typography } = useTheme();
  const TABLE_STATUS = tableStatus(colors);
  const styles = useStyles();
  const st = TABLE_STATUS[tb.computedStatus] ?? TABLE_STATUS.AVAILABLE;
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/tables/edit', params: { id: tb.id } })}
      accessibilityRole="button"
      accessibilityLabel={t('{0}, {1} kişilik, {2}', tb.name, tb.capacity, st.label)}
      style={({ pressed }) => [styles.tile, { borderColor: st.color }, pressed && styles.pressed]}>
      <View style={[styles.shape, tb.shape === 'ROUND' && styles.round, tb.shape === 'RECTANGLE' && styles.rect, { backgroundColor: st.bg }]}>
        <Text style={[typography.heading, { color: st.color }]} numberOfLines={1}>
          {tb.name}
        </Text>
      </View>
      <Text style={typography.caption}>
        {t('{0} kişi', tb.capacity)}
        {tb.area ? ` · ${tb.area.name}` : ''}
      </Text>
      <Text style={[typography.caption, { color: st.color, fontWeight: '600' }]}>{st.label}</Text>
      {tb.currentAppointment?.customerName ? (
        <Text style={typography.caption} numberOfLines={1}>
          {tb.currentAppointment.startTime} {tb.currentAppointment.customerName}
        </Text>
      ) : null}
    </Pressable>
  );
}

function AreaManager({ areas, onChanged }: { areas: { id: string; name: string }[]; onChanged: () => void }) {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const save = useApiMutation();

  const add = async () => {
    if (!name.trim()) return save.setError(t('Alan adını girin (ör. Teras).'));
    if (await save.run((client) => createArea(client, name.trim()))) {
      setName('');
      onChanged();
    }
  };

  const saveRename = async () => {
    if (!editing) return;
    if (!editing.name.trim()) return save.setError(t('Alan adı boş olamaz.'));
    if (await save.run((client) => renameArea(client, editing.id, editing.name.trim()))) {
      setEditing(null);
      onChanged();
    }
  };

  const remove = (id: string, areaName: string) =>
    Alert.alert(t('Alanı sil'), t('"{0}" silinecek. Bu alandaki masalar silinmez, "Alansız" olur.', areaName), [
      { text: t('Vazgeç'), style: 'cancel' },
      { text: t('Sil'), style: 'destructive', onPress: async () => (await save.run((client) => deleteArea(client, id))) && onChanged() },
    ]);

  return (
    <Card>
      <SectionTitle>{t('Alanlar')}</SectionTitle>
      {areas.length === 0 ? <Text style={typography.body}>{t('Henüz alan yok.')}</Text> : null}
      {areas.map((a) =>
        editing?.id === a.id ? (
          <View key={a.id} style={styles.areaEdit}>
            <TextField label={t('Alan adı')} value={editing.name} onChangeText={(v) => setEditing({ id: a.id, name: v })} maxLength={40} autoFocus />
            <View style={styles.areaRow}>
              <Text style={[typography.label, { color: colors.ink3 }]} onPress={() => setEditing(null)}>
                {t('Vazgeç')}</Text>
              <Text style={[typography.label, { color: colors.brand }]} onPress={saveRename}>
                {t('Kaydet')}</Text>
            </View>
          </View>
        ) : (
          <View key={a.id} style={styles.areaRow}>
            <Text style={[typography.body, { color: colors.ink, flex: 1 }]}>{a.name}</Text>
            <Text style={[typography.label, { color: colors.brand }]} onPress={() => setEditing({ id: a.id, name: a.name })}>
              {t('Adlandır')}</Text>
            <Text style={[typography.label, { color: colors.danger }]} onPress={() => remove(a.id, a.name)}>
              {t('Sil')}</Text>
          </View>
        )
      )}
      <TextField label={t('Yeni alan')} value={name} onChangeText={setName} placeholder={t('Ör. Bahçe, Teras, Salon')} maxLength={40} />
      <InlineError message={save.error} />
      <Button label={t('Alan ekle')} variant="secondary" onPress={add} busy={save.busy} />
    </Card>
  );
}

const useStyles = makeStyles((colors) => ({
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  legendItem: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: {
    flexBasis: '30%',
    flexGrow: 1,
    alignItems: 'center',
    gap: 2,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  shape: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, marginBottom: spacing.xs, paddingHorizontal: 4 },
  round: { borderRadius: 32 },
  rect: { width: 84, height: 54 },
  pressed: { opacity: 0.8 },
  areaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.xs },
  areaEdit: { gap: spacing.xs },
}));
