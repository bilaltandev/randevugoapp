import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Backdrop } from '@/components/Backdrop';
import { Icon, icons, type IconName } from '@/components/Icon';

import { elevation, makeStyles, radius, spacing, useTheme, type Colors } from '@/theme';

// Building blocks for the stack screens (lists and forms under a native header).

/** Scrollable page under a native header. Pull-to-refresh when `onRefresh` is given. */
export function Page({ children, onRefresh, refreshing = false }: { children: ReactNode; onRefresh?: () => void; refreshing?: boolean }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Backdrop />
      <ScrollView
        contentContainerStyle={styles.page}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        refreshControl={
          onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} colors={[colors.brand]} /> : undefined
        }>
        <Animated.View entering={FadeIn.duration(240)} style={styles.pageInner}>
          {children}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: object }) {
  const styles = useStyles();
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children, hint }: { children: string; hint?: string }) {
  const { typography } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.sectionTitle}>
      <Text style={typography.heading}>{children}</Text>
      {hint ? <Text style={typography.caption}>{hint}</Text> : null}
    </View>
  );
}

type FieldProps = TextInputProps & { label: string; hint?: string };

export function TextField({ label, hint, style, multiline, ...input }: FieldProps) {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.field}>
      <Text style={typography.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.ink3}
        selectionColor={colors.brand}
        multiline={multiline}
        style={[styles.input, multiline && styles.inputMultiline, style]}
        {...input}
      />
      {hint ? <Text style={typography.caption}>{hint}</Text> : null}
    </View>
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: keyof typeof icons;
};

export function Button({ label, onPress, busy, disabled, variant = 'primary', icon }: ButtonProps) {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  const tone = buttonTones(colors)[variant];
  const inactive = disabled || busy;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!busy }}
      style={({ pressed }) => [styles.button, tone.box, pressed && styles.pressed, disabled && styles.disabled]}>
      {busy ? (
        <ActivityIndicator color={tone.text} />
      ) : (
        <>
          {icon ? <Icon name={icons[icon]} size={18} color={tone.text} /> : null}
          <Text style={[typography.heading, { color: tone.text }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const buttonTones = (colors: Colors) => ({
  // The primary button glows faintly in its own color.
  primary: {
    box: { backgroundColor: colors.brand, shadowColor: colors.brand, shadowOpacity: 0.3, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
    text: colors.onBrand,
  },
  secondary: { box: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, ...elevation(colors) }, text: colors.ink },
  danger: { box: { backgroundColor: colors.dangerSoft, borderWidth: 1, borderColor: colors.danger }, text: colors.danger },
});

/** Small text button for the native header (e.g. "Ekle", "Kaydet"). */
export function HeaderButton({ label, onPress, disabled, icon = 'add' }: { label: string; onPress: () => void; disabled?: boolean; icon?: keyof typeof icons }) {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  return (
    <Pressable onPress={onPress} disabled={disabled} hitSlop={12} accessibilityRole="button" style={[styles.headerButton, disabled && styles.disabled]}>
      <Icon name={icons[icon]} size={17} color={colors.brand} />
      <Text style={[typography.heading, { color: colors.brand }]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress, disabled }: { label: string; selected: boolean; onPress: () => void; disabled?: boolean }) {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: !!disabled }}
      style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed, disabled && styles.disabled]}>
      <Text style={[typography.label, { color: selected ? colors.onBrand : colors.ink2 }]}>{label}</Text>
    </Pressable>
  );
}

export function ChipRow({ children }: { children: ReactNode }) {
  const styles = useStyles();
  return <View style={styles.chipRow}>{children}</View>;
}

export function SwitchRow({ label, hint, value, onValueChange }: { label: string; hint?: string; value: boolean; onValueChange: (v: boolean) => void }) {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.switchRow}>
      <View style={styles.flex}>
        <Text style={[typography.body, { color: colors.ink }]}>{label}</Text>
        {hint ? <Text style={typography.caption}>{hint}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: colors.brand, false: colors.lineStrong }}
        thumbColor={colors.ink}
        accessibilityLabel={label}
      />
    </View>
  );
}

