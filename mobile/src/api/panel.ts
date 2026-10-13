import type { AuthClient } from '@/api/authClient';
import type { Appointment } from '@/lib/appointments';
import { API_URL } from '@/config';
import { t } from '@/i18n';

// Panel modules that mirror the web dashboard (overview, reviews, analytics, tables, page, gallery,
// subscription, support). Shapes list only the fields the app uses.

/** Uploaded files come back as "/uploads/…"; images need the server address in front. */
export function absoluteUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return API_URL ? `${API_URL.replace(/\/+$/, '')}${url.startsWith('/') ? '' : '/'}${url}` : null;
}

/** The public booking page of a business. */
export function publicPageUrl(slug: string): string | null {
  return absoluteUrl(`/${slug}`);
}

// ---- Overview ("Özet") ----

export type DashboardSummary = {
  todayStr: string;
  last7: string[];
  todayAppointments: Appointment[];
  pendingAppointments: Appointment[];
  pendingCount: number;
  upcomingAppointments: Appointment[];
  completedThisMonthCount: number;
  monthRevenue: number;
  reviewCount: number;
  avgRating: number | null;
  bookingsPerDay: number[];
  revenuePerDay: number[];
  subscription: { status: string; daysRemaining: number };
};

export function fetchSummary(client: AuthClient) {
  return client.request<DashboardSummary>('/api/dashboard/summary');
}

// ---- Reviews ----

export type Review = {
  id: string;
  rating: number;
  comment: string;
  customerName: string;
  businessReply: string | null;
  replyDate: string | null;
  createdAt: string;
  appointment: { service: { name: string } | null } | null;
  employee: { name: string } | null;
};

export async function fetchReviews(client: AuthClient) {
  return client.request<{ reviews: Review[]; averageRating: string; totalReviews: number }>('/api/reviews');
}

export async function replyToReview(client: AuthClient, id: string, businessReply: string) {
  await client.request('/api/reviews', { method: 'PATCH', body: { id, businessReply } });
}

// ---- Analytics ----

export type AnalyticsCustomer = { id: string; totalAppointments: number };

export async function fetchAnalyticsData(client: AuthClient) {
  const [appointments, customers] = await Promise.all([
    client.request<{ appointments: Appointment[] }>('/api/appointments'),
    client.request<{ customers: AnalyticsCustomer[] }>('/api/customers'),
  ]);
  // Closed slots are not bookings; the web statistics leave them out too.
  return { appointments: (appointments.appointments ?? []).filter((a) => !a.isBlockedSlot), customers: customers.customers ?? [] };
}

export type AiInsights = { peakHoursAnalysis: string; actionableTips: string[] };

export async function fetchAiInsights(client: AuthClient, business: { name: string; sector: string | null }): Promise<AiInsights | null> {
  const body = await client.request<{ data?: { aiInsights?: AiInsights } }>('/api/ai/generate-business', {
    method: 'POST',
    body: {
      prompt: `${business.name} (${business.sector ?? ''}) için işletme büyüme ve yoğun saat optimizasyon analizi`,
      sector: business.sector,
    },
  });
  return body.data?.aiInsights ?? null;
}

// ---- Restaurant tables ----

export type TableShape = 'ROUND' | 'SQUARE' | 'RECTANGLE';
export type TableStatus = 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'OUT_OF_SERVICE';

export type RestaurantArea = { id: string; name: string; sortOrder: number };

export type RestaurantTable = {
  id: string;
  name: string;
  capacity: number;
  shape: TableShape;
  areaId: string | null;
  area: RestaurantArea | null;
  description: string | null;
  isActive: boolean;
  status: TableStatus;
  computedStatus: TableStatus;
  positionX: number;
  positionY: number;
  currentAppointment: { startTime?: string; endTime?: string; customerName?: string; customerPhone?: string; status?: string } | null;
};

