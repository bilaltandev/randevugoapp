import { DarkTheme, type Theme } from 'expo-router';
import { Platform, type TextStyle } from 'react-native';

/**
 * RandevuGo dark palette. Values mirror the web app's `.dark` tokens in
 * `src/app/globals.css` (--rg-*) so both clients read as one product.
 */
export const colors = {
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
} as const;

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

const text = (size: number, lineHeight: number, weight: TextStyle['fontWeight'], extra?: TextStyle): TextStyle => ({
  fontFamily,
  fontSize: size,
  lineHeight,
  fontWeight: weight,
  color: colors.ink,
  ...extra,
});

export const typography = {
  display: text(30, 36, '700', { letterSpacing: -0.6 }),
  title: text(22, 28, '700', { letterSpacing: -0.3 }),
  heading: text(17, 22, '600'),
  body: text(15, 21, '400', { color: colors.ink2 }),
  label: text(13, 18, '600', { color: colors.ink2 }),
  caption: text(12, 16, '500', { color: colors.ink3 }),
} as const;

/** React Navigation theme so headers, tab bars and screen backgrounds match the palette. */
export const navigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.brand,
    background: colors.canvas,
    card: colors.surface,
    text: colors.ink,
    border: colors.line,
    notification: colors.brand,
  },
};