type ListRowProps = {
  title: string;
  subtitle?: string;
  meta?: string;
  onPress?: () => void;
  muted?: boolean;
  right?: ReactNode;
  /** Leading icon in a tinted tile. */
  icon?: IconName;
  /** Tile color for the icon (defaults to the brand green). */
  iconColor?: string;
  iconBackground?: string;
  /** Trailing chevron on tappable rows; off for choice lists that show a check instead. */
  chevron?: boolean;
  /** Inside a ListGroup: no card of its own. */
  flat?: boolean;
};

export function ListRow({ title, subtitle, meta, onPress, muted, right, icon, iconColor, iconBackground, chevron = true, flat }: ListRowProps) {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [flat ? styles.rowFlat : styles.row, pressed && onPress && styles.rowPressed, muted && styles.muted]}>
      {icon ? (
        <View style={[styles.rowIcon, iconBackground ? { backgroundColor: iconBackground } : null]}>
          <Icon name={icon} size={18} color={iconColor ?? colors.brand} />
        </View>
      ) : null}
      <View style={styles.flex}>
        <Text style={typography.heading} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={typography.body} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {meta ? <Text style={typography.label}>{meta}</Text> : null}
      {right}
      {onPress && chevron ? <Icon name={icons.chevronRight} size={16} color={colors.ink3} /> : null}
    </Pressable>
  );
}

/** Settings-style group: one card with its (flat) rows separated by hairlines. */
export function ListGroup({ children }: { children: ReactNode }) {
  const styles = useStyles();
  const rows = Children.toArray(children).filter(isValidElement);
  return (
    <View style={styles.group}>
      {rows.map((row, i) => (
        <Fragment key={row.key ?? i}>
          {i > 0 ? <View style={styles.groupDivider} /> : null}
          {row}
        </Fragment>
      ))}
    </View>
  );
}

export function InlineError({ message }: { message: string | null }) {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  if (!message) return null;
  return (
    <View style={styles.error} accessibilityRole="alert">
      <Text style={[typography.label, { color: colors.danger }]}>{message}</Text>
    </View>
  );
}

export function Pill({ label, tone = 'muted' }: { label: string; tone?: 'muted' | 'brand' | 'danger' }) {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  const t = { muted: [colors.ink3, colors.surfaceMuted], brand: [colors.brandInk, colors.brandSoft], danger: [colors.danger, colors.dangerSoft] }[tone];
  return (
    <View style={[styles.pill, { backgroundColor: t[1] }]}>
      <Text style={[typography.caption, { color: t[0], fontWeight: '600' }]}>{label}</Text>
    </View>
  );
}

const useStyles = makeStyles((colors, typography) => ({
  safe: { flex: 1, backgroundColor: colors.canvas },
  page: { padding: spacing.lg, paddingBottom: spacing.xxl },
  pageInner: { gap: spacing.lg },
  headerButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.brandSoft },
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    ...elevation(colors),
  },
  sectionTitle: { gap: 2, marginTop: spacing.sm },
  field: { gap: spacing.xs },
  input: {
    ...typography.body,
    color: colors.ink,
    minHeight: 50,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  inputMultiline: { minHeight: 96, textAlignVertical: 'top', paddingTop: spacing.md },
  button: { height: 54, flexDirection: 'row', gap: spacing.sm, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.45 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.brand, borderColor: colors.brand },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1, gap: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    ...elevation(colors),
  },
  rowFlat: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md + 2 },
  rowPressed: { backgroundColor: colors.surfaceMuted },
  group: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...elevation(colors),
  },
  groupDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginStart: spacing.lg + 38 + spacing.md },
  muted: { opacity: 0.55 },
  error: { padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.danger, backgroundColor: colors.dangerSoft },
  pill: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill },
}));
