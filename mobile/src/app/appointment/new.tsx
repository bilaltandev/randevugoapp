import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { createAppointment, fetchAvailableSlots, fetchEmployees, fetchMemberContext, fetchServices, type Employee, type Service } from '@/api/business';
import { useAccount, useAuth } from '@/auth/AuthProvider';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { Button, Card, Chip, ChipRow, InlineError, Page, SectionTitle, TextField } from '@/components/ui';
import { WeekStrip } from '@/components/WeekStrip';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { dateKey, employeesForService, formatPrice, fromDateKey, longDate } from '@/lib/appointments';
import { errorMessage } from '@/lib/errorMessage';
import { isPhone, isTime, normalizeTime } from '@/lib/forms';
import { makeStyles, spacing, useTheme } from '@/theme';
import { t } from '@/i18n';

type Params = { date?: string; mode?: string; time?: string; customerName?: string; customerPhone?: string };

/**
 * New booking, or a closed slot ("Saat kapat") with `mode=block`. Free times come from the same
 * available-slots API as the public booking page; the owner may also type any time (e.g. a walk-in
 * outside opening hours). Conflicts are still refused by the server (409) and shown here.
 * A team member books (and closes time) only for themselves: no staff choice, their own services.
 */
export default function NewAppointmentScreen() {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  const params = useLocalSearchParams<Params>();
  const blocking = params.mode === 'block';
  const { profile } = useAuth();
  const { isMember } = useAccount();
  const todayKey = dateKey(new Date());

  const loadOptions = useCallback(
    async (client: Parameters<typeof fetchServices>[0]) => {
      if (isMember) {
        // The server already narrowed the services to the ones this member offers.
        const own = await fetchMemberContext(client);
        const self: Employee = { ...own.employee, employeeServices: [] };
        return { services: own.services, employees: own.employee.isActive ? [self] : [] };
      }
      const [services, employees] = await Promise.all([fetchServices(client), fetchEmployees(client)]);
      return { services: services.filter((s) => s.isActive), employees: employees.filter((e) => e.isActive) };
    },
    [isMember]
  );
  const options = useApiQuery(loadOptions);

  const [date, setDate] = useState(() => {
    const d = fromDateKey(params.date);
    return d && dateKey(d) >= todayKey ? d : new Date();
  });
  const [pickedServiceId, setServiceId] = useState<string | null>(null);
  const [pickedEmployeeId, setEmployeeId] = useState<string>('any');
  const [slot, setSlot] = useState<string | null>(null);
  const [manualTime, setManualTime] = useState(params.time ?? '');
  const [name, setName] = useState(params.customerName ?? '');
  const [phone, setPhone] = useState(params.customerPhone ?? '');
  const [notes, setNotes] = useState(blocking ? t('Mola / kişisel iş') : '');
  const [formError, setFormError] = useState<string | null>(null);
  const save = useApiMutation();

  // Choices that no longer fit (lists reloaded, another service picked) fall back to a sensible default.
  const services = options.data?.services ?? [];
  const service = services.find((s) => s.id === pickedServiceId) ?? services[0] ?? null;
  const serviceId = service?.id ?? null;
  const allStaff = options.data?.employees ?? [];
  const staff = service ? employeesForService(allStaff, service.id) : allStaff;
  const staffHas = staff.some((e) => e.id === pickedEmployeeId);
  // A closed slot belongs to one employee; a booking may leave the choice to the server ("any").
  // A member's bookings are always their own.
  const employeeId = isMember
    ? (staff[0]?.id ?? '')
    : blocking
      ? (staffHas ? pickedEmployeeId : staff[0]?.id ?? '')
      : staffHas
        ? pickedEmployeeId
        : 'any';

  const slots = useSlots(profile?.business.id, serviceId, employeeId, dateKey(date));
  const chosenSlot = slot && slots.list?.includes(slot) ? slot : null;

  const time = manualTime.trim() ? normalizeTime(manualTime) : chosenSlot;

  const submit = async () => {
    setFormError(null);
    if (!profile || !service) return setFormError(t('Lütfen bir hizmet seçin.'));
    if (!employeeId) return setFormError(t('Lütfen bir çalışan seçin.'));
    if (!time || !isTime(time)) return setFormError(t('Lütfen listeden bir saat seçin ya da SS:DD biçiminde bir saat yazın.'));
    if (!blocking) {
      if (!name.trim()) return setFormError(t('Müşteri adını girin.'));
      if (!isPhone(phone)) return setFormError(t('Geçerli bir telefon numarası girin.'));
    } else if (!notes.trim()) {
      return setFormError(t('Kapatma sebebini girin.'));
    }

    const ok = await save.run((client) =>
      createAppointment(client, {
        businessId: profile.business.id,
        serviceId: service.id,
        employeeId,
        date: dateKey(date),
        startTime: time,
        // Closed slots carry the same placeholder customer as the web calendar.
        customerName: blocking ? `[KAPALI: ${notes.trim()}]` : name.trim(), // data marker the web panel matches: never translated
        customerPhone: blocking ? '0000000000' : phone.trim(),
        notes: notes.trim() || undefined,
        isBlockedSlot: blocking || undefined,
      })
    );
    if (ok) router.back();
  };

  if (options.loading) return <LoadingView />;
  if (options.error) return <ErrorView message={options.error} onRetry={options.retry} />;
  if (isMember && (services.length === 0 || (options.data?.employees.length ?? 0) === 0)) {
    return (
      <Page>
        <Card>
          <Text style={typography.heading}>{t('Randevu oluşturulamıyor')}</Text>
          <Text style={typography.body}>{t('Size atanmış aktif bir hizmet yok ya da hesabınız pasif. İşletme sahibiyle görüşün.')}</Text>
        </Card>
      </Page>
    );
  }
  if (services.length === 0 || (options.data?.employees.length ?? 0) === 0) {
    return (
      <Page>
        <Card>
          <Text style={typography.heading}>{t('Önce hizmet ve çalışan ekleyin')}</Text>
          <Text style={typography.body}>{t('Randevu oluşturmak için en az bir aktif hizmet ve bir aktif çalışan gerekir.')}</Text>
          <Button label={t('Hizmetlere git')} variant="secondary" onPress={() => router.replace('/services')} />
        </Card>
      </Page>
    );
  }

  return (
    <Page>
      {blocking ? (
        <Text style={typography.body}>{t('Kapatılan saat aralığında müşteriler o çalışana online randevu alamaz.')}</Text>
      ) : null}

      <SectionTitle hint={longDate(date)}>{t('Tarih')}</SectionTitle>
      <WeekStrip selected={date} onSelect={setDate} minKey={todayKey} />

      <SectionTitle hint={blocking ? t('Kapatılacak süre, seçilen hizmetin süresi kadardır.') : undefined}>
        {blocking ? t('Süre') : t('Hizmet')}
      </SectionTitle>
      <ChipRow>
        {services.map((s: Service) => (
          <Chip
            key={s.id}
            label={blocking ? t('{0} dk · {1}', s.durationMinutes, s.name) : t('{0} · {1} dk · {2}', s.name, s.durationMinutes, formatPrice(s.price))}
            selected={s.id === serviceId}
            onPress={() => setServiceId(s.id)}
          />
        ))}
      </ChipRow>

      {isMember ? null : (
        <>
          <SectionTitle>{t('Çalışan')}</SectionTitle>
          <ChipRow>
            {!blocking ? <Chip label={t('Fark etmez')} selected={employeeId === 'any'} onPress={() => setEmployeeId('any')} /> : null}
            {staff.map((e: Employee) => (
              <Chip key={e.id} label={e.name} selected={e.id === employeeId} onPress={() => setEmployeeId(e.id)} />
            ))}
          </ChipRow>
          {staff.length === 0 ? <Text style={typography.caption}>{t('Bu hizmeti veren aktif çalışan yok.')}</Text> : null}
        </>
      )}

      <SectionTitle hint={t('Müşterilerin online görebildiği boş saatler')}>{t('Saat')}</SectionTitle>
      {slots.loading ? (
        <ActivityIndicator color={colors.brand} />
      ) : slots.error ? (
        <InlineError message={slots.error} />
      ) : slots.list && slots.list.length > 0 ? (
        <ChipRow>
          {slots.list.map((time) => (
            <Chip
              key={time}
              label={time}
              selected={!manualTime.trim() && chosenSlot === time}
              onPress={() => {
                setManualTime('');
                setSlot(time);
              }}
            />
          ))}
        </ChipRow>
      ) : (
        <Text style={typography.caption}>{slots.message ?? t('Bu gün için boş saat yok.')}</Text>
      )}
      <TextField
        label={t('Listede olmayan bir saat')}
        hint={t('Çalışma saatleri dışında da kayıt girebilirsiniz; çakışan randevu yine engellenir.')}
        placeholder={t('Örn. 18:45')}
        value={manualTime}
        onChangeText={setManualTime}
        onBlur={() => setManualTime((v) => (v.trim() ? normalizeTime(v) : ''))}
        keyboardType="numbers-and-punctuation"
        maxLength={5}
      />

      {blocking ? (
        <TextField label={t('Kapatma sebebi')} value={notes} onChangeText={setNotes} maxLength={120} />
      ) : (
        <>
          <SectionTitle>{t('Müşteri')}</SectionTitle>
          <TextField label={t('Ad soyad')} value={name} onChangeText={setName} autoCapitalize="words" textContentType="name" />
          <TextField label={t('Telefon')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" textContentType="telephoneNumber" placeholder={t('05XX XXX XX XX')} />
          <TextField label={t('Not (isteğe bağlı)')} value={notes} onChangeText={setNotes} multiline maxLength={500} />
        </>
      )}

      <InlineError message={formError ?? save.error} />
      <View style={styles.summary}>
        <Text style={typography.label}>
          {time && isTime(time) ? `${longDate(date)} · ${time}` : t('Saat seçilmedi')}
          {service ? t(' · {0} dk', service.durationMinutes) : ''}
        </Text>
      </View>
      <Button label={blocking ? t('Bu saati kapat') : t('Randevuyu kaydet')} onPress={submit} busy={save.busy} />
    </Page>
  );
}

/** Free start times for the chosen service/employee/day, reloaded whenever one of them changes. */
function useSlots(businessId: string | undefined, serviceId: string | null, employeeId: string, date: string) {
  const { client } = useAuth();
  const key = [businessId, serviceId, employeeId, date].join('|');
  // Results remember the request they answer, so a new choice shows "loading" without a reset.
  const [result, setResult] = useState<{ key: string; list: string[] | null; message?: string; error: string | null } | null>(null);
  const ready = !!(client && businessId && serviceId && employeeId);

  useEffect(() => {
    if (!client || !businessId || !serviceId || !employeeId) return;
    let cancelled = false;
    fetchAvailableSlots(client, { businessId, date, serviceId, employeeId })
      .then((r) => !cancelled && setResult({ key, list: r.slots, message: r.message, error: null }))
      .catch((e) => !cancelled && setResult({ key, list: null, error: errorMessage(e) }));
    return () => {
      cancelled = true;
    };
  }, [client, businessId, serviceId, employeeId, date, key]);

  const current = result?.key === key ? result : null;
  return {
    list: current?.list ?? null,
    message: current?.message,
    error: current?.error ?? null,
    loading: ready && !current,
  };
}

const useStyles = makeStyles(() => ({
  summary: { alignItems: 'center', marginTop: spacing.sm },
}));
