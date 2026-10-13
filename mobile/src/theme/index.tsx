import { DarkTheme, DefaultTheme, type Theme } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as SystemUI from 'expo-system-ui';
import { createContext, use, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform, StyleSheet, useColorScheme, type TextStyle } from 'react-native';

/**
 * CalendlyGo palettes. Values mirror the web app's tokens in `src/app/globals.css`
 * (`:root` = light, `.dark` = dark) so both clients read as one product.
 */
const light = {
  canvas: '#F5F6F8',
  surface: '#FFFFFF',
  surfaceMuted: '#F0F2F5',
  line: '#E6E8EC',
  lineStrong: '#D0D5DD',

  ink: '#0D1117',
  ink2: '#454E5C',
  ink3: '#687180',

  brand: '#0A7B5C',
  brandHover: '#086A4F',
  brandSoft: '#EAF6F1',
  brandLine: '#B5E0CF',
  brandInk: '#075A43',
  onBrand: '#FFFFFF',

  pending: '#B45309',
  pendingSoft: '#FFFBEB',
  danger: '#B91C1C',
  dangerSoft: '#FEF2F2',

  /** Dimmed backdrop behind the drawer and sheets. */
  scrim: 'rgba(13, 17, 23, 0.45)',
  /** Secondary series in charts. */
  chart2: '#2563EB',
  chart3: '#B45309',
};

export type Colors = typeof light;

const dark: Colors = {
  canvas: '#0B0E13',
  surface: '#12161D',
  surfaceMuted: '#181D26',
  line: '#232A36',
  lineStrong: '#313A49',

  ink: '#EEF1F5',
  ink2: '#B9C1CE',
  ink3: '#8A94A4',

  brand: '#2BBF8E',
  brandHover: '#4FD3A5',
  brandSoft: 'rgba(43, 191, 142, 0.12)',
  brandLine: 'rgba(43, 191, 142, 0.34)',
  brandInk: '#7FE3BF',
  /** The bright emerald needs dark text; white on it is ~2.4:1. */
  onBrand: '#04261B',

  pending: '#FBBF24',
  pendingSoft: 'rgba(251, 191, 36, 0.12)',
  danger: '#F87171',
  dangerSoft: 'rgba(248, 113, 113, 0.12)',

  scrim: 'rgba(0, 0, 0, 0.6)',
  chart2: '#60A5FA',
  chart3: '#FBBF24',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

/** Platform system fonts (SF Pro / Roboto): modern, legible and no font download. */
const fontFamily = Platform.select({ ios: 'System', default: undefined });

function makeTypography(c: Colors) {
  const text = (size: number, lineHeight: number, weight: TextStyle['fontWeight'], extra?: TextStyle): TextStyle => ({
    fontFamily,
    fontSize: size,
    lineHeight,
    fontWeight: weight,
    color: c.ink,
    ...extra,
  });
  return {
    display: text(30, 36, '700', { letterSpacing: -0.6 }),
    title: text(22, 28, '700', { letterSpacing: -0.3 }),
    heading: text(17, 22, '600'),
    body: text(15, 21, '400', { color: c.ink2 }),
    label: text(13, 18, '600', { color: c.ink2 }),
    caption: text(12, 16, '500', { color: c.ink3 }),
  };
}

export type Typography = ReturnType<typeof makeTypography>;
export type ThemePreference = 'system' | 'light' | 'dark';

type ThemeValue = {
  colors: Colors;
  typography: Typography;
  scheme: 'light' | 'dark';
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
  navigationTheme: Theme;
};

const THEMES = {
  light: { colors: light, typography: makeTypography(light) },
  dark: { colors: dark, typography: makeTypography(dark) },
};

const PREF_KEY = 'randevugo.theme';
const ThemeContext = createContext<ThemeValue | null>(null);

/** Follows the phone's light/dark setting unless the user picked one in Profil (stored on the device). */
export function AppThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [preference, setPref] = useState<ThemePreference>('system');

  useEffect(() => {
    SecureStore.getItemAsync(PREF_KEY)
      .then((v) => {
        if (v === 'light' || v === 'dark' || v === 'system') setPref(v);
      })
      .catch(() => {});
  }, []);

  const scheme: 'light' | 'dark' = preference === 'system' ? (system === 'light' ? 'light' : 'dark') : preference;

  useEffect(() => {
    // Root view color shows during transitions and behind the keyboard.
    SystemUI.setBackgroundColorAsync(THEMES[scheme].colors.canvas).catch(() => {});
  }, [scheme]);

  const value = useMemo<ThemeValue>(() => {
    const { colors, typography } = THEMES[scheme];
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      colors,
      typography,
      scheme,
      preference,
      setPreference: (p) => {
        setPref(p);
        SecureStore.setItemAsync(PREF_KEY, p).catch(() => {});
      },
      navigationTheme: {
        ...base,
        colors: {
          ...base.colors,
          primary: colors.brand,
          background: colors.canvas,
          card: colors.surface,
          text: colors.ink,
          border: colors.line,
          notification: colors.brand,
        },
      },
    };
  }, [scheme, preference]);

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme(): ThemeValue {
  const value = use(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside <AppThemeProvider>.');
  return value;
}

/**
 * Theme-aware StyleSheet: `const useStyles = makeStyles((colors, typography) => ({ … }))` at module level,
 * then `const styles = useStyles()` in the component. Styles are built once per theme.
 */
export function makeStyles<T extends StyleSheet.NamedStyles<T>>(factory: (colors: Colors, typography: Typography) => T) {
  const cache = new Map<string, T>();
  return function useStyles(): T {
    const { scheme, colors, typography } = useTheme();
    let styles = cache.get(scheme);
    if (!styles) {
      styles = StyleSheet.create(factory(colors, typography));
      cache.set(scheme, styles);
    }
    return styles;
  };
}
