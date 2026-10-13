import { useState } from 'react';
import { Modal, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Plan } from '@/api/business';
import { checkCoupon, requestPayment, type BillingPeriod, type SubscriptionInfo } from '@/api/panel';
import { Icon, icons } from '@/components/Icon';
import { Button, Card, Chip, ChipRow, InlineError, TextField } from '@/components/ui';
import { useApiMutation } from '@/hooks/useApiQuery';
import { BILLING_PERIODS, formatTry, formatUsd, periodName, periodSuffix, priceFor, usdToTry, yearlySaving } from '@/lib/plans';
import { localeTag, t } from '@/i18n';
import { makeStyles, radius, spacing, useTheme } from '@/theme';

export const PLAN_INFO: Record<Plan, { name: string; tagline: string; features: string[] }> = {
  PERSON: {
    name: 'Person',
    tagline: t('Tek başına çalışanlar için'),
    features: [t('Sınırsız online randevu'), t('Kendi rezervasyon sayfanız'), t('Müşteri yönetimi'), t('Mobil uygulama')],
  },
  TEAM: {
    name: 'Team',
    tagline: t('Ekibiyle çalışan işletmeler için'),
    features: [
      t('Person paketindeki her şey'),
      t('Ekibinizi davet edin (5 üyeye kadar)'),
      t('Her üye kendi randevularını görür'),
      t('Ücreti yalnızca siz ödersiniz'),
    ],
  },
};

const PLANS: Plan[] = ['PERSON', 'TEAM'];

/**
 * Plan cards with "Satın al" (bank transfer: the owner sends the amount, then notifies; the admin confirms)
 * and, while a notice is open, its status. Used by the welcome, lock and subscription screens.
 */