export async function fetchTables(client: AuthClient, date: string) {
  const [areas, tables] = await Promise.all([
    client.request<{ areas: RestaurantArea[] }>('/api/restaurant/areas'),
    client.request<{ tables: RestaurantTable[] }>(`/api/restaurant/tables?date=${encodeURIComponent(date)}`),
  ]);
  return { areas: areas.areas ?? [], tables: tables.tables ?? [] };
}

export type TableInput = {
  name: string;
  capacity: number;
  shape: TableShape;
  areaId: string | null;
  description: string | null;
  isActive: boolean;
  status: TableStatus;
};

export async function createTable(client: AuthClient, input: TableInput & { positionX: number; positionY: number }) {
  await client.request('/api/restaurant/tables', { method: 'POST', body: input });
}

export async function updateTable(client: AuthClient, id: string, input: Partial<TableInput>) {
  await client.request('/api/restaurant/tables', { method: 'PATCH', body: { id, ...input } });
}

export async function deleteTable(client: AuthClient, id: string) {
  await client.request(`/api/restaurant/tables?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function createArea(client: AuthClient, name: string) {
  await client.request('/api/restaurant/areas', { method: 'POST', body: { name } });
}

export async function renameArea(client: AuthClient, id: string, name: string) {
  await client.request('/api/restaurant/areas', { method: 'PATCH', body: { id, name } });
}

export async function deleteArea(client: AuthClient, id: string) {
  await client.request(`/api/restaurant/areas?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ---- Page builder (Vitrin) ----

export type ThemeSummary = {
  id: string;
  name: string;
  tagline: string;
  badge: string | null;
  colors: { background: string; surface: string; primary: string; text: string };
  suggestedAccents: { hex: string; label: string }[];
};

export type HeroAction = { id: string; enabled: boolean; customLabel?: string };

/** Web page settings kept in Page.themeOverrides (JSON); the app merges its changes into the stored object. */
export type ThemeOverrides = {
  layoutId?: string;
  primaryColor?: string;
  ctaColor?: string;
  customTitle?: string;
  customSubtitle?: string;
  customCtaText?: string;
  coverImage?: string;
  heroBgType?: 'image' | 'video' | 'color';
  showLogo?: boolean;
  showSlogan?: boolean;
  sloganText?: string;
  heroActions?: HeroAction[];
  instagramUsername?: string;
  googleMapsUrl?: string;
  [key: string]: unknown;
};

export type PageEditor = {
  page: { isPublished: boolean; seoTitle: string | null; seoDescription: string | null; themeOverrides: string | null };
  business: { name: string; slug: string; sector: string; description: string | null; coverImage: string | null; logo: string | null };
  editor: {
    activeThemeId: string;
    sectionOrder: string[];
    hiddenSections: string[];
    recommendedThemeIds: string[];
    themes: ThemeSummary[];
    layouts: { id: string; name: string; description: string }[];
    heroItems: { id: string; name: string; description: string; restaurantOnly: boolean }[];
    defaultHeroActions: HeroAction[];
  };
};

export function fetchPageEditor(client: AuthClient) {
  return client.request<PageEditor>('/api/page-builder');
}

export type PageUpdate = {
  themeId?: string;
  themeOverrides?: Record<string, unknown>;
  sectionOrder?: string[];
  hiddenSections?: string[];
  isPublished?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  coverImage?: string;
  businessName?: string;
  businessDescription?: string;
};

export async function updatePage(client: AuthClient, update: PageUpdate) {
  await client.request('/api/page-builder', { method: 'POST', body: update });
}

// ---- Uploads ----

export type PickedImage = { uri: string; mimeType?: string | null; fileName?: string | null };

export function imageForm(image: PickedImage): FormData {
  const form = new FormData();
  const type = image.mimeType || 'image/jpeg';
  const name = image.fileName || `foto.${type.split('/')[1] || 'jpg'}`;
  // React Native's FormData takes a { uri, name, type } descriptor for files.
  form.append('file', { uri: image.uri, name, type } as unknown as Blob);
  return form;
}

/** Stores an image for the gallery or the cover; returns its "/uploads/…" path. */
export async function uploadImage(client: AuthClient, image: PickedImage): Promise<string> {
  return (await client.request<{ url: string }>('/api/gallery/upload', { method: 'POST', body: imageForm(image) })).url;
}

export async function uploadLogo(client: AuthClient, image: PickedImage): Promise<string> {
  return (await client.request<{ url: string }>('/api/business/upload-logo', { method: 'POST', body: imageForm(image) })).url;
}

export async function removeLogo(client: AuthClient) {
  await client.request('/api/business/upload-logo', { method: 'DELETE' });
}

// ---- Gallery ----

export type GalleryItem = { id: string; imageUrl: string; title: string | null; description: string | null; isActive: boolean; sortOrder: number };
export type Gallery = { id: string; enabled: boolean; showTitle: boolean; title: string | null; subtitle: string | null; items: GalleryItem[] };

export async function fetchGallery(client: AuthClient) {
  return client.request<{ gallery: Gallery; isFeatureEnabled: boolean }>('/api/gallery');
}

export async function updateGallery(client: AuthClient, update: Partial<Pick<Gallery, 'enabled' | 'showTitle' | 'title' | 'subtitle'>>) {
  await client.request('/api/gallery', { method: 'POST', body: update });
}

export async function saveGalleryItem(
  client: AuthClient,
  item: { id?: string; imageUrl: string; title?: string | null; description?: string | null; isActive?: boolean }
) {
  await client.request('/api/gallery/items', { method: 'POST', body: item });
}

export async function deleteGalleryItem(client: AuthClient, id: string) {
  await client.request(`/api/gallery/items?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function reorderGallery(client: AuthClient, itemIds: string[]) {
  await client.request('/api/gallery/items/reorder', { method: 'PUT', body: { itemIds } });
}

// ---- Subscription ----

export type BillingPeriod = 'MONTHLY' | 'YEARLY';

export type SubscriptionInfo = {
  subscription: {
    status: string;
    planType: string;
    trialEndDate: string | null;
    subscriptionEndDate: string | null;
    paymentProvider: string | null;
    monthlyPrice: number;
  };
  /** Older servers don't send it; `isExpired` then tells the same. */
  access?: { active: boolean; kind: 'trial' | 'paid' | 'expired'; endsAt?: string | null };
  daysRemaining: number;
  isExpired: boolean;
  monthlyPrice: number;
  plan?: 'PERSON' | 'TEAM';
  /** Monthly prices only (older servers). Prefer `prices`. */
  planPrices?: Record<'PERSON' | 'TEAM', number>;
  billingPeriod?: BillingPeriod;
  /** USD price of every plan and billing period for this business. */
  prices?: Record<'PERSON' | 'TEAM', Record<BillingPeriod, number>>;
  /** USD→TRY (TCMB selling rate) used for the bank transfer amount; null when unknown. */
  rate?: { rate: number; date: string; source: string } | null;
  /** Open bank transfer request waiting for the admin. Amounts in USD; `amountTry` is what to transfer. */
  payment?: {
    requestedAt: string;
    amount: number;
    amountTry?: number | null;
    rate?: number | null;
    billingPeriod?: BillingPeriod;
    couponCode: string | null;
  } | null;
  bank?: { iban: string; accountName: string; bankName: string } | null;
  reference?: string;
  activeDiscount?: { code: string; percentOff: number; monthsRemaining: number } | null;
};

export function fetchSubscription(client: AuthClient) {
  return client.request<SubscriptionInfo>('/api/subscription');
}

/** "Satın al": records a bank transfer notice for the admin to confirm. Never activates anything itself. */
export function requestPayment(client: AuthClient, plan: 'PERSON' | 'TEAM', billingPeriod: BillingPeriod, couponCode?: string) {
  return client.request<{ success: boolean; amount: number; amountTry: number | null; percentOff: number; appliedCode: string | null }>(
    '/api/subscription',
    { method: 'POST', body: { plan, billingPeriod, couponCode } }
  );
}

/** Checks a discount code; the percentage applies to whichever plan is bought. */
export function checkCoupon(client: AuthClient, code: string) {
  return client.request<{ code: string; percentOff: number; durationMonths: number }>('/api/subscription/coupon', {
    method: 'POST',
    body: { code },
  });
}

// ---- Support ----

export type TicketSummary = {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  updatedAt: string;
  messageCount: number;
  awaitingOwner: boolean;
};

export type TicketMessage = { id: string; authorName: string; authorRole: 'OWNER' | 'SUPPORT' | string; body: string; createdAt: string };

export type TicketDetail = {
  ticket: { id: string; subject: string; category: string; priority: string; status: string; createdAt: string; assignedToName: string | null };
  messages: TicketMessage[];
};

export async function fetchTickets(client: AuthClient) {
  return (await client.request<{ tickets: TicketSummary[] }>('/api/tickets')).tickets ?? [];
}

export function fetchTicket(client: AuthClient, id: string) {
  return client.request<TicketDetail>(`/api/tickets/${encodeURIComponent(id)}`);
}

export async function createTicket(client: AuthClient, input: { subject: string; message: string; category: string; priority: string }) {
  return (await client.request<{ ticket: { id: string } }>('/api/tickets', { method: 'POST', body: input })).ticket;
}

export async function replyToTicket(client: AuthClient, id: string, body: string) {
  await client.request(`/api/tickets/${encodeURIComponent(id)}`, { method: 'POST', body: { body } });
}

export async function closeTicket(client: AuthClient, id: string) {
  await client.request(`/api/tickets/${encodeURIComponent(id)}`, { method: 'PATCH', body: { status: 'CLOSED' } });
}

// Same labels as src/lib/supportOptions.ts on the web.
export const TICKET_STATUSES: Record<string, string> = { OPEN: t('Açık'), IN_PROGRESS: t('İşlemde'), RESOLVED: t('Çözüldü'), CLOSED: t('Kapatıldı') };
export const TICKET_PRIORITIES = [
  { id: 'LOW', label: t('Düşük') },
  { id: 'NORMAL', label: t('Normal') },
  { id: 'HIGH', label: t('Yüksek') },
  { id: 'URGENT', label: t('Acil') },
] as const;
export const TICKET_CATEGORIES = [
  { id: 'GENERAL', label: t('Genel') },
  { id: 'TECHNICAL', label: t('Teknik sorun') },
  { id: 'BILLING', label: t('Ödeme & abonelik') },
  { id: 'ACCOUNT', label: t('Hesap & giriş') },
] as const;
export const MAX_SUBJECT_LENGTH = 150;
export const MAX_MESSAGE_LENGTH = 5000;

// Same list as SECTORS in src/lib/utils.ts on the web.
export const SECTORS = [
  { id: 'BERBER', name: t('Erkek Kuaförü & Berber') },
  { id: 'GUZELLIK', name: t('Güzellik & Cilt Bakımı') },
  { id: 'RESTORAN', name: t('Restoran & Kafe') },
  { id: 'KLINIK', name: t('Klinik & Sağlık Merkezi') },
  { id: 'OTO_SERVIS', name: t('Oto Servis & Ekspertiz') },
  { id: 'DIGER', name: t('Diğer Hizmet Sektörleri') },
] as const;

export const isRestaurantSector = (sector: string | null | undefined) => sector === 'RESTORAN' || sector === 'RESTAURANT';

// ---- Account (Profil) ----

export type Account = { id: string; name: string; email: string; phone: string | null; createdAt: string };

export async function fetchAccount(client: AuthClient) {
  return (await client.request<{ user: Account }>('/api/mobile/account')).user;
}

export async function updateAccount(client: AuthClient, input: { name: string; email: string; phone: string; currentPassword?: string }) {
  return (await client.request<{ user: Account }>('/api/mobile/account', { method: 'PATCH', body: input })).user;
}

export async function changePassword(client: AuthClient, currentPassword: string, newPassword: string) {
  return client.request<{ signedOutDevices: number }>('/api/mobile/account/password', { method: 'POST', body: { currentPassword, newPassword } });
}
