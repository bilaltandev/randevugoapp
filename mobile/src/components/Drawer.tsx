import { Image } from 'expo-image';
import { router, usePathname, type Href } from 'expo-router';
import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { BackHandler, Linking, Pressable, ScrollView, Share, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, FadeInLeft, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


import { absoluteUrl, isRestaurantSector, publicPageUrl, SECTORS } from '@/api/panel';
import { useAccount, useAuth } from '@/auth/AuthProvider';
import { AppMark } from '@/components/AppMark';
import { Icon, icons, type IconName } from '@/components/Icon';
import { makeStyles, radius, spacing, useTheme } from '@/theme';
import { localeTag, t } from '@/i18n';

type DrawerValue = { open: () => void; close: () => void };
const DrawerContext = createContext<DrawerValue>({ open: () => {}, close: () => {} });

export const useDrawer = () => use(DrawerContext);

type Item = { title: string; href: Href; icon: IconName; match: string };
type Group = { label: string; items: Item[] };

/** The web panel's sidebar (DashboardSidebar): same groups, items and order. */
function menuGroups(restaurant: boolean, isMember: boolean): Group[] {
  // Team members only work with their own bookings; every other screen is the owner's.
  if (isMember) {
    return [
      {
        label: t('Günlük'),
        items: [
          { title: t('Özet'), href: '/', icon: icons.overview, match: '/' },
          { title: t('Takvim'), href: '/calendar', icon: icons.calendar, match: '/calendar' },
          { title: t('Rezervasyonlar'), href: '/appointments', icon: icons.appointments, match: '/appointments' },
        ],
      },
      {
        label: t('Ekip'),
        items: [{ title: t('Ekip'), href: '/team', icon: icons.employees, match: '/team' }],
      },
      {
        label: t('Hesap'),
        items: [{ title: t('Profil'), href: '/profile', icon: icons.profile, match: '/profile' }],
      },
    ];
  }
  return [
    {
      label: t('Günlük'),
      items: [
        { title: t('Özet'), href: '/', icon: icons.overview, match: '/' },
        { title: t('Takvim'), href: '/calendar', icon: icons.calendar, match: '/calendar' },
        { title: t('Rezervasyonlar'), href: '/appointments', icon: icons.appointments, match: '/appointments' },
        ...(restaurant ? [{ title: t('Masa Planı'), href: '/tables' as Href, icon: icons.tables, match: '/tables' }] : []),
        { title: t('Müşteriler'), href: '/customers', icon: icons.customers, match: '/customers' },
      ],
    },
    {
      label: t('İşletme'),
      items: [
        { title: t('Hizmetler'), href: '/services', icon: icons.services, match: '/services' },
        { title: t('Çalışanlar'), href: '/employees', icon: icons.employees, match: '/employees' },
        { title: t('Yorumlar'), href: '/reviews', icon: icons.reviews, match: '/reviews' },
        { title: t('İstatistikler'), href: '/analytics', icon: icons.analytics, match: '/analytics' },
      ],
    },
    {
      label: t('Vitrin'),
      items: [
        { title: t('Web Sitesi Düzenleyici'), href: '/page-builder', icon: icons.pageBuilder, match: '/page-builder' },
        { title: t('Galeri & Portföy'), href: '/gallery', icon: icons.gallery, match: '/gallery' },
      ],
    },
    {
      label: t('Hesap'),
      items: [
        { title: t('Profil & Abonelik'), href: '/profile', icon: icons.profile, match: '/profile' },
        { title: t('İşletme Ayarları'), href: '/settings', icon: icons.settings, match: '/settings' },
        { title: t('Destek'), href: '/support', icon: icons.support, match: '/support' },
      ],
    },
  ];
}

const DURATION = 260;

/** Animated side menu, opened by the hamburger button in the top-left corner of the main screens. */
export function DrawerProvider({ children, enabled }: { children: ReactNode; enabled: boolean }) {
  const { width } = useWindowDimensions();
  const panelWidth = Math.min(320, Math.round(width * 0.84));
  const progress = useSharedValue(0);
  const [visible, setVisible] = useState(false);

  const open = useCallback(() => {
    setVisible(true);
    progress.set(withTiming(1, { duration: DURATION, easing: Easing.out(Easing.cubic) }));
  }, [progress]);

  const close = useCallback(() => {
    progress.set(
      withTiming(0, { duration: DURATION - 40, easing: Easing.in(Easing.cubic) }, (done) => {
        if (done) runOnJS(setVisible)(false);
      })
    );
  }, [progress]);

  // Android back button closes the menu first.
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      close();
      return true;
    });
    return () => sub.remove();
  }, [visible, close]);

  // Signing out closes the menu.
  useEffect(() => {
    if (!enabled && visible) close();
  }, [enabled, visible, close]);

  const value = useMemo(() => ({ open, close }), [open, close]);

  // Drag the panel to the left to close it.
  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .onUpdate((e) => {
      progress.set(Math.max(0, Math.min(1, 1 + e.translationX / panelWidth)));
    })
    .onEnd((e) => {
      if (e.velocityX < -400 || progress.get() < 0.6) {
        progress.set(
          withTiming(0, { duration: 180 }, (done) => {
            if (done) runOnJS(setVisible)(false);
          })
        );
      } else {
        progress.set(withTiming(1, { duration: 180 }));
      }
    });

  const panelStyle = useAnimatedStyle(() => ({ transform: [{ translateX: (progress.get() - 1) * panelWidth }] }));
  const scrimStyle = useAnimatedStyle(() => ({ opacity: progress.get() }));

  return (
    <DrawerContext value={value}>
      {children}
      {visible && enabled ? (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="box-none">
          <Scrim style={scrimStyle} onPress={close} />
          <GestureDetector gesture={pan}>
            <Animated.View style={[{ position: 'absolute', top: 0, bottom: 0, left: 0, width: panelWidth }, panelStyle]}>
              <DrawerContent onNavigate={close} />
            </Animated.View>
          </GestureDetector>
        </View>
      ) : null}
    </DrawerContext>
  );
}

