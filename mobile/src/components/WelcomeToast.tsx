import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, icons } from '@/components/Icon';
import { elevation, makeStyles, radius, spacing, useTheme } from '@/theme';
import { t } from '@/i18n';

const SHOW_MS = 3500;

function greeting(hour: number) {
  if (hour >= 5 && hour < 12) return t('Günaydın');
  if (hour >= 12 && hour < 18) return t('İyi günler');
  return t('İyi akşamlar');
}

/**
 * A short welcome that slides down from the top once each time the app opens (and after signing in),
 * then leaves on its own after a few seconds. Tapping it closes it early.
 */
export function WelcomeToast({ show, name, business }: { show: boolean; name?: string; business?: string }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  // Once per session in memory: a cold start or a new sign-in shows it again.
  const shownFor = useRef<string | null>(null);

  useEffect(() => {
    if (!show) {
      // Leaving the app (signing out) hides it and lets the next sign-in greet again.
      shownFor.current = null;
      setVisible(false);
      return;
    }
    if (!name || shownFor.current === name) return;
    shownFor.current = name;
    setVisible(true);
  }, [show, name]);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setVisible(false), SHOW_MS);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;
  const firstName = name?.trim().split(/\s+/)[0] ?? '';

  return (
    <Animated.View
      entering={SlideInUp.springify().damping(18)}
      exiting={SlideOutUp.duration(260)}
      style={[styles.wrap, { top: insets.top + spacing.sm }]}
      accessibilityLiveRegion="polite">
      <Pressable onPress={() => setVisible(false)} accessibilityRole="button" style={styles.card}>
        <View style={[styles.icon, { backgroundColor: colors.brand }]}>
          <Icon name={icons.sparkles} size={18} color={colors.onBrand} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.title} numberOfLines={1}>
            {`${greeting(new Date().getHours())}, ${firstName} 👋`}
          </Text>
          {business ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {t('{0} paneline hoş geldiniz.', business)}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const useStyles = makeStyles((colors, typography) => ({
  wrap: { position: 'absolute', start: spacing.lg, end: spacing.lg, zIndex: 100 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.brandLine,
    backgroundColor: colors.surface,
    ...elevation(colors, 2),
  },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: 1 },
  title: { ...typography.heading, fontWeight: '700' },
  subtitle: typography.caption,
}));
