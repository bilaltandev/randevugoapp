"use client";

import React, { useState } from "react";
import {
  Sparkles,
  MoveUp,
  MoveDown,
  CalendarCheck,
  MessageSquare,
  Phone,
  MapPin,
  Scissors,
  UtensilsCrossed,
  Clock,
  Layers,
  CheckCircle2,
  Info,
  ExternalLink,
  ShieldCheck,
  Save,
  RotateCcw,
} from "lucide-react";

// Custom Instagram icon — lucide-react doesn't export one in this version
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}
import {
  HeroActionItem,
  HeroActionItemId,
  HERO_ITEM_METADATA,
  DEFAULT_HERO_ACTION_ITEMS,
} from "@/lib/hero/types";
import { HeroRealtimeStats, calculateHeroStats } from "@/lib/hero/stats";
import { HeroActionsBar } from "./HeroActionsBar";

interface HeroSettingsPanelProps {
  business: any;
  services?: any[];
  employees?: any[];
  workingHours?: any[];
  appointments?: any[];
  heroActions?: HeroActionItem[] | null;
  instagramUsername?: string;
  googleMapsUrl?: string;
  onChangeHeroActions: (items: HeroActionItem[]) => void;
  onChangeInstagram?: (username: string) => void;
  onChangeGoogleMapsUrl?: (url: string) => void;
  onSave?: () => Promise<void>;
  isSaving?: boolean;
  savedSuccess?: boolean;
}

