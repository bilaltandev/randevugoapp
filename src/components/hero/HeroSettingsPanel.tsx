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
  GripVertical,
  Check,
  Info,
  Save,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { Field, Input } from "@/components/ui/Field";

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
    const cls = "w-4 h-4";
    switch (id) {
      case "booking_cta":
        return <CalendarCheck className={cls} />;
      case "open_status":
        return <span className="h-2 w-2 rounded-full bg-brand" />;
      case "remaining_slots":
      case "working_hours":
        return <Clock className={cls} />;
      case "first_available":
        return <Sparkles className={cls} />;
      case "whatsapp":
        return <MessageSquare className={cls} />;
      case "call":
        return <Phone className={cls} />;
      case "services":
        return <Scissors className={cls} />;
      case "menu":
        return <UtensilsCrossed className={cls} />;
      case "location":
        return <MapPin className={cls} />;
      case "instagram":
        return <InstagramIcon className={cls} />;
      default:
        return <Sparkles className={cls} />;
    }
  };

  return (
    <div className="space-y-5">
      <p className="flex items-start gap-2 rounded-control border border-line bg-surface px-3 py-2.5 text-sm text-ink-2">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
        <span>
          Rezervasyon sayfanızın üst alanındaki butonları (WhatsApp, arama, konum) ve canlı durum rozetlerini
          (açık/kapalı, boş randevu sayısı, ilk müsait saat) açıp kapatabilir, sürükleyerek sıralayabilirsiniz.
          Canlı durumlar çalışma saatleriniz ve takviminizden otomatik hesaplanır.
        </span>
      </p>

      <Panel title="Önizleme" description="Sayfanızda görüneceği hali.">
        {/* Rendered on the public page's dark surface, so the preview stays dark in both panel themes. */}
        <div className="flex flex-col items-center rounded-control bg-[#0E1528] p-4 text-center sm:p-6">
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
      </Panel>

      <Panel
        title="Öğeler ve sıralama"
        description="Okları kullanın veya satırları sürükleyin."
        action={
          <Button size="sm" variant="ghost" onClick={handleResetDefaults}>
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            Varsayılana dön
          </Button>
        }
        flush
      >
        <ul className="divide-y divide-line">
          {items.map((item, index) => {
            const meta = HERO_ITEM_METADATA[item.id];
            if (!meta) return null;

            // Menu button only makes sense for restaurants
            const isMenuAndNotRestaurant = item.id === "menu" && !isRestaurant;

            return (
              <li
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={() => handleDrop(index)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 transition-colors sm:px-5",
                  draggedIndex === index && "bg-surface-muted"
                )}
              >
                <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-ink-3 active:cursor-grabbing" aria-hidden="true" />

                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-line bg-surface-muted text-ink-2",
                    !item.enabled && "opacity-50"
                  )}
                >
                  {getItemIcon(item.id)}
                </span>

                <div className={cn("min-w-0 flex-1", !item.enabled && "opacity-60")}>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="truncate text-sm font-medium text-ink">{meta.name}</span>
                    {meta.category === "status" && <span className="text-xs text-brand-ink">Canlı veri</span>}
                    {meta.restaurantOnly && <span className="text-xs text-ink-3">Yalnızca restoran</span>}
                  </div>
                  <p className="truncate text-sm text-ink-3">
                    {isMenuAndNotRestaurant
                      ? "Sektörünüz restoran olmadığı için bu buton gizlenir."
                      : meta.description}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <div className="hidden items-center sm:flex">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-8 px-0"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      title="Yukarı taşı"
                      aria-label={`${meta.name}: yukarı taşı`}
                    >
                      <MoveUp className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-8 px-0"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === items.length - 1}
                      title="Aşağı taşı"
                      aria-label={`${meta.name}: aşağı taşı`}
                    >
                      <MoveDown className="w-4 h-4" />
                    </Button>
                  </div>
                  <Switch
                    checked={item.enabled}
                    disabled={isMenuAndNotRestaurant}
                    onChange={() => handleToggle(item.id)}
                    aria-label={`${meta.name} göster`}
                    className="ml-1"
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel title="Bağlantılar">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field
            label="Instagram kullanıcı adı"
            htmlFor="hero-insta"
            hint="İsteğe bağlı. Boş bırakılırsa işletme bağlantınız kullanılır."
          >
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-3">@</span>
              <Input
                id="hero-insta"
                type="text"
                value={insta}
                onChange={(e) => {
                  setInsta(e.target.value);
                  if (onChangeInstagram) onChangeInstagram(e.target.value);
                }}
                placeholder="kuafor.ahmet"
                className="pl-7"
              />
            </div>
          </Field>

          <Field
            label="Google Haritalar bağlantısı"
            htmlFor="hero-maps"
            hint="İsteğe bağlı. Boş bırakılırsa adresinizden otomatik oluşturulur."
          >
            <Input
              id="hero-maps"
              type="text"
              value={maps}
              onChange={(e) => {
                setMaps(e.target.value);
                if (onChangeGoogleMapsUrl) onChangeGoogleMapsUrl(e.target.value);
              }}
              placeholder="https://maps.google.com/?cid=..."
            />
          </Field>
        </div>
      </Panel>

      {onSave && (
        <div className="flex justify-end">
          <Button variant="primary" onClick={onSave} disabled={isSaving} className="w-full sm:w-auto">
            {savedSuccess ? <Check className="w-4 h-4" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}
            {isSaving ? "Kaydediliyor..." : savedSuccess ? "Kaydedildi" : "Hero ayarlarını kaydet"}
          </Button>
        </div>
      )}
    </div>
  );
}
