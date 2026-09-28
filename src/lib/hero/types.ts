export type HeroActionItemId =
  | "booking_cta"       // Randevu Al
  | "whatsapp"          // WhatsApp
  | "call"              // Ara
  | "location"          // Konum
  | "instagram"         // Instagram
  | "services"          // Hizmetleri Gör
  | "menu"              // Menüye Git (sadece restoran)
  | "open_status"       // Bugün Açık / Kapalı
  | "working_hours"     // Bugünün Çalışma Saatleri
  | "remaining_slots"   // Bugün Kaç Boş Randevu Kaldı
  | "first_available";  // İlk Müsait Randevu Saati

export interface HeroActionItem {
  id: HeroActionItemId;
  enabled: boolean;
  customLabel?: string;
}

export interface HeroSettingsConfig {
  items: HeroActionItem[];
  instagramUsername?: string;
  googleMapsUrl?: string;
}

export interface HeroItemMetadata {
  id: HeroActionItemId;
  name: string;
  category: "action" | "status" | "info";
  description: string;
  defaultEnabled: boolean;
  restaurantOnly?: boolean;
}

export const HERO_ITEM_METADATA: Record<HeroActionItemId, HeroItemMetadata> = {
  booking_cta: {
    id: "booking_cta",
    name: "Randevu Al (Ana Buton)",
    category: "action",
    description: "Rezervasyon motoruna hızlıca kaydıran birincil randevu butonu",
    defaultEnabled: true,
  },
  open_status: {
    id: "open_status",
    name: "Bugün Açık / Kapalı",
    category: "status",
    description: "Çalışma saatlerinden anlık hesaplanan canlı durum rozeti (Açık/Kapalı/Molada)",
    defaultEnabled: true,
  },
  remaining_slots: {
    id: "remaining_slots",
    name: "Bugün Kaç Boş Randevu Kaldı",
    category: "status",
    description: "Gerçek takvim ve randevulardan anlık hesaplanan kalan boş saat rozeti",
    defaultEnabled: true,
  },
  first_available: {
    id: "first_available",
    name: "İlk Müsait Randevu Saati",
    category: "status",
    description: "Bugün alınabilecek en erken randevu saatini otomatik gösterir",
    defaultEnabled: true,
  },
  working_hours: {
    id: "working_hours",
    name: "Bugünün Çalışma Saatleri",
    category: "info",
    description: "Bugünkü mesai saat aralığını gösterir (Örn: 09:00 - 20:00)",
    defaultEnabled: true,
  },
  whatsapp: {
    id: "whatsapp",
    name: "WhatsApp ile İletişim",
    category: "action",
    description: "WhatsApp üzerinden işletmeyle anında sohbet başlatır",
    defaultEnabled: true,
  },
  call: {
    id: "call",
    name: "Hemen Ara",
    category: "action",
    description: "İşletme telefonunu tek tıkla arama bağlantısı (tel:)",
    defaultEnabled: true,
  },
  services: {
    id: "services",
    name: "Hizmetleri Gör",
    category: "action",
    description: "Sayfadaki hizmet ve fiyat listesine doğrudan kaydırır",
    defaultEnabled: true,
  },
  menu: {
    id: "menu",
    name: "Menüye Git",
    category: "action",
    description: "Restoran işletmeleri için menü ve yemek listesine yönlendirir",
    defaultEnabled: false,
    restaurantOnly: true,
  },
  location: {
    id: "location",
    name: "Konum & Yol Tarifi",
    category: "action",
    description: "Google Haritalar üzerinden işletmeye navigasyon açar",
    defaultEnabled: true,
  },
  instagram: {
    id: "instagram",
    name: "Instagram Profili",
    category: "action",
    description: "İşletmenin resmi Instagram sayfasına bağlantı verir",
    defaultEnabled: false,
  },
};

export const DEFAULT_HERO_ACTION_ITEMS: HeroActionItem[] = [
  { id: "booking_cta", enabled: true },
  { id: "open_status", enabled: true },
  { id: "remaining_slots", enabled: true },
  { id: "first_available", enabled: true },
  { id: "working_hours", enabled: true },
  { id: "whatsapp", enabled: true },
  { id: "call", enabled: true },
  { id: "services", enabled: true },
  { id: "location", enabled: true },
  { id: "instagram", enabled: false },
  { id: "menu", enabled: false },
];