export function HeroSettingsPanel({
  business,
  services = [],
  employees = [],
  workingHours = [],
  appointments = [],
  heroActions,
  instagramUsername = "",
  googleMapsUrl = "",
  onChangeHeroActions,
  onChangeInstagram,
  onChangeGoogleMapsUrl,
  onSave,
  isSaving = false,
  savedSuccess = false,
}: HeroSettingsPanelProps) {
  const isRestaurant = business.sector === "RESTORAN";

  // Initialize items from saved config or default
  const [items, setItems] = useState<HeroActionItem[]>(() => {
    if (heroActions && heroActions.length > 0) {
      // Ensure any newly added metadata items exist
      const existingIds = new Set(heroActions.map((i) => i.id));
      const missing = DEFAULT_HERO_ACTION_ITEMS.filter((i) => !existingIds.has(i.id));
      return [...heroActions, ...missing];
    }
    return DEFAULT_HERO_ACTION_ITEMS;
  });

  const [insta, setInsta] = useState(instagramUsername || "");
  const [maps, setMaps] = useState(googleMapsUrl || "");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Calculate real-time stats for live preview
  const previewStats: HeroRealtimeStats = calculateHeroStats({
    workingHours: workingHours.length > 0 ? workingHours : business.workingHours || [],
    appointments,
    services,
    employees,
  });

  const handleToggle = (id: HeroActionItemId) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, enabled: !item.enabled } : item
    );
    setItems(updated);
    onChangeHeroActions(updated);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...items];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    setItems(updated);
    onChangeHeroActions(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return;
    const updated = [...items];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    setItems(updated);
    onChangeHeroActions(updated);
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;
    const updated = [...items];
    const [draggedItem] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);
    setItems(updated);
    setDraggedIndex(null);
    onChangeHeroActions(updated);
  };

  const handleResetDefaults = () => {
    setItems(DEFAULT_HERO_ACTION_ITEMS);
    onChangeHeroActions(DEFAULT_HERO_ACTION_ITEMS);
  };

  const getItemIcon = (id: HeroActionItemId) => {
    switch (id) {
      case "booking_cta":
        return <CalendarCheck className="w-4 h-4 text-emerald-400" />;
      case "open_status":
        return <span className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />;
      case "remaining_slots":
        return <Clock className="w-4 h-4 text-indigo-400" />;
      case "first_available":
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case "working_hours":
        return <Clock className="w-4 h-4 text-slate-400" />;
      case "whatsapp":
        return <MessageSquare className="w-4 h-4 text-emerald-400" />;
      case "call":
        return <Phone className="w-4 h-4 text-sky-400" />;
      case "services":
        return <Scissors className="w-4 h-4 text-indigo-400" />;
      case "menu":
        return <UtensilsCrossed className="w-4 h-4 text-amber-400" />;
      case "location":
        return <MapPin className="w-4 h-4 text-rose-400" />;
      case "instagram":
        return <InstagramIcon className="w-4 h-4 text-pink-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Information Banner */}
      <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-4 sm:p-5 flex items-start gap-3.5">
        <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <h4 className="font-bold text-slate-200">
            Hero Aksiyon & Canlı Durum Butonları Yönetimi
          </h4>
          <p className="text-slate-400 leading-relaxed">
            Public rezervasyon sayfanızın tepe alanında müşterilerinize gösterilecek aksiyon
            butonlarını (WhatsApp, Arama, Konum) ve canlı durum rozetlerini (Açık/Kapalı, Boş
            Randevu Sayısı, İlk Müsait Saat) dilediğiniz gibi açıp kapatabilir, sürükleyerek
            sıralayabilirsiniz.
          </p>
          <p className="text-emerald-400 font-semibold pt-0.5">
            ✓ Açık/kapalı durumu ve kalan boş saatler çalışma saatleriniz ve gerçek takviminizden
            otomatik olarak hesaplanır.
          </p>
        </div>
      </div>

      {/* Live Preview Box */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 sm:p-6 space-y-3 backdrop-blur-xl">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Canlı Buton Önizlemesi
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Sayfanızdaki gerçek görünüm simülasyonu
          </span>
        </div>

        <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col items-center text-center">
          <HeroActionsBar
            business={business}
            stats={previewStats}
            theme={{
              colors: {
                primary: "#6246EA",
                accentGlow: "rgba(98, 70, 234, 0.25)",
                surface: "#0E1528",
                border: "#1E2742",
                text: "#F1F5F9",
                mutedText: "#94A3B8",
              },
              radius: {
                button: "rounded-2xl",
                badge: "rounded-full",
              },
            }}
            itemsConfig={items}
            instagramUsername={insta}
            googleMapsUrl={maps}
            align="center"
          />
        </div>
      </div>

      {/* Interactive Items Reorder & Toggle List */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-200">
              Hero Öğeleri Sıralaması & Durumları
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Sıralamayı değiştirmek için yukarı/aşağı okları kullanın veya kartları sürükleyin.
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/60 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Varsayılana Sıfırla</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {items.map((item, index) => {
            const meta = HERO_ITEM_METADATA[item.id];
            if (!meta) return null;

            // Restoran harici sektörlerde menüyü gizle veya bilgilendir
            const isMenuAndNotRestaurant = item.id === "menu" && !isRestaurant;

            return (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={() => handleDrop(index)}
                className={`group flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all ${
                  item.enabled
                    ? "border-slate-800 bg-slate-800/40 hover:border-slate-700"
                    : "border-slate-800/50 bg-slate-900/40 opacity-60"
                } ${draggedIndex === index ? "opacity-50 ring-2 ring-indigo-500" : ""}`}
              >
                {/* Left: Drag Handle, Icon, and Label */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 p-1">
                    <Layers className="w-4 h-4" />
                  </div>

                  <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 shrink-0">
                    {getItemIcon(item.id)}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-200 truncate">
                        {meta.name}
                      </h4>
                      {meta.category === "status" && (
                        <span className="rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold">
                          Canlı Veri
                        </span>
                      )}
                      {meta.restaurantOnly && (
                        <span className="rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 text-[10px] font-semibold">
                          Sadece Restoran
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md mt-0.5">
                      {isMenuAndNotRestaurant
                        ? "İşletme sektörünüz restoran olmadığı için bu buton gizlenir."
                        : meta.description}
                    </p>
                  </div>
                </div>

                {/* Right: Reorder buttons & ON/OFF toggle switch */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-3">
                  <div className="flex items-center gap-1 border-r border-slate-800 pr-2">
                    <button
                      type="button"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-20 transition-colors"
                      title="Yukarı Taşı"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === items.length - 1}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-20 transition-colors"
                      title="Aşağı Taşı"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      disabled={isMenuAndNotRestaurant}
                      onChange={() => handleToggle(item.id)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Social & Maps External Links Config */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6 backdrop-blur-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-200">
          Bağlantı & Sosyal Medya Detayları
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Instagram Kullanıcı Adı (Opsiyonel)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                @
              </span>
              <input
                type="text"
                value={insta}
                onChange={(e) => {
                  setInsta(e.target.value);
                  if (onChangeInstagram) onChangeInstagram(e.target.value);
                }}
                placeholder="kuafor.ahmet"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-8 pr-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Boş bırakılırsa işletme slug bağlantınız kullanılır.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Özel Google Harita Bağlantısı (Opsiyonel)
            </label>
            <input
              type="text"
              value={maps}
              onChange={(e) => {
                setMaps(e.target.value);
                if (onChangeGoogleMapsUrl) onChangeGoogleMapsUrl(e.target.value);
              }}
              placeholder="https://maps.google.com/?cid=..."
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Boş bırakılırsa işletme adresinizden Google Haritalar araması otomatik üretilir.
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      {onSave && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>
              {isSaving
                ? "Kaydediliyor..."
                : savedSuccess
                ? "Hero Ayarları Kaydedildi! ✓"
                : "Hero Ayarlarını Kaydet"}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
