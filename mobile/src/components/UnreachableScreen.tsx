import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { colors, radius, spacing, typography } from '@/theme';

/** Shown at launch when a saved session exists but the server can't be reached. Nothing is signed out. */
export function UnreachableScreen() {
  const { retryRestore, signOut } = useAuth();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={typography.title}>Sunucuya ulaşılamadı</Text>
        <Text style={typography.body}>
          İnternet bağlantınızı kontrol edip tekrar deneyin. Oturumunuz bu cihazda kayıtlı duruyor.
        </Text>
        <Pressable
          onPress={retryRestore}
          accessibilityRole="button"
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
          <Text style={styles.buttonText}>Tekrar dene</Text>
        </Pressable>
        <Pressable onPress={signOut} accessibilityRole="button" style={styles.linkButton}>
          <Text style={styles.link}>Çıkış yap</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  container: { flex: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.lg },
  button: {
    height: 52,
    marginTop: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.brand,
  },
  buttonPressed: { backgroundColor: colors.brandHover },
  buttonText: { ...typography.heading, color: colors.onBrand },
  linkButton: { alignItems: 'center', padding: spacing.sm },
  link: { ...typography.label, color: colors.ink3 },
});
