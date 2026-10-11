import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { Screen } from '@/components/Screen';
import { colors, radius, spacing, typography } from '@/theme';

export default function MoreScreen() {
  const { profile, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const confirmSignOut = () =>
    Alert.alert('Çıkış yap', 'Bu cihazdaki oturumunuz kapatılacak.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Çıkış yap',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          // Local sign-out always succeeds; the guard then returns to the login screen.
          await signOut();
        },
      },
    ]);

  return (
    <Screen title="Diğer" subtitle="Hesap ve işletme">
      {profile ? (
        <View style={styles.card}>
          <Row label="İşletme" value={profile.business.name} />
          <Row label="Ad soyad" value={profile.user.name} />
          <Row label="E-posta" value={profile.user.email} />
        </View>
      ) : null}

      <Pressable
        onPress={confirmSignOut}
        disabled={signingOut}
        accessibilityRole="button"
        accessibilityState={{ busy: signingOut }}
        style={({ pressed }) => [styles.signOut, pressed && styles.signOutPressed]}>
        {signingOut ? <ActivityIndicator color={colors.danger} /> : <Text style={styles.signOutText}>Çıkış yap</Text>}
      </Pressable>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={typography.caption}>{label}</Text>
      <Text style={typography.heading} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  row: { gap: spacing.xs },
  signOut: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
  },
  signOutPressed: { opacity: 0.8 },
  signOutText: { ...typography.heading, color: colors.danger },
});
