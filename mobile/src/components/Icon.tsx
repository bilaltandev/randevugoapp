import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import { useTheme } from '@/theme';

type Names = Extract<SymbolViewProps['name'], { ios?: unknown }>;

export type IconName = { ios: Names['ios']; android: Names['android'] };

/** SF Symbol on iOS, Material Symbol on Android/web — the same pairs the tab bar uses. */
export function Icon({ name, size = 22, color }: { name: IconName; size?: number; color?: string }) {
  const { colors } = useTheme();
  return <SymbolView name={{ ios: name.ios, android: name.android, web: name.android }} size={size} tintColor={color ?? colors.ink2} />;
}

/** Every icon of the app in one place, so screens stay consistent. */
export const icons = {
  menu: { ios: 'line.3.horizontal', android: 'menu' },
  close: { ios: 'xmark', android: 'close' },
  home: { ios: 'house', android: 'home' },
  overview: { ios: 'square.grid.2x2', android: 'dashboard' },
  calendar: { ios: 'calendar', android: 'calendar_month' },
  appointments: { ios: 'calendar.badge.checkmark', android: 'event_available' },
  tables: { ios: 'fork.knife', android: 'table_restaurant' },
  customers: { ios: 'person.text.rectangle', android: 'badge' },
  services: { ios: 'scissors', android: 'content_cut' },
  employees: { ios: 'person.2', android: 'groups' },
  reviews: { ios: 'star', android: 'star' },
  analytics: { ios: 'chart.bar.xaxis', android: 'bar_chart' },
  pageBuilder: { ios: 'paintpalette', android: 'palette' },
  gallery: { ios: 'photo.on.rectangle', android: 'photo_library' },
  subscription: { ios: 'creditcard', android: 'credit_card' },
  settings: { ios: 'gearshape', android: 'settings' },
  support: { ios: 'lifepreserver', android: 'support_agent' },
  profile: { ios: 'person.crop.circle', android: 'account_circle' },
  open: { ios: 'arrow.up.right.square', android: 'open_in_new' },
  share: { ios: 'square.and.arrow.up', android: 'share' },
  logout: { ios: 'rectangle.portrait.and.arrow.right', android: 'logout' },
  add: { ios: 'plus', android: 'add' },
  lock: { ios: 'lock', android: 'lock' },
  clock: { ios: 'clock', android: 'schedule' },
  phone: { ios: 'phone', android: 'call' },
  mail: { ios: 'envelope', android: 'mail' },
  edit: { ios: 'pencil', android: 'edit' },
  trash: { ios: 'trash', android: 'delete' },
  check: { ios: 'checkmark', android: 'check' },
  checkCircle: { ios: 'checkmark.circle', android: 'check_circle' },
  cancel: { ios: 'xmark.circle', android: 'cancel' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right' },
  chevronLeft: { ios: 'chevron.left', android: 'chevron_left' },
  search: { ios: 'magnifyingglass', android: 'search' },
  sun: { ios: 'sun.max', android: 'light_mode' },
  moon: { ios: 'moon', android: 'dark_mode' },
  auto: { ios: 'circle.lefthalf.filled', android: 'contrast' },
  key: { ios: 'key', android: 'key' },
  business: { ios: 'building.2', android: 'storefront' },
  hours: { ios: 'clock.badge.checkmark', android: 'more_time' },
  money: { ios: 'turkishlirasign.circle', android: 'payments' },
  hourglass: { ios: 'hourglass', android: 'hourglass_top' },
  image: { ios: 'photo', android: 'image' },
  globe: { ios: 'globe', android: 'language' },
  sparkles: { ios: 'sparkles', android: 'auto_awesome' },
  chat: { ios: 'bubble.left.and.bubble.right', android: 'forum' },
  arrowUp: { ios: 'arrow.up', android: 'arrow_upward' },
  arrowDown: { ios: 'arrow.down', android: 'arrow_downward' },
  eye: { ios: 'eye', android: 'visibility' },
  eyeSlash: { ios: 'eye.slash', android: 'visibility_off' },
  wifiOff: { ios: 'wifi.slash', android: 'wifi_off' },
  refresh: { ios: 'arrow.clockwise', android: 'refresh' },
  trendUp: { ios: 'chart.line.uptrend.xyaxis', android: 'trending_up' },
  people: { ios: 'person.3', android: 'diversity_3' },
  repeat: { ios: 'arrow.triangle.2.circlepath', android: 'autorenew' },
  block: { ios: 'nosign', android: 'block' },
  user: { ios: 'person', android: 'person' },
  list: { ios: 'list.bullet', android: 'view_list' },
  grid: { ios: 'square.grid.3x3', android: 'grid_view' },
  day: { ios: 'calendar.day.timeline.left', android: 'view_day' },
  week: { ios: 'calendar', android: 'view_week' },
  today: { ios: 'scope', android: 'today' },
} satisfies Record<string, IconName>;
