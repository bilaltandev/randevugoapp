import { useState } from 'react';
import { Text, View } from 'react-native';

import { fetchSettings, updateSettings, type WorkingHour } from '@/api/business';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { Button, Card, InlineError, Page, SwitchRow, TextField } from '@/components/ui';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { hoursProblem, normalizeTime, type HoursDraft } from '@/lib/forms';
import { makeStyles, spacing, useTheme } from '@/theme';
import { t } from '@/i18n';

const DAY_NAMES = [t('Pazar'), t('Pazartesi'), t('Salı'), t('Çarşamba'), t('Perşembe'), t('Cuma'), t('Cumartesi')];
const MONDAY_FIRST = [1, 2, 3, 4, 5, 6, 0];

type Draft = HoursDraft & { id: string; dayOfWeek: number };

const toDraft = (h: WorkingHour): Draft => ({
  id: h.id,
  dayOfWeek: h.dayOfWeek,
  isOpen: h.isOpen,
  openTime: h.openTime,
  closeTime: h.closeTime,
  breakStartTime: h.breakStartTime ?? '',
  breakEndTime: h.breakEndTime ?? '',
});

/** The business-wide hours that the booking page and available-slots use (not per-employee hours). */
export default function WorkingHoursScreen() {
  const { data, loading, error, retry } = useApiQuery(fetchSettings);
  if (loading) return <LoadingView />;
  if (error || !data) return <ErrorView message={error ?? t('Çalışma saatleri yüklenemedi.')} onRetry={retry} />;
  return <HoursForm hours={data.workingHours} />;
}

/** Form state starts from the loaded hours once; quiet reloads don't overwrite what is being typed. */
function HoursForm({ hours }: { hours: WorkingHour[] }) {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  const [days, setDays] = useState<Draft[]>(() => {
    const business = hours.filter((h) => h.employeeId === null);
    return MONDAY_FIRST.map((d) => business.find((h) => h.dayOfWeek === d)).filter((h): h is WorkingHour => !!h).map(toDraft);
  });
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const save = useApiMutation();

  if (days.length === 0) {
    return (
      <Page>
        <Text style={typography.body}>{t('Çalışma saatleri henüz tanımlanmamış. Lütfen web panelindeki Ayarlar sayfasından oluşturun.')}</Text>
      </Page>
    );
  }

  const update = (id: string, patch: Partial<Draft>) => {
    setSaved(false);
    setDays((list) => list.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  };

  const copyToAll = (source: Draft) => {
    setSaved(false);
    setDays((list) => list.map((d) => ({ ...source, id: d.id, dayOfWeek: d.dayOfWeek })));
  };

  const submit = async () => {
    setFormError(null);
    for (const d of days) {
      const problem = hoursProblem(d);
      if (problem) return setFormError(`${DAY_NAMES[d.dayOfWeek]}: ${problem}`);
    }
    const workingHours = days.map((d) => ({
      id: d.id,
      employeeId: null,
      dayOfWeek: d.dayOfWeek,
      isOpen: d.isOpen,
      openTime: d.openTime,
      closeTime: d.closeTime,
      breakStartTime: d.breakStartTime.trim() || null,
      breakEndTime: d.breakEndTime.trim() || null,
    }));
    if (await save.run((client) => updateSettings(client, { workingHours }))) setSaved(true);
  };

  return (
    <Page>
      <Text style={typography.body}>{t('Müşteriler yalnızca bu saatler içinde online randevu alabilir. Saatleri SS:DD biçiminde girin.')}</Text>

      {days.map((d) => (
        <Card key={d.id}>
          <SwitchRow label={DAY_NAMES[d.dayOfWeek]} hint={d.isOpen ? undefined : t('Kapalı')} value={d.isOpen} onValueChange={(v) => update(d.id, { isOpen: v })} />
          {d.isOpen ? (
            <>
              <View style={styles.pair}>
                <TimeInput label={t('Açılış')} value={d.openTime} onChange={(v) => update(d.id, { openTime: v })} />
                <TimeInput label={t('Kapanış')} value={d.closeTime} onChange={(v) => update(d.id, { closeTime: v })} />
              </View>
              <View style={styles.pair}>
                <TimeInput label={t('Mola başı')} value={d.breakStartTime} onChange={(v) => update(d.id, { breakStartTime: v })} optional />
                <TimeInput label={t('Mola sonu')} value={d.breakEndTime} onChange={(v) => update(d.id, { breakEndTime: v })} optional />
              </View>
              {hoursProblem(d) ? <Text style={[typography.caption, { color: colors.danger }]}>{hoursProblem(d)}</Text> : null}
              <Text style={[typography.label, { color: colors.brand }]} onPress={() => copyToAll(d)} accessibilityRole="button">
                {t('Bu saatleri tüm günlere uygula')}</Text>
            </>
          ) : null}
        </Card>
      ))}

      <InlineError message={formError ?? save.error} />
      {saved ? <Text style={[typography.label, { color: colors.brand }]}>{t('Kaydedildi.')}</Text> : null}
      <Button label={t('Kaydet')} onPress={submit} busy={save.busy} />
    </Page>
  );
}

function TimeInput({ label, value, onChange, optional }: { label: string; value: string; onChange: (v: string) => void; optional?: boolean }) {
  const styles = useStyles();
  return (
    <View style={styles.flex}>
      <TextField
        label={label}
        value={value}
        onChangeText={onChange}
        onBlur={() => onChange(value.trim() ? normalizeTime(value) : '')}
        placeholder={optional ? t('Yok') : 'SS:DD'}
        keyboardType="numbers-and-punctuation"
        maxLength={5}
      />
    </View>
  );
}

const useStyles = makeStyles(() => ({
  pair: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
}));
