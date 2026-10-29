import { useId } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';

import { accentColors, useTheme, type Accent } from '@/theme';

/**
 * The panel's background: a faint dot grid that fades out down the screen, with a soft glow of the screen's
 * accent at the top (the same language as the intro slides). Purely decorative and never touchable.
 */
export function Backdrop({ accent = 'brand' }: { accent?: Accent }) {
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  // SVG ids must be unique per mounted backdrop and may not contain the ":" of React ids.
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const glow = accentColors(colors, accent).fg;

  return (
    <View style={[StyleSheet.absoluteFill, styles.noTouch]}>
      <Svg width={width} height={height}>
        <Defs>
          <Pattern id={`dots${id}`} width={22} height={22} patternUnits="userSpaceOnUse">
            <Circle cx={1.5} cy={1.5} r={1.1} fill={colors.dot} />
          </Pattern>
          <LinearGradient id={`fade${id}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0.25" stopColor={colors.canvas} stopOpacity={0} />
            <Stop offset="0.85" stopColor={colors.canvas} stopOpacity={1} />
          </LinearGradient>
          <RadialGradient id={`glow${id}`} cx="12%" cy="0%" rx="85%" ry="34%">
            <Stop offset="0" stopColor={glow} stopOpacity={colors.glowOpacity} />
            <Stop offset="1" stopColor={glow} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id={`glow2${id}`} cx="100%" cy="6%" rx="55%" ry="22%">
            <Stop offset="0" stopColor={glow} stopOpacity={colors.glowOpacity * 0.6} />
            <Stop offset="1" stopColor={glow} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width={width} height={height} fill={`url(#dots${id})`} />
        <Rect width={width} height={height} fill={`url(#fade${id})`} />
        <Rect width={width} height={height} fill={`url(#glow${id})`} />
        <Rect width={width} height={height} fill={`url(#glow2${id})`} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  noTouch: { pointerEvents: 'none' },
});