function Scrim({ style, onPress }: { style: object; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.scrim }, style]}>
      <Pressable style={{ flex: 1 }} onPress={onPress} accessibilityRole="button" accessibilityLabel={t('Menüyü kapat')} />
    </Animated.View>
  );
}

function DrawerContent({ onNavigate }: { onNavigate: () => void }) {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const { isMember } = useAccount();
  const business = profile?.business;
  const pageUrl = business ? publicPageUrl(business.slug) : null;
  const logo = absoluteUrl(business?.logo);
  const sector = SECTORS.find((s) => s.id === business?.sector)?.name ?? t('Hizmet İşletmesi');

  const go = (href: Href) => {
    onNavigate();
    // Let the close animation start before the next screen pushes.
    setTimeout(() => router.navigate(href), 60);
  };

  let index = 0;
  return (
    <View style={[styles.panel, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md }]}>
      <View style={styles.header}>
        {logo ? (
          <Image source={{ uri: logo }} style={styles.logo} contentFit="cover" alt="" />
        ) : (
          <AppMark size={44} />
        )}
        <View style={styles.flex}>
          <Text style={typography.heading} numberOfLines={1}>
            {business?.name ?? t('CalendlyGo')}
          </Text>
          <Text style={typography.caption} numberOfLines={1}>
            {sector}
          </Text>
        </View>
        <Pressable onPress={onNavigate} hitSlop={12} accessibilityRole="button" accessibilityLabel={t('Menüyü kapat')}>
          <Icon name={icons.close} size={20} />
        </Pressable>
      </View>

      {pageUrl && business ? (
        <View style={styles.links}>
          <Chip icon={icons.open} label={t('Sayfayı aç')} onPress={() => Linking.openURL(pageUrl)} />
          <Chip
            icon={icons.share}
            label={t('Paylaş')}
            onPress={() => Share.share({ message: t('{0} için online randevu: {1}', business.name, pageUrl), url: pageUrl }).catch(() => {})}
          />
        </View>
      ) : null}

      <ScrollView style={styles.flex} contentContainerStyle={styles.groups} showsVerticalScrollIndicator={false}>
        {menuGroups(isRestaurantSector(business?.sector), isMember).map((group) => (
          <View key={group.label} style={styles.group}>
            <Text style={[typography.caption, styles.groupLabel]}>{group.label.toLocaleUpperCase(localeTag())}</Text>
            {group.items.map((item) => {
              const active = item.match === '/' ? pathname === '/' : pathname.startsWith(item.match);
              const delay = 40 + index++ * 22;
              return (
                <Animated.View key={item.title} entering={FadeInLeft.delay(delay).duration(220)}>
                  <Pressable
                    onPress={() => go(item.href)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={({ pressed }) => [styles.item, active && styles.itemActive, pressed && !active && styles.itemPressed]}>
                    <Icon name={item.icon} size={20} color={active ? colors.brand : colors.ink2} />
                    <Text style={[typography.body, styles.itemLabel, active && { color: colors.brand, fontWeight: '600' }]}>{item.title}</Text>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <Pressable onPress={signOut} accessibilityRole="button" style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}>
        <Icon name={icons.logout} size={20} color={colors.danger} />
        <Text style={[typography.body, { color: colors.danger, fontWeight: '600' }]}>{t('Çıkış yap')}</Text>
      </Pressable>
      <Text style={[typography.caption, styles.footer]}>{t('CalendlyGo by VASTLAB')}</Text>
    </View>
  );
}

function Chip({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const { colors, typography } = useTheme();
  const styles = useStyles();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.chip, pressed && styles.itemPressed]}>
      <Icon name={icon} size={15} color={colors.brand} />
      <Text style={[typography.label, { color: colors.brand }]}>{label}</Text>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  panel: {
    flex: 1,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderTopRightRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 4, height: 0 },
    elevation: 16,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.sm, paddingBottom: spacing.md },
  logo: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  flex: { flex: 1 },
  links: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.sm, paddingBottom: spacing.md },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.brandSoft,
  },
  groups: { gap: spacing.lg, paddingBottom: spacing.lg },
  group: { gap: 2 },
  groupLabel: { letterSpacing: 0.8, paddingHorizontal: spacing.sm, paddingBottom: spacing.xs },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.md, paddingVertical: 11, borderRadius: radius.md },
  itemActive: { backgroundColor: colors.brandSoft },
  itemPressed: { backgroundColor: colors.surfaceMuted },
  itemLabel: { flex: 1, color: colors.ink },
  footer: { textAlign: 'center', paddingTop: spacing.sm },
}));
