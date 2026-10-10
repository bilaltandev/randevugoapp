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

interface DashboardShellProps {
  business: any;
  user: any;
  subscriptionStatus: string;
  children: React.ReactNode;
}

export function DashboardShell({
  business,
  user,
  subscriptionStatus,
  children,
}: DashboardShellProps) {
  // Default is "light" as requested by user
  const [theme, setTheme] = useState<"light" | "dark">("light");
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
        "relative flex h-screen overflow-hidden",
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

        <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6 lg:px-8 pb-24 md:pb-8 dash-content-scroll">
          <div className="max-w-7xl mx-auto">{children}</div>
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

      {/* Mobile bottom navigation */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center gap-1 border-t border-line bg-surface px-2 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))]"
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
              className={cn(mobileItemClass, active ? "text-brand font-medium" : "text-ink-3 hover:text-ink")}
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
