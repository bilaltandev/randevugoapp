import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';
import {
  I18nManager,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Path, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useAccount, useAuth } from '@/auth/AuthProvider';
import { Icon, icons, type IconName } from '@/components/Icon';
import { t } from '@/i18n';
import { darkColors as C, radius, spacing } from '@/theme';

/**
 * Shown once, right after sign-up: a few full-screen slides that show what the app does, before the plan
 * cards. Always dark, each slide with its own accent and an aurora glow; the pictures are mock-ups of the
 * app's own screens drawn with views and SVG, so they follow every language and need no image files.
 */

type Slide = { key: string; accent: string; glow: string; eyebrow: string; title: string; body: string; Visual: () => ReactElement };

const ACCENTS = {
  emerald: { accent: C.brand, glow: '#0E7A5A' },
  blue: { accent: '#60A5FA', glow: '#1D4ED8' },
  violet: { accent: '#A78BFA', glow: '#6D28D9' },
  amber: { accent: '#FBBF24', glow: '#B45309' },
};

/** Size the pictures are drawn at; they scale down to fit smaller phones. */
const STAGE_W = 320;
const STAGE_H = 380;
const SWIPE = 50;
const GLASS = 'rgba(18, 22, 29, 0.94)';
const HAIRLINE = 'rgba(255, 255, 255, 0.08)';

export default function IntroScreen() {
  const { finishIntro } = useAuth();
  const { isMember } = useAccount();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [stage, setStage] = useState({ width: STAGE_W, height: STAGE_H });
  const touchX = useRef(0);

  // Team members only see their own bookings, so the team and growth slides are for owners.
  const slides: Slide[] = [
    {
      key: 'calendar',
      ...ACCENTS.emerald,
      eyebrow: t('Takvim'),
      title: t('Tüm randevularınız tek ekranda'),
      body: t('Gününüzü, haftanızı ve ayınızı bir bakışta görün. Randevuları onaylayın, düzenleyin ya da iptal edin.'),
      Visual: CalendarVisual,
    },
    {
      key: 'booking',
      ...ACCENTS.blue,
      eyebrow: t('Online randevu'),
      title: t('Müşterileriniz 7/24 randevu alsın'),
      body: t('Size özel randevu sayfanızı paylaşın. Müşterileriniz boş saati seçip randevusunu kendisi oluştursun.'),
      Visual: BookingVisual,
    },
    ...(isMember
      ? []
      : [
          {
            key: 'team',
            ...ACCENTS.violet,
            eyebrow: t('Ekip'),
            title: t('Ekibinizi ve hizmetlerinizi yönetin'),
            body: t('Çalışanlarınızı ve hizmetlerinizi süre ve fiyatlarıyla ekleyin. Her çalışan kendi randevularını görsün.'),
            Visual: TeamVisual,
          },
          {
            key: 'growth',
            ...ACCENTS.amber,
            eyebrow: t('İstatistikler'),
            title: t('İşletmenizin büyümesini izleyin'),
            body: t('Randevu sayıları, müşteri geçmişi ve yorumlarla işinizin nasıl gittiğini takip edin.'),
            Visual: GrowthVisual,
          },
        ]),
  ];

  const last = index === slides.length - 1;
  const slide = slides[index];
  const scale = Math.min(1, stage.width / STAGE_W, stage.height / STAGE_H);

  const go = (to: number) => {
    if (to < 0 || to >= slides.length) return;
    setDirection(to > index ? 1 : -1);
    setIndex(to);
  };

  const onTouchEnd = (e: GestureResponderEvent) => {
    const dx = (e.nativeEvent.pageX - touchX.current) * (I18nManager.isRTL ? -1 : 1);
    if (dx < -SWIPE) go(index + 1);
    else if (dx > SWIPE) go(index - 1);
  };

  const onStageLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setStage({ width, height });
  };

  // Content slides in from the side it is coming from (mirrored in right-to-left languages).
  const fromEnd = (direction === 1) !== I18nManager.isRTL;
  const enter = fromEnd ? FadeInRight : FadeInLeft;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <Aurora key={`aurora-${slide.key}`} id={slide.key} accent={slide.accent} glow={slide.glow} />

      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <View style={styles.top}>
          <View style={styles.progress}>
            {slides.map((s, i) => (
              <Pressable
                key={s.key}
                onPress={() => go(i)}
                hitSlop={{ top: 12, bottom: 12 }}
                accessibilityRole="button"
                accessibilityLabel={t('{0} / {1}', i + 1, slides.length)}
                style={styles.segment}>
                <View style={[styles.segmentFill, { backgroundColor: i <= index ? slide.accent : 'transparent' }]} />
              </Pressable>
            ))}
          </View>
          {last ? (
            <View style={styles.skip} />
          ) : (
            <Pressable onPress={finishIntro} hitSlop={12} accessibilityRole="button" style={styles.skip}>
              <Text style={styles.skipText}>{t('Atla')}</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.flex} onTouchStart={(e) => (touchX.current = e.nativeEvent.pageX)} onTouchEnd={onTouchEnd}>
          <View style={styles.stage} onLayout={onStageLayout}>
            <Animated.View key={slide.key} entering={enter.duration(420).easing(Easing.out(Easing.cubic))} style={{ transform: [{ scale }] }}>
              <View style={styles.stageBox}>
                <slide.Visual />
              </View>
            </Animated.View>
          </View>

          <Animated.View key={`copy-${slide.key}`} entering={FadeInDown.delay(120).duration(420)} style={styles.copy}>
            <View style={styles.eyebrowRow}>
              <Text style={[styles.eyebrowNumber, { color: slide.accent }]}>{String(index + 1).padStart(2, '0')}</Text>
              <View style={[styles.eyebrowLine, { backgroundColor: slide.accent }]} />
              <Text style={[styles.eyebrow, { color: slide.accent }]}>{slide.eyebrow}</Text>
            </View>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.body}>{slide.body}</Text>
          </Animated.View>
        </View>

        <View style={styles.footer}>
          <Pressable
            onPress={() => (last ? finishIntro() : go(index + 1))}
            accessibilityRole="button"
            style={({ pressed }) => [styles.next, { backgroundColor: slide.accent }, pressed && styles.pressed]}>
            <Text style={styles.nextText}>{last ? t('Başlayalım') : t('Devam et')}</Text>
            <View style={styles.nextIcon}>
              <Icon name={last ? icons.check : icons.chevronRight} size={16} color={slide.accent} />
            </View>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

