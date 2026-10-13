import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { fetchCustomers, updateCustomer, type Customer } from '@/api/business';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { StatusBadge } from '@/components/StatusBadge';
import { Button, Card, InlineError, Page, SectionTitle, TextField } from '@/components/ui';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { formatPrice, shortDateFromKey } from '@/lib/appointments';
import { isOptionalEmail, isPhone } from '@/lib/forms';
import { makeStyles, spacing, useTheme } from '@/theme';
import { t, tc } from '@/i18n';

export default function CustomerScreen() {
  const { typography } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, setData, loading, error, retry } = useApiQuery(fetchCustomers);
  const customer = data?.find((c) => c.id === id) ?? null;

  if (loading) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={retry} />;
  if (!customer) {
    return (
      <Page>
        <Text style={typography.body}>{t('Müşteri bulunamadı.')}</Text>
      </Page>
    );
  }

  return (
    <CustomerDetail
      customer={customer}
      onSaved={(next) => setData((list) => list?.map((c) => (c.id === customer.id ? { ...c, ...next } : c)) ?? list)}
    />
  );
}

type Editable = Pick<Customer, 'phone' | 'email' | 'notes'>;

/** Form state starts from the loaded customer once; quiet reloads don't overwrite what is being typed. */
function CustomerDetail({ customer, onSaved }: { customer: Customer; onSaved: (next: Editable) => void }) {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  const [phone, setPhone] = useState(customer.phone);
  const [email, setEmail] = useState(customer.email ?? '');
  const [notes, setNotes] = useState(customer.notes ?? '');
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const save = useApiMutation();

  const dirty = phone !== customer.phone || email !== (customer.email ?? '') || notes !== (customer.notes ?? '');
  const digits = customer.phone.replace(/[^\d+]/g, '');

  const submit = async () => {
    setFormError(null);
    setSaved(false);
    if (!isPhone(phone)) return setFormError(t('Geçerli bir telefon numarası girin.'));
    if (!isOptionalEmail(email)) return setFormError(t('Geçerli bir e-posta adresi girin.'));
    const next = { phone: phone.trim(), email: email.trim() || null, notes: notes.trim() || null };
    if (await save.run((client) => updateCustomer(client, customer.id, next))) {
      setPhone(next.phone);
      setEmail(next.email ?? '');
      setNotes(next.notes ?? '');
      onSaved(next);
      setSaved(true);
    }
  };

  return (
    <Page>
      <Stack.Screen options={{ title: customer.name }} />

      <View style={styles.stats}>
        <Stat label={t('Randevu')} value={String(customer.totalAppointments)} />
        <Stat label={t('Toplam harcama')} value={formatPrice(customer.totalSpent)} />
      </View>

      <View style={styles.stats}>
        <View style={styles.flex}>
          <Button label={tc('telefon', 'Ara')} variant="secondary" onPress={() => Linking.openURL(`tel:${digits}`)} />
        </View>
        <View style={styles.flex}>
          <Button
            label={t('Randevu ver')}
            onPress={() => router.push({ pathname: '/appointment/new', params: { customerName: customer.name, customerPhone: customer.phone } })}
          />
        </View>
      </View>

      <SectionTitle>{t('Son randevular')}</SectionTitle>
      <Card>
        {customer.appointments.length === 0 ? (
          <Text style={typography.body}>{t('Kayıtlı randevu yok.')}</Text>
        ) : (
          customer.appointments.map((a) => (
            <View key={a.id} style={styles.appt}>
              <View style={styles.flex}>
                <Text style={[typography.body, { color: colors.ink }]}>
                  {shortDateFromKey(a.date)} · {a.startTime}
                </Text>
                {a.service ? <Text style={typography.caption}>{a.service.name}</Text> : null}
              </View>
              <StatusBadge appointment={{ status: a.status, isBlockedSlot: false }} />
            </View>
          ))
        )}
      </Card>

      <SectionTitle>{t('Bilgiler')}</SectionTitle>
      <TextField label={t('Telefon')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TextField label="E-posta" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextField label={t('Notlar')} value={notes} onChangeText={setNotes} multiline maxLength={1000} placeholder={t('Ör. alerji, tercih edilen çalışan…')} />

      <InlineError message={formError ?? save.error} />
      {saved && !dirty ? <Text style={[typography.label, { color: colors.brand }]}>{t('Kaydedildi.')}</Text> : null}
      <Button label={t('Kaydet')} onPress={submit} busy={save.busy} disabled={!dirty} />
    </Page>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const { typography } = useTheme();
  const styles = useStyles();
  return (
    <View style={[styles.flex, styles.stat]}>
      <Text style={typography.caption}>{label}</Text>
      <Text style={typography.title}>{value}</Text>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  stats: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
  stat: {
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  appt: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
}));
