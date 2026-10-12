import { useState } from 'react';
import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { fetchSettings, updateSettings, type BusinessSettings } from '@/api/business';
import { absoluteUrl, SECTORS, uploadLogo } from '@/api/panel';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { Button, Card, Chip, ChipRow, InlineError, Page, SectionTitle, SwitchRow, TextField } from '@/components/ui';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { isPhone } from '@/lib/forms';
import { pickImage } from '@/lib/pickImage';
import { makeStyles, radius, spacing, useTheme } from '@/theme';

export default function BusinessSettingsScreen() {
  const { data, loading, error, retry } = useApiQuery(fetchSettings);
  if (loading) return <LoadingView />;
  if (error || !data) return <ErrorView message={error ?? 'Ayarlar yüklenemedi.'} onRetry={retry} />;
  return <BusinessForm data={data} />;
}

/** Form state starts from the loaded settings once; quiet reloads don't overwrite what is being typed. */
function BusinessForm({ data }: { data: BusinessSettings }) {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  const [form, setForm] = useState({
    name: data.name,
    description: data.description ?? '',
    phone: data.phone,
    whatsappNumber: data.whatsappNumber ?? '',
    address: data.address,
    city: data.city,
    enableStaffSelection: data.enableStaffSelection,
    sector: data.sector,
  });
  const [logo, setLogo] = useState(data.logo);
  const logoUpload = useApiMutation();
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const save = useApiMutation();

  const set = <K extends keyof typeof form>(key: K) => (value: (typeof form)[K]) => {
    setSaved(false);
    setForm((f) => ({ ...f, [key]: value }));
  };

  const submit = async () => {
    setFormError(null);
    // The API ignores empty name/phone/address/city (they would blank the public page), so require them here.
    if (!form.name.trim() || !form.address.trim() || !form.city.trim()) return setFormError('İşletme adı, adres ve şehir boş bırakılamaz.');
    if (!isPhone(form.phone)) return setFormError('Geçerli bir telefon numarası girin.');
    if (form.whatsappNumber.trim() && !isPhone(form.whatsappNumber)) return setFormError('WhatsApp numarası geçerli değil.');

    const input = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      phone: form.phone.trim(),
      whatsappNumber: form.whatsappNumber.trim() || null,
      address: form.address.trim(),
      city: form.city.trim(),
      enableStaffSelection: form.enableStaffSelection,
      sector: form.sector,
    };
    if (await save.run((client) => updateSettings(client, input))) setSaved(true);
  };

  const changeLogo = async () => {
    let image;
    try {
      image = await pickImage({ aspect: [1, 1] });
    } catch (e) {
      return logoUpload.setError((e as Error).message);
    }
    if (!image) return;
    const picked = image;
    await logoUpload.run(async (client) => setLogo(await uploadLogo(client, picked)));
  };

  const logoUrl = absoluteUrl(logo);

  return (
    <Page>
      <View style={styles.logoRow}>
        {logoUrl ? <Image source={{ uri: logoUrl }} style={styles.logo} contentFit="cover" alt="Logo" /> : <View style={[styles.logo, styles.logoEmpty]} />}
        <View style={styles.flex}>
          <Button label={logoUrl ? 'Logoyu değiştir' : 'Logo yükle'} variant="secondary" onPress={changeLogo} busy={logoUpload.busy} />
        </View>
      </View>
      <InlineError message={logoUpload.error} />

      <TextField label="İşletme adı" value={form.name} onChangeText={set('name')} maxLength={80} />
      <SectionTitle>Sektör</SectionTitle>
      <ChipRow>
        {SECTORS.map((s) => (
          <Chip key={s.id} label={s.name} selected={form.sector === s.id} onPress={() => set('sector')(s.id)} />
        ))}
      </ChipRow>
      <TextField label="Açıklama" value={form.description} onChangeText={set('description')} multiline maxLength={1000} />
      <TextField label="Telefon" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
      <TextField label="WhatsApp (isteğe bağlı)" value={form.whatsappNumber} onChangeText={set('whatsappNumber')} keyboardType="phone-pad" />
      <TextField label="Adres" value={form.address} onChangeText={set('address')} multiline maxLength={300} />
      <TextField label="Şehir" value={form.city} onChangeText={set('city')} maxLength={40} />
      <Card>
        <SwitchRow
          label="Müşteri çalışan seçebilsin"
          hint="Kapalıysa online randevuda çalışan otomatik atanır."
          value={form.enableStaffSelection}
          onValueChange={set('enableStaffSelection')}
        />
      </Card>
      <Text style={typography.caption}>Online sayfanız: /{data.slug}</Text>

      <InlineError message={formError ?? save.error} />
      {saved ? <Text style={[typography.label, { color: colors.brand }]}>Kaydedildi.</Text> : null}
      <Button label="Kaydet" onPress={submit} busy={save.busy} />
    </Page>
  );
}

const useStyles = makeStyles((colors) => ({
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  logo: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  logoEmpty: { borderWidth: 1, borderColor: colors.line, borderStyle: 'dashed' },
  flex: { flex: 1 },
}));
