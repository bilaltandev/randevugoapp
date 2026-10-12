import { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, icons } from '@/components/Icon';
import { StatusBadge } from '@/components/StatusBadge';
import {
  availableActions,
  formatPrice,
  sectorDetails,
  shortDateFromKey,
  type Appointment,
  type AppointmentStatus,
  type StatusAction,
} from '@/lib/appointments';
import { makeStyles, radius, spacing, useTheme } from '@/theme';

type Props = {
  appointment: Appointment | null;
  onClose: () => void;
  onChangeStatus: (id: string, status: AppointmentStatus) => Promise<void>;
};

/** Appointment details with the status actions the web panel offers (Onayla / Tamamla / İptal et). */
export function AppointmentSheet({ appointment, onClose, onChangeStatus }: Props) {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  const [busy, setBusy] = useState<AppointmentStatus | null>(null);
  const a = appointment;

  const run = async (action: StatusAction) => {
    if (!a) return;
    setBusy(action.status);
    try {
      await onChangeStatus(a.id, action.status);
      onClose();
    } catch (e) {
      Alert.alert('İşlem tamamlanamadı', (e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const confirmThenRun = (action: StatusAction) => {
    if (!action.destructive) return run(action);
    Alert.alert(action.label, a?.isBlockedSlot ? 'Bu saat tekrar rezervasyona açılacak.' : 'Randevu iptal edilecek.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: action.label, style: 'destructive', onPress: () => run(action) },
    ]);
  };

  return (
    <Modal visible={!!a} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      {a ? (
        <SafeAreaView style={styles.safe} edges={['bottom']}>
          <View style={styles.header}>
            <Text style={typography.title} numberOfLines={1}>
              {a.isBlockedSlot ? 'Kapalı saat' : a.customerName}
            </Text>
            <Pressable onPress={onClose} accessibilityRole="button" hitSlop={12}>
              <Icon name={icons.close} size={20} color={colors.ink2} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <StatusBadge appointment={a} />
            <View style={styles.card}>
              <Row label="Tarih" value={`${shortDateFromKey(a.date)} · ${a.startTime}–${a.endTime}`} />
              {a.service ? <Row label="Hizmet" value={a.service.name} /> : null}
              {a.employee ? <Row label="Çalışan" value={a.employee.name} /> : null}
              {!a.isBlockedSlot ? <Row label="Ücret" value={formatPrice(a.price)} /> : null}
              {sectorDetails(a.sectorData).map((d) => (
                <Row key={d} label="Detay" value={d} />
              ))}
              {a.notes ? <Row label="Not" value={a.notes} /> : null}
            </View>

            {!a.isBlockedSlot ? (
              <View style={styles.card}>
                <Row label="Telefon" value={a.customerPhone} />
                {a.customerEmail ? <Row label="E-posta" value={a.customerEmail} /> : null}
                <Pressable
                  onPress={() => Linking.openURL(`tel:${a.customerPhone.replace(/[^\d+]/g, '')}`)}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
                  <Icon name={icons.phone} size={16} color={colors.brand} />
                  <Text style={[typography.label, { color: colors.ink }]}>Müşteriyi ara</Text>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.actions}>
              {availableActions(a).map((action) => (
                <Pressable
                  key={action.status}
                  onPress={() => confirmThenRun(action)}
                  disabled={busy !== null}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.action,
                    action.destructive ? styles.destructive : styles.primary,
                    pressed && styles.pressed,
                    busy !== null && busy !== action.status && styles.disabled,
                  ]}>
                  {busy === action.status ? (
                    <ActivityIndicator color={action.destructive ? colors.danger : colors.onBrand} />
                  ) : (
                    <>
                      <Icon
                        name={action.status === 'CONFIRMED' ? icons.check : action.status === 'COMPLETED' ? icons.checkCircle : icons.cancel}
                        size={18}
                        color={action.destructive ? colors.danger : colors.onBrand}
                      />
                      <Text style={[typography.heading, { color: action.destructive ? colors.danger : colors.onBrand }]}>{action.label}</Text>
                    </>
                  )}
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      ) : null}
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <Text style={typography.caption}>{label}</Text>
      <Text style={[typography.body, { color: colors.ink }]}>{value}</Text>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  safe: { flex: 1, backgroundColor: colors.canvas },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.lg, padding: spacing.xl },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl, gap: spacing.lg },
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  row: { gap: 2 },
  secondary: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  actions: { gap: spacing.md },
  action: { height: 52, flexDirection: 'row', gap: spacing.sm, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md },
  primary: { backgroundColor: colors.brand },
  destructive: { borderWidth: 1, borderColor: colors.danger, backgroundColor: colors.dangerSoft },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.5 },
}));