export function PlanPurchase({
  info,
  onChanged,
  selected,
  onSelect,
}: {
  info: SubscriptionInfo;
  /** After a payment notice was sent: reload the data. */
  onChanged: () => void;
  selected: Plan;
  onSelect: (plan: Plan) => void;
}) {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  const [checkout, setCheckout] = useState<Plan | null>(null);
  const [period, setPeriod] = useState<BillingPeriod>(info.billingPeriod ?? 'MONTHLY');
  const currentPlan: Plan = info.plan === 'TEAM' ? 'TEAM' : 'PERSON';
  const priceOf = (plan: Plan) => priceFor(info, plan, period);

  return (
    <View style={styles.gap}>
      {info.payment ? <PendingPayment info={info} plan={currentPlan} /> : null}

      <ChipRow>
        {BILLING_PERIODS.map((option) => (
          <Chip
            key={option}
            label={option === 'YEARLY' ? t('{0} · %{1} indirim', periodName(option), yearlySaving(info, 'PERSON')) : periodName(option)}
            selected={period === option}
            onPress={() => setPeriod(option)}
          />
        ))}
      </ChipRow>

      <View style={styles.gap} accessibilityRole="radiogroup">
        {PLANS.map((plan) => {
          const active = plan === selected;
          return (
            <Pressable
              key={plan}
              onPress={() => onSelect(plan)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              style={[styles.plan, active && styles.planActive]}>
              <View style={styles.row}>
                <View style={styles.flex}>
                  <Text style={typography.title}>{PLAN_INFO[plan].name}</Text>
                  <Text style={typography.caption}>{PLAN_INFO[plan].tagline}</Text>
                </View>
                <Text style={[typography.title, { color: colors.ink }]}>{formatUsd(priceOf(plan))}</Text>
              </View>
              <Text style={[typography.caption, styles.perMonth]}>
                {period === 'YEARLY' ? t('{0} · ayda {1}', periodSuffix(period), formatUsd(priceOf(plan) / 12)) : periodSuffix(period)}
              </Text>
              <View style={styles.features}>
                {PLAN_INFO[plan].features.map((feature) => (
                  <View key={feature} style={styles.feature}>
                    <Icon name={icons.check} size={15} color={colors.brand} />
                    <Text style={[typography.body, styles.flex]}>{feature}</Text>
                  </View>
                ))}
              </View>
              <Button label={t('Satın al')} variant={active ? 'primary' : 'secondary'} onPress={() => setCheckout(plan)} />
            </Pressable>
          );
        })}
      </View>

      <CheckoutSheet
        plan={checkout}
        period={period}
        price={checkout ? priceOf(checkout) : 0}
        info={info}
        onClose={() => setCheckout(null)}
        onSent={() => {
          setCheckout(null);
          onChanged();
        }}
      />
    </View>
  );
}

function PendingPayment({ info, plan }: { info: SubscriptionInfo; plan: Plan }) {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  const payment = info.payment!;
  const amount = formatUsd(payment.amount) + (payment.amountTry ? ` (${formatTry(payment.amountTry)})` : '');
  return (
    <Card style={styles.pending}>
      <View style={styles.row}>
        <Icon name={icons.clock} size={18} color={colors.pending} />
        <Text style={[typography.heading, styles.flex]}>{t('Ödemeniz kontrol ediliyor')}</Text>
      </View>
      <Text style={typography.body}>
        {t('{0} paketi için {1} havale bildiriminiz {2} tarihinde alındı. Ödeme onaylanınca aboneliğiniz otomatik olarak aktif olur.',
          `${PLAN_INFO[plan].name} (${periodName(payment.billingPeriod ?? info.billingPeriod ?? 'MONTHLY').toLocaleLowerCase(localeTag())})`,
          amount,
          new Date(payment.requestedAt).toLocaleDateString(localeTag()))}
      </Text>
      <BankDetails info={info} />
    </Card>
  );
}

function BankDetails({ info }: { info: SubscriptionInfo }) {
  const { typography } = useTheme();
  const styles = useStyles();
  if (!info.bank) {
    return <Text style={typography.body}>{t('Banka bilgileri henüz eklenmedi. Lütfen destek talebi oluşturun, size hemen iletelim.')}</Text>;
  }
  const rows: [string, string][] = [
    [t('Alıcı'), info.bank.accountName],
    [t('Banka'), info.bank.bankName],
    ['IBAN', info.bank.iban],
    [t('Açıklama'), info.reference ?? ''],
  ];
  const share = () =>
    Share.share({
      message: rows
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n'),
    }).catch(() => {});
  return (
    <View style={styles.bank}>
      {rows
        .filter(([, value]) => value)
        .map(([label, value]) => (
          <View key={label} style={styles.bankRow}>
            <Text style={typography.caption}>{label}</Text>
            <Text selectable style={[typography.label, styles.bankValue]}>
              {value}
            </Text>
          </View>
        ))}
      <Pressable onPress={share} hitSlop={8} accessibilityRole="button" style={styles.shareRow}>
        <Icon name={icons.share} size={15} color={styles.shareText.color} />
        <Text style={[typography.label, styles.shareText]}>{t('Bilgileri kopyala / paylaş')}</Text>
      </Pressable>
    </View>
  );
}

function CheckoutSheet({
  plan,
  period,
  price,
  info,
  onClose,
  onSent,
}: {
  plan: Plan | null;
  period: BillingPeriod;
  price: number;
  info: SubscriptionInfo;
  onClose: () => void;
  onSent: () => void;
}) {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  const send = useApiMutation();
  const couponCheck = useApiMutation();
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState<{ code: string; percentOff: number } | null>(null);
  const percent = info.activeDiscount?.percentOff ?? coupon?.percentOff ?? 0;
  const amount = percent ? Math.round(price * (100 - percent)) / 100 : price;

  const applyCoupon = () =>
    couponCheck.run(async (client) => {
      const result = await checkCoupon(client, couponInput.trim());
      setCoupon({ code: result.code, percentOff: result.percentOff });
    });

  const submit = async () => {
    if (!plan) return;
    if (await send.run((client) => requestPayment(client, plan, period, coupon?.code))) onSent();
  };

  return (
    <Modal visible={plan !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.sheet} edges={['top', 'bottom']}>
        <View style={styles.sheetHeader}>
          <Text style={[typography.heading, styles.flex]}>
            {plan ? t('{0} paketi · Havale/EFT', `${PLAN_INFO[plan].name} ${periodName(period)}`) : ''}
          </Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel={t('Kapat')}>
            <Icon name={icons.close} size={20} color={colors.ink3} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.sheetBody} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
          <View style={[styles.row, styles.amount]}>
            <Text style={[typography.body, styles.flex]}>{period === 'YEARLY' ? t('Ödenecek tutar (1 yıl)') : t('Ödenecek tutar (1 ay)')}</Text>
            <Text style={[typography.title, { color: colors.ink }]}>{formatUsd(amount)}</Text>
          </View>
          <Text style={typography.caption}>
            {info.rate
              ? t('Havale tutarı: {0} (TCMB döviz satış kuru {1}{2}). Kesin tutar bildirimi gönderdiğiniz andaki kurla sabitlenir.',
                  formatTry(usdToTry(amount, info.rate.rate)),
                  info.rate.rate.toLocaleString('tr-TR', { maximumFractionDigits: 4 }),
                  info.rate.date ? `, ${info.rate.date}` : '')
              : t('Güncel kur şu an alınamadı; bildirim gönderilirken o günün kuruyla TL tutarı hesaplanır.')}
          </Text>

          {!info.activeDiscount &&
            (coupon ? (
              <Text style={[typography.label, { color: colors.brandInk }]}>
                {t('{0} kodu ile %{1} indirim uygulandı.', coupon.code, coupon.percentOff)}
              </Text>
            ) : (
              <View style={styles.gapSm}>
                <TextField
                  label={t('İndirim kodu (isteğe bağlı)')}
                  value={couponInput}
                  onChangeText={setCouponInput}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
                {couponInput.trim() ? (
                  <Button label={t('Kodu uygula')} variant="secondary" onPress={applyCoupon} busy={couponCheck.busy} />
                ) : null}
                <InlineError message={couponCheck.error} />
              </View>
            ))}

          <Text style={typography.heading}>{t('1. Tutarı bu hesaba gönderin')}</Text>
          <BankDetails info={info} />

          <Text style={typography.heading}>{t('2. Ödeme bildirimini gönderin')}</Text>
          <Text style={typography.body}>
            {t('Açıklamaya {0} kodunu yazmayı unutmayın. Ödemeniz onaylanınca aboneliğiniz 30 gün için aktif olur.', info.reference ?? '')}
          </Text>

          <InlineError message={send.error} />
          <Button label={t('Ödemeyi yaptım, bildirimi gönder')} onPress={submit} busy={send.busy} disabled={!info.bank} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const useStyles = makeStyles((colors) => ({
  gap: { gap: spacing.md },
  gapSm: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  plan: { gap: spacing.sm, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  planActive: { borderColor: colors.brand, borderWidth: 2 },
  perMonth: { marginTop: -spacing.sm, textAlign: 'right' },
  features: { gap: spacing.xs, marginBottom: spacing.xs },
  feature: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  pending: { gap: spacing.sm, borderColor: colors.pending },
  bank: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  bankRow: { gap: 2, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.line },
  bankValue: { color: colors.ink, fontVariant: ['tabular-nums'] },
  shareRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.sm },
  shareText: { color: colors.brand },
  sheet: { flex: 1, backgroundColor: colors.canvas },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.surface,
  },
  sheetBody: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  amount: { padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
}));
