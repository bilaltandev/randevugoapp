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
} from "lucide-react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";

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

  return (
    <div
      className={`relative flex h-screen overflow-hidden ${
        theme === "dark" ? "dash-theme-dark dark" : "dash-theme-light"
      }`}
    >
      {/* Mobile Backdrop Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar (Drawer on mobile, fixed column on desktop) */}
      <DashboardSidebar
        business={business}
        subscriptionStatus={subscriptionStatus}
        userRole={user.role}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden dash-main-area bg-[#F6F7FB] dark:bg-[#080C10] text-[#111827] dark:text-[#F1F5F9] transition-colors duration-200 min-w-0">
        <DashboardHeader
          business={business}
          user={user}
          subscriptionStatus={subscriptionStatus}
          currentTheme={theme}
          onToggleTheme={handleToggleTheme}
          onToggleMobileMenu={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />

        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-8 pb-24 md:pb-8 dash-content-scroll">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Ultra-responsive quick thumb navigation) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around bg-white/95 dark:bg-[#080D1B]/95 backdrop-blur-xl border-t border-[#E4E7EC] dark:border-[#151B2E] px-1 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] text-[10px] font-semibold text-[#667085] dark:text-[#94A3B8]">
        <Link
          href="/dashboard"
          className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
            pathname === "/dashboard"
              ? "text-[#6246EA] dark:text-[#8C75FF] font-bold"
              : "hover:text-[#111827] dark:hover:text-white"
          }`}
        >
          <LayoutDashboard className="w-4.5 h-4.5" />
          <span>Özet</span>
        </Link>

        <Link
          href="/dashboard/appointments"
          className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
            pathname.startsWith("/dashboard/appointments")
              ? "text-[#6246EA] dark:text-[#8C75FF] font-bold"
              : "hover:text-[#111827] dark:hover:text-white"
          }`}
        >
          <CalendarCheck2 className="w-4.5 h-4.5" />
          <span>Randevu</span>
        </Link>

        <Link
          href="/dashboard/calendar"
          className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
            pathname.startsWith("/dashboard/calendar")
              ? "text-[#6246EA] dark:text-[#8C75FF] font-bold"
              : "hover:text-[#111827] dark:hover:text-white"
          }`}
        >
          <CalendarDays className="w-4.5 h-4.5" />
          <span>Takvim</span>
        </Link>

        {isRestaurant ? (
          <Link
            href="/dashboard/tables"
            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
              pathname.startsWith("/dashboard/tables")
                ? "text-[#6246EA] dark:text-[#8C75FF] font-bold"
                : "hover:text-[#111827] dark:hover:text-white"
            }`}
          >
            <UtensilsCrossed className="w-4.5 h-4.5" />
            <span>Masa</span>
          </Link>
        ) : (
          <Link
            href="/dashboard/services"
            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
              pathname.startsWith("/dashboard/services")
                ? "text-[#6246EA] dark:text-[#8C75FF] font-bold"
                : "hover:text-[#111827] dark:hover:text-white"
            }`}
          >
            <Scissors className="w-4.5 h-4.5" />
            <span>Hizmet</span>
          </Link>
        )}

        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl hover:text-[#111827] dark:hover:text-white transition-all text-[#667085] dark:text-[#94A3B8]"
        >
          <Menu className="w-4.5 h-4.5" />
          <span>Menü</span>
        </button>
      </nav>
    </div>
  );
}
