"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck2,
  CalendarDays,
  Scissors,
  UtensilsCrossed,
  Menu,
  type LucideIcon,
} from "lucide-react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { CommandPalette } from "@/components/CommandPalette";
import { cn } from "@/lib/utils";
import { SubscriptionLocked } from "@/components/SubscriptionLocked";

interface DashboardShellProps {
  business: any;
  user: any;
  subscriptionStatus: string;
  /** Trial or subscription over: only the subscription and support pages stay usable. */
  locked?: boolean;
  children: React.ReactNode;
}

const OPEN_WHEN_LOCKED = ["/dashboard/subscription", "/dashboard/support"];

export function DashboardShell({
  business,
  user,
  subscriptionStatus,
  locked = false,
  children,
}: DashboardShellProps) {
  // Dark by default, like the mobile app (user decision 2026-10-29); a saved choice wins.
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const pathname = usePathname();

  const isRestaurant = business?.sector === "RESTORAN" || business?.sector === "RESTAURANT";

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("randevugo_dash_theme");
    if (savedTheme === "dark" || savedTheme === "light") {
      setTheme(savedTheme);
    }
  }, []);

  // Auto-close mobile drawer when navigation route changes
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  const handleToggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("randevugo_dash_theme", nextTheme);
  };

  const mobileNav: { name: string; href: string; icon: LucideIcon; exact?: boolean }[] = [
    { name: "Özet", href: "/dashboard", icon: LayoutDashboard, exact: true },
    { name: "Takvim", href: "/dashboard/calendar", icon: CalendarDays },
    { name: "Randevular", href: "/dashboard/appointments", icon: CalendarCheck2 },
    isRestaurant
      ? { name: "Masalar", href: "/dashboard/tables", icon: UtensilsCrossed }
      : { name: "Hizmetler", href: "/dashboard/services", icon: Scissors },
  ];

  const mobileItemClass =
    "flex flex-1 flex-col items-center justify-center gap-0.5 h-12 rounded-control text-xs transition-colors";

  return (
    <div
      className={cn(
        "dash-shell relative flex h-screen overflow-hidden",
        theme === "dark" ? "dash-theme-dark dark" : "dash-theme-light"
      )}
    >
      {/* Mobile Backdrop Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar (Drawer on mobile, fixed column on desktop) */}
      <DashboardSidebar
        business={business}
        subscriptionStatus={subscriptionStatus}
        userRole={user.role}
        user={user}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden dash-main-area bg-canvas text-ink min-w-0">
        <DashboardHeader
          business={business}
          currentTheme={theme}
          onToggleTheme={handleToggleTheme}
          onToggleMobileMenu={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          onOpenSearch={() => setPaletteOpen(true)}
        />

        <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6 lg:px-8 pb-28 md:pb-10 dash-content-scroll dash-backdrop">
          <div key={pathname} className="max-w-7xl mx-auto dash-rise">
            {locked && !OPEN_WHEN_LOCKED.some((path) => pathname.startsWith(path)) ? <SubscriptionLocked /> : children}
          </div>
        </main>
      </div>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        businessSlug={business.slug}
        isRestaurant={isRestaurant}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Mobile bottom navigation: a floating frosted pill, like the app's tab bar */}
      <nav
        className="md:hidden fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 right-3 z-30 flex items-center gap-1 rounded-[22px] border border-line px-1.5 py-1 shadow-pop dash-glass"
        aria-label="Hızlı gezinme"
      >
        {mobileNav.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(mobileItemClass, active ? "bg-brand-soft text-brand font-semibold" : "text-ink-3 hover:text-ink")}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span>{item.name}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          className={cn(mobileItemClass, "text-ink-3 hover:text-ink")}
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
          <span>Menü</span>
        </button>
      </nav>
    </div>
  );
}
