import { useEffect, useState } from 'react';
import { LayoutChangeEvent, Pressable, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import { makeStyles, spacing, useTheme } from '@/theme';

// Small, dependency-light charts drawn with react-native-svg. Values are plain numbers; labels are strings.

const compact = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1).replace('.', ',')}B` : String(Math.round(v)));

/** Rounded "nice" maximum for the y axis. */
function niceMax(max: number) {
  if (max <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(max));
  const n = max / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

function useWidth() {
  const [width, setWidth] = useState(0);
  return { width, onLayout: (e: LayoutChangeEvent) => setWidth(Math.round(e.nativeEvent.layout.width)) };
}

type Point = { label: string; value: number };

/**
 * Line + soft area. Revealed left to right; tap a point to read its value.
 * `format` renders values in the tooltip and on the axis.
 */
export function AreaChart({ data, height = 180, format = compact, color }: { data: Point[]; height?: number; format?: (v: number) => string; color?: string }) {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  const { width, onLayout } = useWidth();
  const [active, setActive] = useState<number | null>(null);
  const reveal = useSharedValue(0);
  const stroke = color ?? colors.brand;

  useEffect(() => {
    reveal.set(0);
    reveal.set(withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));
  }, [data, reveal]);

  const revealStyle = useAnimatedStyle(() => ({ width: `${reveal.value * 100}%` }));

  const axisW = 34;
  const plotW = Math.max(0, width - axisW);
  const plotH = height - 22;
  const max = niceMax(Math.max(...data.map((d) => d.value), 0));
  const x = (i: number) => (data.length <= 1 ? plotW / 2 : (i / (data.length - 1)) * plotW);
  const y = (v: number) => plotH - (v / max) * (plotH - 8) - 4;

  // Smooth curve through the points (monotone-ish cubic).
  let line = '';
  data.forEach((d, i) => {
    const px = x(i);
    const py = y(d.value);
    if (i === 0) line += `M ${px} ${py}`;
    else {
      const cx = (x(i - 1) + px) / 2;
      line += ` C ${cx} ${y(data[i - 1].value)}, ${cx} ${py}, ${px} ${py}`;
    }
  });
  const area = data.length ? `${line} L ${x(data.length - 1)} ${plotH} L ${x(0)} ${plotH} Z` : '';
  const labelEvery = Math.max(1, Math.ceil(data.length / 6));
  const sel = active !== null ? data[active] : null;

  return (
    <View onLayout={onLayout}>
      <View style={[styles.tooltipRow]}>
        <Text style={typography.caption}>{sel ? sel.label : 'Bir noktaya dokunun'}</Text>
        {sel ? <Text style={[typography.heading, { color: stroke }]}>{format(sel.value)}</Text> : null}
      </View>
      {width > 0 ? (
        <View style={{ height, flexDirection: 'row' }}>
          <View style={{ width: axisW, height: plotH, justifyContent: 'space-between' }}>
            {[max, max / 2, 0].map((v) => (
              <Text key={v} style={[typography.caption, styles.axisText]}>
                {format(v)}
              </Text>
            ))}
          </View>
          <View style={{ width: plotW }}>
            <Svg width={plotW} height={plotH} style={{ position: 'absolute' }}>
              {[0, 0.5, 1].map((f) => (
                <Line key={f} x1={0} x2={plotW} y1={4 + f * (plotH - 8)} y2={4 + f * (plotH - 8)} stroke={colors.line} strokeDasharray="4 4" />
              ))}
            </Svg>
            <Animated.View style={[{ height: plotH, overflow: 'hidden' }, revealStyle]}>
              <Svg width={plotW} height={plotH}>
                <Defs>
                  <LinearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={stroke} stopOpacity={0.32} />
                    <Stop offset="1" stopColor={stroke} stopOpacity={0} />
                  </LinearGradient>
                </Defs>
                <Path d={area} fill="url(#area)" />
                <Path d={line} stroke={stroke} strokeWidth={2.5} fill="none" strokeLinecap="round" />
                {active !== null ? (
                  <G>
                    <Line x1={x(active)} x2={x(active)} y1={0} y2={plotH} stroke={colors.lineStrong} />
                    <Circle cx={x(active)} cy={y(data[active].value)} r={5} fill={colors.surface} stroke={stroke} strokeWidth={2.5} />
                  </G>
                ) : null}
              </Svg>
            </Animated.View>
            {/* Touch targets, one per point. */}
            <View style={[styles.touchRow, { height: plotH }]}>
              {data.map((d, i) => (
                <Pressable
                  key={i}
                  style={styles.flex}
                  onPress={() => setActive(active === i ? null : i)}
                  accessibilityLabel={`${d.label}: ${format(d.value)}`}
                />
              ))}
            </View>
            <View style={styles.xLabels}>
              {data.map((d, i) =>
                i % labelEvery === 0 || i === data.length - 1 ? (
                  <Text key={i} style={[typography.caption, styles.xLabel, { left: x(i) - 24 }]} numberOfLines={1}>
                    {d.label}
                  </Text>
                ) : null
              )}
            </View>
          </View>
        </View>
      ) : (
        <View style={{ height }} />
      )}
    </View>
  );
}

/** Vertical bars that grow in; the tallest is highlighted. Tap a bar to read its value. */
export function BarChart({ data, height = 160, format = compact, color }: { data: Point[]; height?: number; format?: (v: number) => string; color?: string }) {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const peak = data.findIndex((d) => d.value === max && d.value > 0);
  const fill = color ?? colors.brand;
  const sel = active !== null ? data[active] : peak >= 0 ? data[peak] : null;

  return (
    <View>
      <View style={styles.tooltipRow}>
        <Text style={typography.caption}>{sel ? (active === null ? `En yoğun: ${sel.label}` : sel.label) : 'Veri yok'}</Text>
        {sel ? <Text style={[typography.heading, { color: fill }]}>{format(sel.value)}</Text> : null}
      </View>
      <View style={[styles.bars, { height }]}>
        {data.map((d, i) => (
          <Pressable key={i} style={styles.barCol} onPress={() => setActive(active === i ? null : i)} accessibilityLabel={`${d.label}: ${format(d.value)}`}>
            <View style={styles.barTrack}>
              <GrowBar ratio={d.value / max} delay={i * 35} color={fill} dim={active !== null ? active !== i : i !== peak} />
            </View>
            <Text style={[typography.caption, styles.barLabel]} numberOfLines={1}>
              {d.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function GrowBar({ ratio, delay, color, dim }: { ratio: number; delay: number; color: string; dim: boolean }) {
  const h = useSharedValue(0);
  useEffect(() => {
    h.set(withDelay(delay, withTiming(ratio, { duration: 550, easing: Easing.out(Easing.cubic) })));
  }, [ratio, delay, h]);
  const style = useAnimatedStyle(() => ({ height: `${Math.max(h.value * 100, ratio > 0 ? 3 : 0)}%` }));
  return <Animated.View style={[{ width: '100%', borderRadius: 6, backgroundColor: color, opacity: dim ? 0.45 : 1 }, style]} />;
}

type Slice = { label: string; value: number; color: string };

/** Ring split into slices with a legend; the total sits in the middle. */
export function DonutChart({ data, size = 150, centerLabel }: { data: Slice[]; size?: number; centerLabel: string }) {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  const total = data.reduce((a, d) => a + d.value, 0);
  const stroke = 18;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <View style={styles.donutRow}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
            <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.surfaceMuted} strokeWidth={stroke} fill="none" />
            {total > 0
              ? data.map((d) => {
                  const len = (d.value / total) * c;
                  const el = (
                    <Circle
                      key={d.label}
                      cx={size / 2}
                      cy={size / 2}
                      r={r}
                      stroke={d.color}
                      strokeWidth={stroke}
                      fill="none"
                      strokeDasharray={`${Math.max(0, len - 2)} ${c}`}
                      strokeDashoffset={-offset}
                    />
                  );
                  offset += len;
                  return el;
                })
              : null}
          </G>
        </Svg>
        <View style={styles.donutCenter}>
          <Text style={typography.title}>{total}</Text>
          <Text style={typography.caption}>{centerLabel}</Text>
        </View>
      </View>
      <View style={styles.legend}>
        {data.map((d) => (
          <View key={d.label} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: d.color }]} />
            <Text style={[typography.body, styles.flex]} numberOfLines={1}>
              {d.label}
            </Text>
            <Text style={typography.label}>
              {d.value}
              <Text style={typography.caption}> · %{total ? Math.round((d.value / total) * 100) : 0}</Text>
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Ranked horizontal bars (top services, staff…). */
export function RankBars({ data, format = compact }: { data: Point[]; format?: (v: number) => string }) {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  const max = Math.max(1, ...data.map((d) => d.value));
  if (data.length === 0) return <Text style={typography.body}>Henüz veri yok.</Text>;
  return (
    <View style={styles.rank}>
      {data.map((d, i) => (
        <View key={d.label} style={styles.rankRow}>
          <View style={styles.rankHead}>
            <Text style={[typography.body, styles.flex, { color: colors.ink }]} numberOfLines={1}>
              {i + 1}. {d.label}
            </Text>
            <Text style={typography.label}>{format(d.value)}</Text>
          </View>
          <View style={styles.rankTrack}>
            <GrowWidth ratio={d.value / max} delay={i * 60} color={i === 0 ? colors.brand : colors.chart2} />
          </View>
        </View>
      ))}
    </View>
  );
}

function GrowWidth({ ratio, delay, color }: { ratio: number; delay: number; color: string }) {
  const w = useSharedValue(0);
  useEffect(() => {
    w.set(withDelay(delay, withTiming(ratio, { duration: 600, easing: Easing.out(Easing.cubic) })));
  }, [ratio, delay, w]);
  const style = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  return <Animated.View style={[{ height: '100%', borderRadius: 4, backgroundColor: color }, style]} />;
}

/** Small trend line for stat tiles. */
export function Sparkline({ values, color, width = 90, height = 28 }: { values: number[]; color?: string; width?: number; height?: number }) {
  const { colors } = useTheme();
  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => `${values.length <= 1 ? width / 2 : (i / (values.length - 1)) * width},${height - 2 - (v / max) * (height - 4)}`);
  return (
    <Svg width={width} height={height}>
      <Path d={pts.length ? `M ${pts.join(' L ')}` : ''} stroke={color ?? colors.brand} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const useStyles = makeStyles(() => ({
  flex: { flex: 1 },
  tooltipRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: spacing.sm, minHeight: 22 },
  axisText: { fontSize: 10, lineHeight: 12 },
  touchRow: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row' },
  xLabels: { height: 22, position: 'relative' },
  xLabel: { position: 'absolute', top: 6, width: 48, textAlign: 'center', fontSize: 10 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  barCol: { flex: 1, height: '100%', alignItems: 'center', gap: 4 },
  barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  barLabel: { fontSize: 10 },
  donutRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  donutCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  legend: { flex: 1, gap: spacing.sm },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  rank: { gap: spacing.md },
  rankRow: { gap: 6 },
  rankHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rankTrack: { height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: 'rgba(127,127,127,0.12)' },
}));