/* ---------- Background ---------- */

/** Two soft radial glows in the slide's colors over a faint dot grid, fading into the canvas at the bottom. */
function Aurora({ id, accent, glow }: { id: string; accent: string; glow: string }) {
  const { width, height } = useWindowDimensions();
  return (
    <Animated.View entering={FadeIn.duration(700)} style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      <Svg width={width} height={height}>
        <Defs>
          <RadialGradient id={`a-${id}`} cx="15%" cy="12%" rx="75%" ry="45%">
            <Stop offset="0" stopColor={accent} stopOpacity={0.42} />
            <Stop offset="1" stopColor={accent} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id={`b-${id}`} cx="95%" cy="48%" rx="70%" ry="38%">
            <Stop offset="0" stopColor={glow} stopOpacity={0.5} />
            <Stop offset="1" stopColor={glow} stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id={`fade-${id}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0.5" stopColor={C.canvas} stopOpacity={0} />
            <Stop offset="0.78" stopColor={C.canvas} stopOpacity={0.96} />
          </LinearGradient>
          <Pattern id={`dots-${id}`} width={22} height={22} patternUnits="userSpaceOnUse">
            <Circle cx={1.5} cy={1.5} r={1.1} fill="#FFFFFF" fillOpacity={0.07} />
          </Pattern>
        </Defs>
        <Rect width={width} height={height} fill={C.canvas} />
        <Rect width={width} height={height} fill={`url(#dots-${id})`} />
        <Rect width={width} height={height} fill={`url(#a-${id})`} />
        <Rect width={width} height={height} fill={`url(#b-${id})`} />
        <Rect width={width} height={height} fill={`url(#fade-${id})`} />
      </Svg>
    </Animated.View>
  );
}

/* ---------- Building blocks for the pictures ---------- */

/** Bobs gently up and down (still when the phone asks for reduced motion). */
function Float({ children, style, delay = 0, amplitude = 6 }: { children: ReactNode; style?: StyleProp<ViewStyle>; delay?: number; amplitude?: number }) {
  const reduced = useReducedMotion();
  const y = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    y.set(withDelay(delay, withRepeat(withTiming(-amplitude, { duration: 2400, easing: Easing.inOut(Easing.sin) }), -1, true)));
  }, [reduced, delay, amplitude, y]);
  const bob = useAnimatedStyle(() => ({ transform: [{ translateY: y.get() }] }));
  return (
    <Animated.View entering={FadeInDown.delay(380 + delay / 4).duration(480)} style={[styles.floatLayer, style]}>
      <Animated.View style={bob}>{children}</Animated.View>
    </Animated.View>
  );
}

