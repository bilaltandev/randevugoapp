import type { ReactNode } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDrawer } from '@/components/Drawer';
import { Icon, icons } from '@/components/Icon';
import { makeStyles, radius, spacing, useTheme } from '@/theme';

type ScreenProps = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  /** Enables pull-to-refresh when given. */
  onRefresh?: () => void;
  refreshing?: boolean;
  /** Extra button(s) on the right of the top bar. */
  right?: ReactNode;
};

/** Main (tab) screen frame: top bar with the menu button, large title and scrollable, animated-in content. */
export function Screen({ title, subtitle, children, onRefresh, refreshing = false, right }: ScreenProps) {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  const drawer = useDrawer();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.bar}>
        <Pressable
          onPress={drawer.open}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Menüyü aç"
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <Icon name={icons.menu} size={22} color={colors.ink} />
        </Pressable>
        <View style={styles.flex} />
        {right}
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} colors={[colors.brand]} /> : undefined
        }>
        <Animated.View entering={FadeInDown.duration(280)} style={styles.header}>
          <Text style={typography.display} accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? <Text style={typography.body}>{subtitle}</Text> : null}
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(70).duration(320)} style={styles.body}>
          {children}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

/** Round icon button for the top bar (e.g. "+" on the calendar). */
export function BarButton({ icon, label, onPress }: { icon: keyof typeof icons; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
      <Icon name={icons[icon]} size={20} color={colors.ink} />
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  safe: { flex: 1, backgroundColor: colors.canvas },
  bar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.7 },
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.xl },
  header: { gap: spacing.xs },
  body: { gap: spacing.xl },
}));
