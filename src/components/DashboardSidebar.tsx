"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  CalendarCheck2,
  Scissors,
  Users2,
  Contact2,
  Star,
  Palette,
  BarChart3,
  CreditCard,
  Settings,
  UserRound,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ShieldCheck,
  Camera,
  UtensilsCrossed,
  X,
  type LucideIcon,
  LifeBuoy,
} from "lucide-react";
import { SECTORS, cn } from "@/lib/utils";

interface DashboardSidebarProps {
  business: {
    id: string;
    name: string;
    slug: string;
    sector: string;
    logo?: string | null;
  };
  subscriptionStatus?: string;
  userRole?: string;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  /** Shown in the account row at the bottom of the menu. */
  user?: { name: string; email: string };
}

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  /** Extra path prefix that should also mark this item active. */
  matchPrefix?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

export function DashboardSidebar({
  business,
  subscriptionStatus = "trial",
  userRole = "BUSINESS_OWNER",
  mobileOpen = false,
  onCloseMobile,
  user,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isRestaurant = business.sector === "RESTORAN" || business.sector === "RESTAURANT";
  const sectorLabel =
    SECTORS.find((s) => s.id === business.sector)?.name ??
    (isRestaurant ? "Restoran & Kafe" : "Hizmet İşletmesi");
  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN" || userRole === "SUPERADMIN";

  // Labels collapse on desktop only; the mobile drawer always shows them.
  const showLabels = !collapsed || mobileOpen;

  const groups: NavGroup[] = [
    {
      label: "Günlük",
      items: [
        { name: "Özet", href: "/dashboard", icon: LayoutDashboard },
        { name: "Takvim", href: "/dashboard/calendar", icon: CalendarDays },
        { name: "Rezervasyonlar", href: "/dashboard/appointments", icon: CalendarCheck2 },
        ...(isRestaurant
          ? [{ name: "Masa Planı", href: "/dashboard/tables", icon: UtensilsCrossed, matchPrefix: "/dashboard/tables" }]
          : []),
        { name: "Müşteriler", href: "/dashboard/customers", icon: Contact2 },
      ],
    },
    {
      label: "İşletme",
      items: [
        { name: "Hizmetler", href: "/dashboard/services", icon: Scissors },
        { name: "Çalışanlar", href: "/dashboard/employees", icon: Users2 },
        { name: "Yorumlar", href: "/dashboard/reviews", icon: Star },
        { name: "İstatistikler", href: "/dashboard/analytics", icon: BarChart3 },
      ],
    },
    {
      label: "Vitrin",
      items: [
        { name: "Sayfa Düzenleyici", href: "/dashboard/page-builder", icon: Palette, matchPrefix: "/dashboard/page-builder" },
        { name: "Galeri & Portföy", href: "/dashboard/page-builder?tab=gallery", icon: Camera },
      ],
    },
    {
      label: "Hesap",
      items: [
        { name: "Profil", href: "/dashboard/profile", icon: UserRound },
        { name: "Abonelik", href: "/dashboard/subscription", icon: CreditCard },
        { name: "Ayarlar", href: "/dashboard/settings", icon: Settings },
        { name: "Destek", href: "/dashboard/support", icon: LifeBuoy, matchPrefix: "/dashboard/support" },
      ],
    },
  ];

  const isActive = (item: NavItem) => {
    // The gallery shortcut shares its route with the page builder; keep only the builder highlighted.
    if (item.href.includes("?")) return false;
    return pathname === item.href || (!!item.matchPrefix && pathname.startsWith(item.matchPrefix));
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <aside
      className={cn(
        "dash-rail fixed md:relative inset-y-0 left-0 z-50 md:z-30 flex flex-col shrink-0 bg-nav text-nav-text border-r border-nav-line transition-[width,transform] duration-200",
        mobileOpen ? "translate-x-0 w-72 max-w-[85vw] shadow-pop" : "-translate-x-full md:translate-x-0",
        collapsed ? "md:w-[68px]" : "md:w-64"
      )}
      aria-label="Panel menüsü"
    >
      {/* Wordmark */}
      <div className={cn("flex h-14 items-center gap-2 px-4", collapsed && !mobileOpen ? "md:justify-center md:px-0" : "justify-between")}>
        <Link
          href="/dashboard"
          onClick={() => onCloseMobile?.()}
          className="flex items-center gap-2.5 min-w-0 rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          aria-label="CalendlyGo panel ana sayfası"
        >
          {/* The icon on its own dark tile, like an app icon: the cut-out mark washes out on light backgrounds. */}
          <div className="relative w-9 h-9 shrink-0 overflow-hidden rounded-[10px] bg-black shadow-raised">
            <Image src="/brand/calendlygo-icon-192.png" alt="" fill sizes="36px" className="object-cover" unoptimized />
          </div>
          {showLabels && (
            <span className="font-display text-[17px] font-bold tracking-[-0.03em] text-nav-text-strong">
              CalendlyGo
            </span>
          )}
        </Link>

        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden flex h-8 w-8 items-center justify-center rounded-control text-nav-text hover:bg-nav-hover hover:text-nav-text-strong transition-colors"
            aria-label="Menüyü kapat"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Business */}
      {showLabels && (
        <div className="px-3 pb-2">
          <Link
            href={`/${business.slug}`}
            target="_blank"
            onClick={() => onCloseMobile?.()}
            className="group flex items-center gap-3 rounded-panel bg-nav-raised p-2.5 shadow-raised transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            title="Rezervasyon sayfanızı yeni sekmede açın"
          >
            {business.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={business.logo} alt="" className="w-9 h-9 rounded-control border border-nav-line object-cover shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-control bg-brand-soft text-brand-ink flex items-center justify-center text-sm font-bold shrink-0">
                {business.name.slice(0, 1).toLocaleUpperCase("tr-TR")}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-nav-text-strong truncate">{business.name}</p>
              <p className="flex items-center gap-1 text-xs text-nav-text truncate">
                <span className="truncate">/{business.slug}</span>
                <ExternalLink className="w-3 h-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
              </p>
            </div>
          </Link>
          <p className="sr-only">{sectorLabel}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
        {groups.map((group) => (
          <div key={group.label}>
            {showLabels ? (
              <p className="px-2.5 pb-1.5 text-[11px] font-semibold tracking-[0.02em] text-nav-text/80">{group.label}</p>
            ) : (
              <div className="mx-2 mb-2 border-t border-nav-line first:hidden" aria-hidden="true" />
            )}
            <ul className="space-y-px">
              {group.items.map((item) => {
                const active = isActive(item);
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => onCloseMobile?.()}
                      aria-current={active ? "page" : undefined}
                      title={!showLabels ? item.name : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-[10px] px-2.5 h-[34px] text-[13.5px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand",
                        !showLabels && "md:justify-center md:px-0",
                        active
                          ? "bg-brand-soft text-brand-ink font-semibold"
                          : "text-nav-text hover:bg-nav-hover hover:text-nav-text-strong"
                      )}
                    >
                      <Icon className={cn("w-[17px] h-[17px] shrink-0", active ? "text-brand" : "text-brand/80")} aria-hidden="true" />
                      {showLabels && <span className="truncate">{item.name}</span>}
                      {showLabels && item.name === "Abonelik" && subscriptionStatus === "trial" && (
                        <span className="ml-auto rounded-full border border-pending-line bg-pending-soft px-2 py-0.5 text-[11px] font-medium text-pending">
                          Deneme
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {isAdmin && (
          <Link
            href="/admin"
            onClick={() => onCloseMobile?.()}
            title={!showLabels ? "Sistem Admin" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-control px-2.5 h-9 text-sm text-pending hover:bg-nav-hover transition-colors",
              !showLabels && "md:justify-center md:px-0"
            )}
          >
            <ShieldCheck className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
            {showLabels && <span className="truncate">Sistem Admin</span>}
          </Link>
        )}
      </nav>

      {/* Account */}
      <div className={cn("flex items-center gap-2 border-t border-nav-line p-3", !showLabels && "md:flex-col")}>
        {showLabels && user && (
          <div className="flex min-w-0 flex-1 items-center gap-2.5 px-1" title={user.email}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-nav-raised text-xs font-bold text-nav-text-strong shadow-raised">
              {user.name ? user.name.trim().slice(0, 1).toLocaleUpperCase("tr-TR") : "?"}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-nav-text-strong">{user.name}</span>
              <span className="block truncate text-xs text-nav-text">{user.email}</span>
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          title="Çıkış yap"
          aria-label="Çıkış yap"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-nav-text hover:bg-nav-hover hover:text-nav-text-strong transition-colors"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-nav-text hover:bg-nav-hover hover:text-nav-text-strong transition-colors"
          aria-label={collapsed ? "Menüyü genişlet" : "Menüyü daralt"}
          title={collapsed ? "Genişlet" : "Daralt"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
