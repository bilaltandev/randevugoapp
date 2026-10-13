import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import logoMark from '../../assets/images/logo-mark.png';

import { makeStyles, spacing, useTheme } from '@/theme';

/** Full-screen frame (no menu, no tabs) for the welcome and lock screens. */
export function GateFrame({
  title,
  subtitle,
  children,
  onRefresh,
  refreshing = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} colors={[colors.brand]} /> : undefined
        }>
        <Animated.View entering={FadeInDown.duration(320)} style={styles.header}>
          <Image source={logoMark} style={styles.logo} contentFit="contain" alt="" />
          <Text style={[typography.title, styles.center]}>{title}</Text>
          {subtitle ? <Text style={[typography.body, styles.center]}>{subtitle}</Text> : null}
        </Animated.View>
        <View style={styles.body}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((colors) => ({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.xl },
  header: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.lg },
  logo: { width: 64, height: 64, marginBottom: spacing.xs },
  center: { textAlign: 'center' },
  body: { gap: spacing.lg },
}));
