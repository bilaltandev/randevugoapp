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
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
  ShieldCheck,
  Camera,
} from "lucide-react";
import { SectorBadge } from "./SectorBadge";

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
}

export function DashboardSidebar({
  business,
  subscriptionStatus = "trial",
  userRole = "BUSINESS_OWNER",
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navigation = [
    { name: "Ana Sayfa", href: "/dashboard", icon: LayoutDashboard },
    { name: "Takvim", href: "/dashboard/calendar", icon: CalendarDays },
    { name: "Rezervasyonlar", href: "/dashboard/appointments", icon: CalendarCheck2 },
    { name: "Hizmetler", href: "/dashboard/services", icon: Scissors },
    { name: "Çalışanlar", href: "/dashboard/employees", icon: Users2 },
    { name: "Müşteriler", href: "/dashboard/customers", icon: Contact2 },
    { name: "Yorumlar", href: "/dashboard/reviews", icon: Star },
    { name: "Sayfa Düzenleyici", href: "/dashboard/page-builder", icon: Palette },
    { name: "Galeri & Portföy", href: "/dashboard/page-builder?tab=gallery", icon: Camera },
    { name: "İstatistikler & AI", href: "/dashboard/analytics", icon: BarChart3 },
    { name: "Abonelik", href: "/dashboard/subscription", icon: CreditCard },
    { name: "Ayarlar", href: "/dashboard/settings", icon: Settings },
  ];

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
      className={`relative flex flex-col border-r border-[#151B2E] bg-[#080D1B] backdrop-blur-xl transition-all duration-300 z-30 shrink-0 text-slate-100 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-[#151B2E]">
        <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
          <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-black shrink-0">
            <Image
              src="/brand/mascot-logo.png"
              alt="RandevuGo Logo"
              fill
              sizes="36px"
              className="object-cover"
              unoptimized
            />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <Image
                src="/brand/randevugo-text-logo.png"
                alt="RandevuGo"
                width={120}
                height={20}
                className="h-4.5 w-auto object-contain"
                unoptimized
              />
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 mt-0.5">
                SaaS Dashboard
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg border border-[#1E2742] bg-[#0E1528] text-slate-400 hover:text-white transition-colors"
          title={collapsed ? "Genişlet" : "Daralt"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Business Info Card */}
      {!collapsed && (
        <div className="p-3 mx-3 mt-3 rounded-2xl border border-[#1E2742] bg-[#0E1528]/90">
          <div className="flex items-center gap-3">
            {business.logo ? (
              <img
                src={business.logo}
                alt={business.name}
                className="w-10 h-10 rounded-xl object-cover border border-[#263152] shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-[#6246EA]/20 text-[#6246EA] flex items-center justify-center font-bold text-sm border border-[#6246EA]/30 shrink-0">
                {business.name.slice(0, 1)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-100 truncate">{business.name}</p>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 rotate-90 shrink-0" />
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shrink-0" />
                <span className="truncate">{business.sector === "BERBER" ? "Erkek Kuaförü & Berber" : business.sector}</span>
              </div>
            </div>
          </div>

          <div className="mt-2.5 pt-2.5 border-t border-[#1E2742] flex flex-col gap-0.5 text-[11px]">
            <span className="text-slate-400 text-[10px]">Canlı Sayfa:</span>
            <Link
              href={`/${business.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 text-[#8C75FF] hover:text-white font-medium transition-colors truncate"
            >
              <span className="truncate">randevugo.com/{business.slug}</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </Link>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.name === "Sayfa & Tema Düzenleyici" && pathname.startsWith("/dashboard/page-builder"));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium transition-all ${
                isActive
                  ? "bg-[#6246EA] text-white shadow-md shadow-[#6246EA]/30 font-semibold"
                  : "text-[#94A3B8] hover:bg-[#0E1528] hover:text-white"
              }`}
              title={collapsed ? item.name : undefined}
            >
              <Icon
                className={`w-4.5 h-4.5 shrink-0 transition-colors ${
                  isActive ? "text-white" : "text-[#94A3B8] group-hover:text-white"
                }`}
              />
              {!collapsed && <span className="truncate">{item.name}</span>}
              {!collapsed && item.name === "Abonelik" && subscriptionStatus === "trial" && (
                <span className="ml-auto rounded-full bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
                  Deneme
                </span>
              )}
            </Link>
          );
        })}

        {userRole === "ADMIN" && (
          <Link
            href="/admin"
            className="group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-amber-400 hover:bg-amber-500/10 transition-colors border border-amber-500/20"
            title="Süper Yönetici Paneli"
          >
            <ShieldCheck className="w-4.5 h-4.5 shrink-0 text-amber-400" />
            {!collapsed && <span className="truncate">Sistem Admin</span>}
          </Link>
        )}
      </nav>

      {/* Bottom Footer Actions */}
      <div className="p-3 border-t border-[#151B2E]">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-xl border border-[#1E2742] bg-[#0E1528] px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#94A3B8] hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400 transition-colors"
          title={collapsed ? "Çıkış Yap" : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Çıkış Yap</span>}
        </button>
      </div>
    </aside>
  );
}
