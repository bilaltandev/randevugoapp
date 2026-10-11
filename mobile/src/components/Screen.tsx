import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, typography } from '@/theme';

type ScreenProps = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  /** Enables pull-to-refresh when given. */
  onRefresh?: () => void;
  refreshing?: boolean;
};

/** Shared tab-screen frame: safe area, large title and scrollable content. */
export function Screen({ title, subtitle, children, onRefresh, refreshing = false }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} colors={[colors.brand]} /> : undefined
        }>
        <View style={styles.header}>
          <Text style={typography.display} accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? <Text style={typography.body}>{subtitle}</Text> : null}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.lg, gap: spacing.xl },
  header: { gap: spacing.xs, paddingTop: spacing.sm },
});
