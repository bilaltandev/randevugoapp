"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  CalendarCheck2,
  CalendarDays,
  CalendarPlus,
  Camera,
  Contact2,
  Copy,
  CreditCard,
  ExternalLink,
  LayoutDashboard,
  LifeBuoy,
  Lock,
  Moon,
  Palette,
  Scissors,
  Search,
  Settings,
  Star,
  Sun,
  User,
  Users2,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Command {
  id: string;
  group: "İşlemler" | "Sayfalar" | "Müşteriler";
  label: string;
  hint?: string;
  icon: LucideIcon;
  keywords?: string;
  run: () => void;
}

/** Case- and accent-insensitive Turkish matching ("musteri" finds "Müşteriler"). */
function fold(text: string) {
  return text
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessSlug: string;
  isRestaurant: boolean;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

type CustomerHit = { id: string; name: string; phone?: string | null };

export function CommandPalette(props: CommandPaletteProps) {
  const { open, onOpenChange } = props;
  // Kept here so the list survives closing; loaded the first time the palette opens.
  const [customers, setCustomers] = useState<CustomerHit[] | null>(null);

  // Ctrl+K / ⌘K anywhere in the dashboard.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  // Mounting the dialog only while open gives every opening a fresh query and selection.
  if (!open) return null;
  return <PaletteDialog {...props} customers={customers} onCustomersLoaded={setCustomers} />;
}

function PaletteDialog({
  onOpenChange,
  businessSlug,
  isRestaurant,
  theme,
  onToggleTheme,
  customers,
  onCustomersLoaded,
}: CommandPaletteProps & { customers: CustomerHit[] | null; onCustomersLoaded: (list: CustomerHit[]) => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    if (customers !== null) return;
    fetch("/api/customers")
      .then((r) => (r.ok ? r.json() : { customers: [] }))
      .then((d) => onCustomersLoaded((d.customers ?? []).map((c: CustomerHit) => ({ id: c.id, name: c.name, phone: c.phone }))))
      .catch(() => onCustomersLoaded([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const go = (href: string) => () => {
    onOpenChange(false);
    router.push(href);
  };

  const commands = useMemo<Command[]>(() => {
    const actions: Command[] = [
      { id: "new", group: "İşlemler", label: "Yeni randevu oluştur", icon: CalendarPlus, keywords: "ekle randevu rezervasyon", run: go("/dashboard/calendar?new=1") },
      { id: "block", group: "İşlemler", label: "Saat kapat veya mola ekle", icon: Lock, keywords: "kapat mola blok", run: go("/dashboard/calendar") },
      {
        id: "open-page",
        group: "İşlemler",
        label: "Rezervasyon sayfamı aç",
        hint: `/${businessSlug}`,
        icon: ExternalLink,
        keywords: "site vitrin sayfa",
        run: () => {
          onOpenChange(false);
          window.open(`/${businessSlug}`, "_blank", "noopener");
        },
      },
      {
        id: "copy-link",
        group: "İşlemler",
        label: "Rezervasyon bağlantısını kopyala",
        icon: Copy,
        keywords: "link paylas",
        run: () => {
          navigator.clipboard.writeText(`${window.location.origin}/${businessSlug}`);
          onOpenChange(false);
        },
      },
      {
        id: "theme",
        group: "İşlemler",
        label: theme === "light" ? "Koyu temaya geç" : "Açık temaya geç",
        icon: theme === "light" ? Moon : Sun,
        keywords: "tema karanlik aydinlik dark light",
        run: () => {
          onToggleTheme();
          onOpenChange(false);
        },
      },
    ];
    const pages: Command[] = [
      { id: "p-overview", group: "Sayfalar", label: "Özet", icon: LayoutDashboard, keywords: "ana sayfa dashboard bugun", run: go("/dashboard") },
      { id: "p-calendar", group: "Sayfalar", label: "Takvim", icon: CalendarDays, run: go("/dashboard/calendar") },
      { id: "p-appointments", group: "Sayfalar", label: "Rezervasyonlar", icon: CalendarCheck2, keywords: "randevular", run: go("/dashboard/appointments") },
      ...(isRestaurant ? [{ id: "p-tables", group: "Sayfalar" as const, label: "Masa planı", icon: UtensilsCrossed, run: go("/dashboard/tables") }] : []),
      { id: "p-customers", group: "Sayfalar", label: "Müşteriler", icon: Contact2, run: go("/dashboard/customers") },
      { id: "p-services", group: "Sayfalar", label: "Hizmetler", icon: Scissors, keywords: "fiyat menu", run: go("/dashboard/services") },
      { id: "p-employees", group: "Sayfalar", label: "Çalışanlar", icon: Users2, keywords: "ekip personel uzman", run: go("/dashboard/employees") },
      { id: "p-reviews", group: "Sayfalar", label: "Yorumlar", icon: Star, keywords: "degerlendirme puan", run: go("/dashboard/reviews") },
      { id: "p-analytics", group: "Sayfalar", label: "İstatistikler", icon: BarChart3, keywords: "rapor gelir analiz", run: go("/dashboard/analytics") },
      { id: "p-builder", group: "Sayfalar", label: "Sayfa düzenleyici", icon: Palette, keywords: "tema tasarim vitrin", run: go("/dashboard/page-builder") },
      { id: "p-gallery", group: "Sayfalar", label: "Galeri ve portföy", icon: Camera, keywords: "fotograf", run: go("/dashboard/page-builder?tab=gallery") },
      { id: "p-subscription", group: "Sayfalar", label: "Abonelik", icon: CreditCard, keywords: "odeme plan kupon", run: go("/dashboard/subscription") },
      { id: "p-settings", group: "Sayfalar", label: "Ayarlar", icon: Settings, keywords: "calisma saatleri isletme bilgileri", run: go("/dashboard/settings") },
      { id: "p-support", group: "Sayfalar", label: "Destek", icon: LifeBuoy, keywords: "yardim talep", run: go("/dashboard/support") },
    ];
    const people: Command[] = (customers ?? [])
      .filter((c) => !c.name.startsWith("[KAPALI"))
      .map((c) => ({
        id: `c-${c.id}`,
        group: "Müşteriler" as const,
        label: c.name,
        hint: c.phone ?? undefined,
        icon: User,
        keywords: c.phone ?? "",
        run: go(`/dashboard/customers?q=${encodeURIComponent(c.name)}`),
      }));
    return [...actions, ...pages, ...people];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessSlug, isRestaurant, theme, customers]);

  const q = fold(query.trim());
  const results = useMemo(() => {
    if (!q) return commands.filter((c) => c.group !== "Müşteriler");
    const digits = q.replace(/\D/g, "");
    return commands
      .filter((c) => {
        const hay = fold(`${c.label} ${c.keywords ?? ""}`);
        return hay.includes(q) || (digits.length >= 3 && (c.keywords ?? "").replace(/\D/g, "").includes(digits));
      })
      .slice(0, 30);
  }, [commands, q]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      results[active]?.run();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onOpenChange(false);
    }
  };

  let lastGroup = "";
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/20 px-4 pt-[14vh]" onMouseDown={() => onOpenChange(false)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Hızlı arama"
        className="dash-spotlight w-full max-w-[640px] overflow-hidden text-ink"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-line px-5">
          <Search className="h-5 w-5 shrink-0 text-ink-3" aria-hidden="true" />
          <input
            ref={inputRef}
            // The caret shows focus here; the global :focus-visible ring would box the whole field.
            style={{ outline: "none" }}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            placeholder="Sayfa, işlem veya müşteri arayın..."
            className="h-16 w-full border-0 bg-transparent text-xl font-light text-ink shadow-none outline-none ring-0 placeholder:text-ink-3 focus:border-0 focus:shadow-none focus:outline-none focus:ring-0 focus-visible:outline-none"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-list"
            aria-activedescendant={results[active] ? `cmd-${results[active].id}` : undefined}
          />
          <kbd className="hidden shrink-0 rounded-[5px] border border-line px-1.5 py-0.5 text-[11px] font-medium text-ink-3 sm:block">Esc</kbd>
        </div>

        <ul id="command-list" ref={listRef} role="listbox" className="max-h-[min(60vh,420px)] overflow-y-auto p-2">
          {results.length === 0 && (
            <li className="px-3 py-8 text-center text-sm text-ink-3">
              {customers === null && q ? "Aranıyor..." : `"${query}" için sonuç yok.`}
            </li>
          )}
          {results.map((cmd, i) => {
            const header = cmd.group !== lastGroup ? cmd.group : null;
            lastGroup = cmd.group;
            const Icon = cmd.icon;
            return (
              <React.Fragment key={cmd.id}>
                {header && (
                  <li role="presentation" className="px-3 pb-1 pt-3 text-[11px] font-semibold text-ink-3 first:pt-1">
                    {header}
                  </li>
                )}
                <li
                  id={`cmd-${cmd.id}`}
                  role="option"
                  aria-selected={i === active}
                  data-index={i}
                  onMouseMove={() => setActive(i)}
                  onClick={() => cmd.run()}
                  className={cn(
                    "flex h-10 cursor-pointer items-center gap-3 rounded-[10px] px-3 text-sm",
                    i === active ? "bg-brand text-on-brand" : "text-ink-2"
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", i === active ? "text-on-brand" : "text-ink-3")} aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">{cmd.label}</span>
                  {cmd.hint && <span className={cn("shrink-0 truncate text-xs tabular-nums", i === active ? "text-on-brand/80" : "text-ink-3")}>{cmd.hint}</span>}
                </li>
              </React.Fragment>
            );
          })}
        </ul>

        <div className="hidden items-center gap-4 border-t border-line px-4 py-2.5 text-[11px] text-ink-3 sm:flex">
          <span><kbd className="font-sans">↑↓</kbd> gezin</span>
          <span><kbd className="font-sans">↵</kbd> aç</span>
          <span><kbd className="font-sans">Esc</kbd> kapat</span>
        </div>
      </div>
    </div>
  );
}