function Chip({ icon, accent, title, subtitle }: { icon: IconName; accent: string; title: string; subtitle?: string }) {
  return (
    <View style={styles.chip}>
      <View style={[styles.chipIcon, { backgroundColor: accent }]}>
        <Icon name={icon} size={13} color={C.canvas} />
      </View>
      <View>
        <Text style={styles.label}>{title}</Text>
        {subtitle ? <Text style={styles.cap}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

function Avatar({ initials, color, size = 30 }: { initials: string; color: string; size?: number }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

/* ---------- 1. Calendar: a day timeline ---------- */

const HOUR_H = 46;

function CalendarVisual() {
  const accent = ACCENTS.emerald.accent;
  const hours = ['09:00', '10:00', '11:00', '12:00', '13:00'];
  const at = (h: number, m: number) => (h - 9) * HOUR_H + (m / 60) * HOUR_H;
  const blocks = [
    { from: at(9, 15), to: at(10, 0), name: 'Ayşe Kaya', service: t('Saç kesimi'), color: accent, done: true },
    { from: at(10, 30), to: at(11, 10), name: 'Mehmet Demir', service: t('Sakal tıraşı'), color: C.pending, done: false },
    { from: at(11, 30), to: at(12, 40), name: 'Elif Şahin', service: t('Cilt bakımı'), color: ACCENTS.blue.accent, done: true },
  ];
  const days = [13, 14, 15, 16, 17, 18, 19];
  return (
    <>
      <View style={[styles.card, styles.cardCalendar]}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.cap}>{t('Takvim')}</Text>
            <Text style={styles.h}>{t('Bugün')}</Text>
          </View>
          <View style={styles.avatarStack}>
            {[
              { initials: 'AK', color: accent },
              { initials: 'MD', color: C.pending },
              { initials: 'EŞ', color: ACCENTS.blue.accent },
            ].map((a, i) => (
              <View key={a.initials} style={i > 0 && styles.overlap}>
                <Avatar initials={a.initials} color={a.color} size={24} />
              </View>
            ))}
          </View>
        </View>
        <View style={styles.week}>
          {days.map((d) => {
            const on = d === 15;
            return (
              <View key={d} style={[styles.day, on && { backgroundColor: accent }]}>
                <Text style={[styles.dayText, on && { color: C.canvas }]}>{d}</Text>
                <View style={[styles.dayDot, { backgroundColor: on ? C.canvas : d % 3 === 0 ? 'transparent' : accent }]} />
              </View>
            );
          })}
        </View>
        <View style={{ height: HOUR_H * 4 }}>
          {hours.map((h, i) => (
            <View key={h} style={[styles.hourRow, { top: i * HOUR_H }]}>
              <Text style={styles.hour}>{h}</Text>
              <View style={styles.hourLine} />
            </View>
          ))}
          {blocks.map((b) => (
            <View
              key={b.name}
              style={[styles.block, { top: b.from + 2, height: b.to - b.from - 4, borderStartColor: b.color, backgroundColor: `${b.color}1F` }]}>
              <Text style={styles.label} numberOfLines={1}>
                {b.name}
              </Text>
              <Text style={styles.cap} numberOfLines={1}>
                {b.service}
              </Text>
            </View>
          ))}
          <View style={[styles.now, { top: at(10, 12) }]}>
            <View style={styles.nowDot} />
            <View style={styles.nowLine} />
          </View>
        </View>
      </View>
      <Float style={{ top: 6, end: -6 }} delay={200}>
        <Chip icon={icons.check} accent={accent} title={t('Onaylandı')} subtitle="Ayşe K. · 09:15" />
      </Float>
      <Float style={{ bottom: 4, start: -4 }} delay={900} amplitude={5}>
        <View style={styles.statChip}>
          <Text style={[styles.statNumber, { color: accent }]}>8</Text>
          <Text style={styles.cap}>{t('Randevular')}</Text>
        </View>
      </Float>
    </>
  );
}

/* ---------- 2. Booking page on a phone ---------- */

function BookingVisual() {
  const accent = ACCENTS.blue.accent;
  const slots = ['10:00', '10:30', '11:00', '13:00', '14:30', '15:00'];
  return (
    <>
      <View style={styles.phone}>
        <View style={styles.notch} />
        <View style={styles.cover}>
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="cover" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={accent} stopOpacity={0.9} />
                <Stop offset="1" stopColor={ACCENTS.blue.glow} stopOpacity={0.9} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#cover)" />
          </Svg>
          <View style={styles.url}>
            <Icon name={icons.lock} size={9} color={C.ink} />
            <Text style={styles.urlText} numberOfLines={1}>
              calendlygo.com/ahmet-berber
            </Text>
          </View>
        </View>
        <View style={styles.phoneBody}>
          <View style={styles.bizRow}>
            <View style={styles.bizAvatar}>
              <Avatar initials="AB" color={C.surfaceMuted} size={44} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.h} numberOfLines={1}>
                Ahmet Berber
              </Text>
              <Text style={styles.cap}>
                <Text style={{ color: ACCENTS.amber.accent }}>★ 4.9</Text> (128)
              </Text>
            </View>
          </View>
          <View style={[styles.service, { borderColor: accent }]}>
            <Icon name={icons.services} size={13} color={accent} />
            <Text style={[styles.label, styles.flex]} numberOfLines={1}>
              {t('Saç kesimi')}
            </Text>
            <Text style={styles.cap}>{t('{0} dk', 30)}</Text>
            <Text style={styles.label}>₺350</Text>
          </View>
          <Text style={styles.cap}>{t('Saat seçin')}</Text>
          <View style={styles.slots}>
            {slots.map((s) => {
              const on = s === '10:30';
              const taken = s === '11:00';
              return (
                <View key={s} style={[styles.slot, on && { backgroundColor: accent, borderColor: accent }, taken && styles.slotTaken]}>
                  <Text style={[styles.slotText, on && { color: C.canvas }, taken && styles.slotTakenText]}>{s}</Text>
                </View>
              );
            })}
          </View>
          <View style={[styles.cta, { backgroundColor: accent }]}>
            <Text style={styles.ctaText}>{t('Randevuyu onayla')}</Text>
          </View>
        </View>
      </View>
      <Float style={{ top: 2, end: -10 }} delay={300}>
        <Chip icon={icons.appointments} accent={C.brand} title={t('Yeni randevu')} subtitle="Elif · 10:30" />
      </Float>
      <Float style={{ bottom: 14, start: -6 }} delay={1100} amplitude={5}>
        <Chip icon={icons.globe} accent={accent} title="7/24" subtitle={t('Online randevu')} />
      </Float>
    </>
  );
}

/* ---------- 3. Team and services ---------- */

function TeamVisual() {
  const accent = ACCENTS.violet.accent;
  const team = [
    { initials: 'AY', name: 'Ahmet Yıldız', role: t('Saç kesimi'), load: 0.82, color: accent },
    { initials: 'ZK', name: 'Zeynep Koç', role: t('Cilt bakımı'), load: 0.64, color: ACCENTS.blue.accent },
    { initials: 'CD', name: 'Can Doğan', role: t('Sakal tıraşı'), load: 0.45, color: C.brand },
  ];
  const services = [
    { name: t('Saç kesimi'), price: 350 },
    { name: t('Sakal tıraşı'), price: 200 },
    { name: t('Cilt bakımı'), price: 600 },
  ];
  return (
    <>
      <View style={[styles.card, styles.cardTeam]}>
        <View style={styles.rowBetween}>
          <Text style={styles.h}>{t('Ekip')}</Text>
          <View style={[styles.badge, { backgroundColor: `${accent}26` }]}>
            <Text style={[styles.badgeText, { color: accent }]}>3 / 5</Text>
          </View>
        </View>
        {team.map((m) => (
          <View key={m.initials} style={styles.memberRow}>
            <View>
              <Avatar initials={m.initials} color={m.color} size={36} />
              <View style={styles.online} />
            </View>
            <View style={[styles.flex, styles.memberText]}>
              <View style={styles.rowBetween}>
                <Text style={styles.label} numberOfLines={1}>
                  {m.name}
                </Text>
                <Text style={styles.cap}>{Math.round(m.load * 100)}%</Text>
              </View>
              <Text style={styles.cap} numberOfLines={1}>
                {m.role}
              </Text>
              <View style={styles.loadTrack}>
                <View style={[styles.loadFill, { width: `${m.load * 100}%`, backgroundColor: m.color }]} />
              </View>
            </View>
          </View>
        ))}
        <View style={styles.divider} />
        <Text style={styles.cap}>{t('Hizmetler')}</Text>
        <View style={styles.servicePills}>
          {services.map((s) => (
            <View key={s.name} style={styles.servicePill}>
              <Text style={styles.label}>{s.name}</Text>
              <Text style={[styles.cap, { color: accent }]}>₺{s.price}</Text>
            </View>
          ))}
        </View>
      </View>
      <Float style={{ top: 0, end: -8 }} delay={250}>
        <Chip icon={icons.key} accent={accent} title={t('Davet kodu')} subtitle="K7M2-QXAB" />
      </Float>
    </>
  );
}

/* ---------- 4. Growth: a chart, stats and a review ---------- */

function GrowthVisual() {
  const accent = ACCENTS.amber.accent;
  const W = 252;
  const H = 96;
  const points = [0.28, 0.36, 0.31, 0.48, 0.44, 0.6, 0.55, 0.72, 0.68, 0.9];
  const xy = points.map((p, i) => [(i / (points.length - 1)) * W, H - p * H] as const);
  // A smooth line through the points (Catmull-Rom as cubic Béziers).
  const line = xy.reduce((d, [x, y], i) => {
    if (i === 0) return `M ${x} ${y}`;
    const [x0, y0] = xy[Math.max(0, i - 2)];
    const [x1, y1] = xy[i - 1];
    const [x3, y3] = xy[Math.min(xy.length - 1, i + 1)];
    return `${d} C ${x1 + (x - x0) / 6} ${y1 + (y - y0) / 6}, ${x - (x3 - x1) / 6} ${y - (y3 - y1) / 6}, ${x} ${y}`;
  }, '');
  const [lastX, lastY] = xy[xy.length - 1];
  return (
    <>
      <View style={[styles.card, styles.cardGrowth]}>
        <Text style={styles.cap}>{t('Bu ay')}</Text>
        <View style={styles.rowStart}>
          <Text style={styles.big}>128</Text>
          <View style={[styles.badge, { backgroundColor: `${C.brand}26` }]}>
            <Icon name={icons.trendUp} size={11} color={C.brand} />
            <Text style={[styles.badgeText, { color: C.brand }]}>+18%</Text>
          </View>
        </View>
        <Text style={styles.cap}>{t('Randevular')}</Text>
        <Svg width={W} height={H + 8}>
          <Defs>
            <LinearGradient id="area" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={accent} stopOpacity={0.35} />
              <Stop offset="1" stopColor={accent} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Path d={`${line} L ${W} ${H + 8} L 0 ${H + 8} Z`} fill="url(#area)" />
          <Path d={line} stroke={accent} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          <Circle cx={lastX - 4} cy={lastY + 2} r={9} fill={accent} fillOpacity={0.2} />
          <Circle cx={lastX - 4} cy={lastY + 2} r={4} fill={accent} />
        </Svg>
        <View style={styles.stats}>
          {[
            { label: t('Puan'), value: '4.9', color: accent },
            { label: t('Yorumlar'), value: '86', color: C.ink },
            { label: t('Müşteriler'), value: '412', color: C.ink },
          ].map((s) => (
            <View key={s.label} style={styles.stat}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.cap} numberOfLines={1}>
                {s.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
      <Float style={{ top: -6, end: -10 }} delay={300}>
        <View style={styles.review}>
          <Avatar initials="SY" color={ACCENTS.violet.accent} size={26} />
          <View style={styles.flex}>
            <Text style={[styles.cap, { color: accent }]}>★★★★★</Text>
            <Text style={styles.label} numberOfLines={2}>
              {t('Harika hizmet, çok memnun kaldım!')}
            </Text>
          </View>
        </View>
      </Float>
    </>
  );
}

/* ---------- Styles ---------- */

const shadow = {
  shadowColor: '#000',
  shadowOpacity: 0.45,
  shadowRadius: 28,
  shadowOffset: { width: 0, height: 18 },
  elevation: 12,
} as const;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.canvas },
  flex: { flex: 1 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },

  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingHorizontal: spacing.xl, paddingTop: spacing.sm, height: 44 },
  progress: { flex: 1, flexDirection: 'row', gap: 6 },
  segment: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255, 255, 255, 0.16)', overflow: 'hidden' },
  segmentFill: { flex: 1 },
  skip: { minWidth: 48, alignItems: 'flex-end' },
  skipText: { fontSize: 14, fontWeight: '600', color: C.ink2 },

  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stageBox: { width: STAGE_W, height: STAGE_H, alignItems: 'center', justifyContent: 'center' },
  floatLayer: { position: 'absolute', zIndex: 2 },

  copy: { paddingHorizontal: spacing.xl, gap: spacing.md, paddingBottom: spacing.sm },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  eyebrowNumber: { fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  eyebrowLine: { width: 20, height: 1.5, borderRadius: 1, opacity: 0.7 },
  eyebrow: { fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },
  title: { fontSize: 32, lineHeight: 38, fontWeight: '800', letterSpacing: -1, color: C.ink },
  body: { fontSize: 16, lineHeight: 23, color: C.ink2 },

  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.lg },
  next: {
    height: 56,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingStart: spacing.xl,
    paddingEnd: 6,
  },
  nextText: { fontSize: 16, fontWeight: '700', color: C.canvas },
  nextIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: C.canvas },

  // Shared bits of the pictures
  card: { padding: spacing.lg, gap: spacing.md, borderRadius: 24, borderWidth: 1, borderColor: HAIRLINE, backgroundColor: GLASS, ...shadow },
  cardCalendar: { width: 288 },
  cardTeam: { width: 292, marginTop: 24 },
  cardGrowth: { width: 288, gap: spacing.sm, marginTop: 30 },
  h: { fontSize: 16, fontWeight: '700', color: C.ink },
  label: { fontSize: 12, fontWeight: '600', color: C.ink },
  cap: { fontSize: 11, fontWeight: '500', color: C.ink3 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  rowStart: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: { alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.surface },
  avatarText: { fontWeight: '800', color: C.canvas },
  avatarStack: { flexDirection: 'row' },
  overlap: { marginStart: -8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingStart: spacing.sm,
    paddingEnd: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(28, 34, 44, 0.97)',
    ...shadow,
  },
  chipIcon: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill },
  badgeText: { fontSize: 11, fontWeight: '800' },

  // Calendar
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { width: 32, paddingVertical: 6, borderRadius: 10, alignItems: 'center', gap: 3 },
  dayText: { fontSize: 12, fontWeight: '700', color: C.ink2 },
  dayDot: { width: 4, height: 4, borderRadius: 2 },
  hourRow: { position: 'absolute', start: 0, end: 0, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: -7 },
  hour: { width: 34, fontSize: 10, fontWeight: '600', color: C.ink3 },
  hourLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  block: { position: 'absolute', start: 42, end: 0, borderStartWidth: 3, borderRadius: 8, paddingHorizontal: spacing.sm, justifyContent: 'center' },
  now: { position: 'absolute', start: 36, end: 0, flexDirection: 'row', alignItems: 'center', marginTop: -4 },
  nowDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.danger },
  nowLine: { flex: 1, height: 1.5, backgroundColor: C.danger },
  statChip: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.12)', backgroundColor: 'rgba(28, 34, 44, 0.97)', alignItems: 'center', ...shadow },
  statNumber: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },

  // Booking phone
  phone: { width: 232, height: 360, borderRadius: 38, borderWidth: 6, borderColor: '#1F2531', backgroundColor: C.surface, overflow: 'hidden', ...shadow },
  notch: { position: 'absolute', top: 8, alignSelf: 'center', width: 70, height: 18, borderRadius: 9, backgroundColor: '#000', zIndex: 3 },
  cover: { height: 92, justifyContent: 'flex-end', padding: spacing.sm },
  url: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'center', paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: 'rgba(11, 14, 19, 0.55)', marginBottom: 26 },
  urlText: { fontSize: 9, fontWeight: '600', color: C.ink },
  phoneBody: { paddingHorizontal: spacing.md, gap: spacing.sm, marginTop: -26 },
  bizRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  bizAvatar: { borderRadius: 26, borderWidth: 3, borderColor: C.surface },
  service: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: spacing.sm, borderRadius: radius.md, borderWidth: 1, backgroundColor: 'rgba(96, 165, 250, 0.08)' },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  slot: { width: 61, paddingVertical: 7, alignItems: 'center', borderRadius: radius.sm, borderWidth: 1, borderColor: C.line },
  slotText: { fontSize: 11, fontWeight: '700', color: C.ink },
  slotTaken: { backgroundColor: C.surfaceMuted, borderColor: C.surfaceMuted },
  slotTakenText: { color: C.ink3, textDecorationLine: 'line-through' },
  cta: { alignItems: 'center', paddingVertical: 10, borderRadius: radius.md, marginTop: 2 },
  ctaText: { fontSize: 12, fontWeight: '800', color: C.canvas },

  // Team
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  memberText: { gap: 2 },
  online: { position: 'absolute', bottom: 0, end: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: C.brand, borderWidth: 2, borderColor: C.surface },
  loadTrack: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255, 255, 255, 0.08)', marginTop: 3, overflow: 'hidden' },
  loadFill: { height: 4, borderRadius: 2 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255, 255, 255, 0.12)' },
  servicePills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  servicePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: C.surfaceMuted },

  // Growth
  big: { fontSize: 34, fontWeight: '800', letterSpacing: -1, color: C.ink },
  stats: { flexDirection: 'row', gap: spacing.sm },
  stat: { flex: 1, paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, borderRadius: radius.md, backgroundColor: C.surfaceMuted, gap: 1 },
  statValue: { fontSize: 16, fontWeight: '800' },
  review: {
    width: 190,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(28, 34, 44, 0.97)',
    ...shadow,
  },
});
