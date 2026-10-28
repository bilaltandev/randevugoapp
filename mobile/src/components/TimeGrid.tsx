import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View, type GestureResponderEvent, type ScrollViewInstance } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { dateKey, statusMeta, type Appointment, type StatusTone } from '@/lib/appointments';
import { makeStyles, radius, spacing, useTheme, type Colors } from '@/theme';
import { t } from '@/i18n';

// Mobile port of the web calendar's TimeGrid (src/app/dashboard/calendar/TimeGrid.tsx): hour rows,
// overlapping bookings side by side, a "now" line, and a tap on free space to book that time.

const HOUR_PX = 64;
const DEFAULT_START = 8;
const DEFAULT_END = 21;
const SNAP_MIN = 15;
const LABEL_W = 44;

const toMin = (t?: string | null) => {
  const [h, m] = (t || '0:0').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

type Placed = { appt: Appointment; start: number; end: number; lane: number; lanes: number };

/** Side-by-side lanes for overlapping bookings within one day (same algorithm as the web). */
function layoutDay(appts: Appointment[]): Placed[] {
  const items = appts
    .map((a) => {
      const start = toMin(a.startTime);
      const end = Math.max(toMin(a.endTime) || start + (a.service?.durationMinutes ?? 30), start + 20);
      return { appt: a, start, end };
    })
    .sort((a, b) => a.start - b.start || b.end - a.end);

  const out: Placed[] = [];
  let cluster: Placed[] = [];
  let clusterEnd = -1;
  const flush = () => {
    const lanes = Math.max(1, ...cluster.map((c) => c.lane + 1));
    for (const c of cluster) out.push({ ...c, lanes });
    cluster = [];
  };
  for (const it of items) {
    if (cluster.length && it.start >= clusterEnd) flush();
    const used = new Set(cluster.filter((c) => c.end > it.start).map((c) => c.lane));
    let lane = 0;
    while (used.has(lane)) lane++;
    cluster.push({ ...it, lane, lanes: 1 });
    clusterEnd = Math.max(clusterEnd, it.end);
  }
  if (cluster.length) flush();
  return out;
}

export function toneColors(colors: Colors): Record<StatusTone, { fg: string; bg: string; bar: string }> {
  return {
    pending: { fg: colors.pending, bg: colors.pendingSoft, bar: colors.pending },
    confirmed: { fg: colors.brandInk, bg: colors.brandSoft, bar: colors.brand },
    completed: { fg: colors.ink2, bg: colors.surfaceMuted, bar: colors.ink3 },
    cancelled: { fg: colors.danger, bg: colors.dangerSoft, bar: colors.danger },
    blocked: { fg: colors.ink3, bg: colors.surfaceMuted, bar: colors.lineStrong },
  };
}

type Props = {
  days: Date[];
  appointments: Appointment[];
  onSelect: (a: Appointment) => void;
  /** Tap on free space: book this day at this (15-minute snapped) time. */
  onCreateAt: (dateKey: string, time: string) => void;
  /** Tap on a day header in the multi-day view. */
  onPickDay?: (d: Date) => void;
};

export function TimeGrid({ days, appointments, onSelect, onCreateAt, onPickDay }: Props) {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  const tones = toneColors(colors);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const keys = days.map(dateKey);
  const byDay = useMemo(() => {
    const map = new Map<string, Placed[]>();
    for (const key of keys) map.set(key, layoutDay(appointments.filter((a) => a.date === key)));
    return map;
    // keys are derived from days
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments, days]);

  // Working hours by default, stretched to fit anything booked outside them.
  const all = [...byDay.values()].flat();
  const startHour = Math.min(DEFAULT_START, ...all.map((p) => Math.floor(p.start / 60)));
  const endHour = Math.max(DEFAULT_END, ...all.map((p) => Math.ceil(p.end / 60)));
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const height = hours.length * HOUR_PX;

  const todayKey = dateKey(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowTop = nowMin >= startHour * 60 && nowMin <= endHour * 60 ? ((nowMin - startHour * 60) / 60) * HOUR_PX : null;
  const single = days.length === 1;

  // Open scrolled to the current hour (or the first booking) instead of the top of the day.
  useEffect(() => {
    const first = all.length ? Math.min(...all.map((p) => p.start)) : null;
    const focus = keys.includes(todayKey) ? nowMin - 60 : first !== null ? first - 30 : startHour * 60;
    const y = Math.max(0, ((focus - startHour * 60) / 60) * HOUR_PX);
    const timer = setTimeout(() => scrollRef.current?.scrollTo({ y, animated: true }), 250);
    return () => clearTimeout(timer);
    // only when the visible days change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys.join()]);

  const tapFree = (key: string) => (e: GestureResponderEvent) => {
    const minutes = startHour * 60 + Math.floor(((e.nativeEvent.locationY / HOUR_PX) * 60) / SNAP_MIN) * SNAP_MIN;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    onCreateAt(key, `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  };

  return (
    <View style={styles.wrap}>
      {!single ? (
        <View style={styles.headRow}>
          <View style={{ width: LABEL_W }} />
          {days.map((d, i) => {
            const isToday = keys[i] === todayKey;
            const count = (byDay.get(keys[i]) ?? []).filter((p) => !p.appt.isBlockedSlot && p.appt.status !== 'CANCELLED').length;
            return (
              <Pressable key={keys[i]} style={styles.headCell} onPress={() => onPickDay?.(d)} accessibilityRole="button">
                <Text style={typography.caption}>{[t('Paz'), t('Pzt'), t('Sal'), t('Çar'), t('Per'), t('Cum'), t('Cmt')][d.getDay()]}</Text>
                <View style={[styles.dayNum, isToday && styles.dayNumToday]}>
                  <Text style={[typography.label, { color: isToday ? colors.onBrand : colors.ink }]}>{d.getDate()}</Text>
                </View>
                <Text style={[typography.caption, { fontSize: 10 }]}>{count > 0 ? `${count}` : ' '}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <ScrollView ref={scrollRef} style={styles.scroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', height }}>
          <View style={{ width: LABEL_W }}>
            {hours.map((h) => (
              <Text key={h} style={[typography.caption, styles.hourLabel, { top: (h - startHour) * HOUR_PX - 7 }]}>
                {String(h).padStart(2, '0')}:00
              </Text>
            ))}
          </View>

          {days.map((d, di) => {
            const key = keys[di];
            const placed = byDay.get(key) ?? [];
            return (
              <View key={key} style={[styles.dayCol, di > 0 && styles.dayColDivider, key === todayKey && !single && styles.todayCol]}>
                {hours.map((h) => (
                  <View key={h} style={[styles.hourLine, { top: (h - startHour) * HOUR_PX }]} />
                ))}
                <Pressable style={styles.fill} onPress={tapFree(key)} accessibilityLabel={t('{0} boş saate randevu ekle', key)} />
                {placed.map((p) => {
                  const tone = tones[statusMeta(p.appt).tone];
                  const top = ((p.start - startHour * 60) / 60) * HOUR_PX;
                  const h = Math.max(((p.end - p.start) / 60) * HOUR_PX - 2, 22);
                  const widthPct = 100 / p.lanes;
                  const compact = h < 44 || !single;
                  const title = p.appt.isBlockedSlot ? p.appt.notes || t('Kapalı saat') : p.appt.customerName;
                  return (
                    <Animated.View
                      key={p.appt.id}
                      entering={FadeIn.duration(200)}
                      style={[styles.event, { top, height: h, left: `${p.lane * widthPct}%`, width: `${widthPct}%` }]}>
                      <Pressable
                        onPress={() => onSelect(p.appt)}
                        accessibilityRole="button"
                        accessibilityLabel={`${p.appt.startTime} ${title}`}
                        style={[
                          styles.eventInner,
                          { backgroundColor: tone.bg, borderLeftColor: tone.bar },
                          p.appt.status === 'CANCELLED' && styles.cancelled,
                        ]}>
                        <Text style={[typography.caption, { color: tone.fg, fontWeight: '700' }]} numberOfLines={1}>
                          {single ? `${p.appt.startTime}–${p.appt.endTime}` : p.appt.startTime}
                        </Text>
                        <Text style={[typography.caption, { color: colors.ink }]} numberOfLines={compact ? 1 : 2}>
                          {title}
                        </Text>
                        {!compact && p.appt.service ? (
                          <Text style={[typography.caption, { fontSize: 11 }]} numberOfLines={1}>
                            {[p.appt.service.name, p.appt.employee?.name].filter(Boolean).join(' · ')}
                          </Text>
                        ) : null}
                      </Pressable>
                    </Animated.View>
                  );
                })}
                {key === todayKey && nowTop !== null ? (
                  <View pointerEvents="none" style={[styles.nowLine, { top: nowTop }]}>
                    <View style={styles.nowDot} />
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, overflow: 'hidden' },
  headRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.line, paddingVertical: spacing.xs },
  headCell: { flex: 1, alignItems: 'center', gap: 2 },
  dayNum: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  dayNumToday: { backgroundColor: colors.brand },
  scroll: { maxHeight: 560 },
  hourLabel: { position: 'absolute', right: 6, fontSize: 10 },
  dayCol: { flex: 1, position: 'relative' },
  dayColDivider: { borderLeftWidth: 1, borderLeftColor: colors.line },
  todayCol: { backgroundColor: colors.brandSoft },
  hourLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: colors.line },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  event: { position: 'absolute', padding: 1 },
  eventInner: { flex: 1, borderRadius: 6, borderLeftWidth: 3, paddingHorizontal: 4, paddingVertical: 2, overflow: 'hidden' },
  cancelled: { opacity: 0.5 },
  nowLine: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: colors.danger },
  nowDot: { position: 'absolute', left: -4, top: -3, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger },
}));
