import type { ReactNode } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Backdrop } from '@/components/Backdrop';
import { useDrawer } from '@/components/Drawer';
import { Icon, icons } from '@/components/Icon';
import { accentColors, elevation, makeStyles, radius, spacing, useTheme, type Accent } from '@/theme';
import { t } from '@/i18n';

type ScreenProps = {
  title: string;
  /** Shown above the title as a small eyebrow in the screen's accent (e.g. today's date). */
  subtitle?: string;
  children?: ReactNode;
  /** Enables pull-to-refresh when given. */
  onRefresh?: () => void;
  refreshing?: boolean;
  /** Extra button(s) on the right of the top bar. */
  right?: ReactNode;
  /** The screen's color: the glow behind it and its eyebrow. */
  accent?: Accent;
};

/** Main (tab) screen frame: dot-grid backdrop, top bar with the menu button, eyebrow + large title, animated-in content. */
export function Screen({ title, subtitle, children, onRefresh, refreshing = false, right, accent = 'brand' }: ScreenProps) {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  const drawer = useDrawer();
  const tint = accentColors(colors, accent).fg;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Backdrop accent={accent} />
      <View style={styles.bar}>
        <Pressable
          onPress={drawer.open}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t('Menüyü aç')}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <Icon name={icons.menu} size={20} color={colors.ink} />
        </Pressable>
        <View style={styles.flex} />
        {right}
      </View>
      {/* iOS: inset by the native tab bar explicitly, so the last button can always scroll above it. */}
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tint} colors={[tint]} /> : undefined
        }>
        <Animated.View entering={FadeInDown.duration(320)} style={styles.header}>
          {subtitle ? (
            <View style={styles.eyebrowRow}>
              <View style={[styles.eyebrowLine, { backgroundColor: tint }]} />
              <Text style={[styles.eyebrow, { color: tint }]} numberOfLines={1}>
                {subtitle}
              </Text>
            </View>
          ) : null}
          <Text style={typography.display} accessibilityRole="header">
            {title}
          </Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(80).duration(380)} style={styles.body}>
          {children}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

/** Round icon button for the top bar (e.g. "+" on the calendar). `primary` fills it with the brand color. */
export function BarButton({ icon, label, onPress, primary }: { icon: keyof typeof icons; label: string; onPress: () => void; primary?: boolean }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.iconButton, primary && styles.primary, pressed && styles.pressed]}>
      <Icon name={icons[icon]} size={19} color={primary ? colors.onBrand : colors.ink} />
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  safe: { flex: 1, backgroundColor: colors.canvas },
  bar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
  iconButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    ...elevation(colors),
  },
  primary: { backgroundColor: colors.brand, borderColor: colors.brand },
  pressed: { opacity: 0.75, transform: [{ scale: 0.96 }] },
  flex: { flex: 1 },
  // Extra bottom room: the floating tab bar (iOS 26) and its shadow sit over the last few points of content.
  content: { padding: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl + spacing.xl, gap: spacing.xl },
  header: { gap: spacing.sm },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  eyebrowLine: { width: 18, height: 2, borderRadius: 1 },
  eyebrow: { fontSize: 13, lineHeight: 18, fontWeight: '700', letterSpacing: 0.2, flexShrink: 1 },
  body: { gap: spacing.xl },
}));
