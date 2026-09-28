"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Bell,
  Copy,
  Check,
  ExternalLink,
  Plus,
  Sparkles,
  Search,
  User,
  Menu,
} from "lucide-react";

interface DashboardHeaderProps {
  business: {
    id: string;
    name: string;
    slug: string;
  };
  user: {
    name: string;
    email: string;
  };
  currentTheme?: "light" | "dark";
  onToggleTheme?: () => void;
  subscriptionStatus?: string;
  onOpenNewAppointment?: () => void;
  onToggleMobileMenu?: () => void;
}

export function DashboardHeader({
  business,
  user,
  currentTheme = "light",
  onToggleTheme,
  subscriptionStatus = "trial",
  onOpenNewAppointment,
  onToggleMobileMenu,
}: DashboardHeaderProps) {
  const [copied, setCopied] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const isLight = currentTheme === "light";

  const bookingUrl = typeof window !== "undefined"
    ? `${window.location.origin}/${business.slug}`
    : `http://localhost:3000/${business.slug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sampleNotifications = [
    { id: "1", title: "Yeni Rezervasyon", desc: "Tolga Akın yarın 14:00 randevusu aldı.", time: "10 dk önce", unread: true },
    { id: "2", title: "Yeni Değerlendirme ⭐", desc: "Mehmet Yılmaz 5 yıldızlı yorum bıraktı.", time: "1 saat önce", unread: true },
    { id: "3", title: "Deneme Süresi", desc: "3 günlük ücretsiz denemeniz başladı.", time: "Dün", unread: false },
  ];

  return (
    <header
      className={`sticky top-0 z-20 flex h-16 w-full items-center justify-between px-4 md:px-8 transition-colors duration-200 ${
        isLight
          ? "border-b border-[#E4E7EC] bg-white/95 text-[#111827] shadow-[0_1px_2px_rgba(16,24,40,0.05)] backdrop-blur-md"
          : "border-b border-slate-800/80 bg-slate-950/70 text-slate-100 backdrop-blur-xl"
      }`}
    >
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className={`md:hidden rounded-lg p-2 transition-colors ${
              isLight
                ? "text-[#667085] hover:bg-[#F2F4F7] hover:text-[#111827]"
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
            }`}
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Live booking link chip */}
        <div
          className={`hidden sm:flex items-center gap-2 rounded-full px-3 py-1.5 text-xs transition-colors ${
            isLight
              ? "border border-[#E4E7EC] bg-[#F8F9FC] text-[#344054]"
              : "border border-slate-800 bg-slate-900/80 text-slate-300"
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-[#00C98D] animate-pulse" />
          <span className={isLight ? "text-[#667085]" : "text-slate-400"}>Rezervasyon Sayfanız:</span>
          <span className="font-semibold text-[#6246EA]">randevugo.com/{business.slug}</span>
          <Link
            href={`/${business.slug}`}
            target="_blank"
            className={`transition-colors ${
              isLight
                ? "text-[#667085] hover:text-[#6246EA]"
                : "text-slate-400 hover:text-indigo-400"
            }`}
            title="Yeni Sekmede Aç"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={handleCopyLink}
            className={`ml-0.5 rounded p-1 transition-colors ${
              isLight
                ? "text-[#667085] hover:text-[#111827] hover:bg-[#E4E7EC]"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
            title="Linki Kopyala"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#00C98D]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Toggle (Light / Dark) */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-all ${
              isLight
                ? "border border-[#E4E7EC] bg-[#F8F9FC] text-[#344054] hover:bg-[#F2F4F7] hover:text-[#111827]"
                : "border border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
            title={isLight ? "Koyu Temaya Geç" : "Açık Temaya Geç"}
          >
            {isLight ? (
              <>
                <span className="text-amber-500 font-bold text-sm">☀️</span>
                <span className="hidden md:inline text-[11px] font-semibold text-[#475467]">Açık</span>
              </>
            ) : (
              <>
                <span className="text-indigo-400 font-bold text-sm">🌙</span>
                <span className="hidden md:inline text-[11px] font-semibold text-slate-300">Koyu</span>
              </>
            )}
          </button>
        )}

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative rounded-xl p-2 transition-colors ${
              isLight
                ? "border border-[#E4E7EC] bg-white text-[#667085] hover:bg-[#F8F9FC] hover:text-[#111827]"
                : "border border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-900 hover:text-slate-100"
            }`}
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#6246EA] ring-2 ring-white dark:ring-slate-950" />
          </button>

          {showNotifications && (
            <div
              className={`absolute right-0 mt-2 w-80 rounded-2xl p-4 shadow-xl z-50 transition-all ${
                isLight
                  ? "border border-[#E4E7EC] bg-white text-[#111827]"
                  : "border border-slate-800 bg-slate-900/95 text-slate-100 backdrop-blur-xl shadow-2xl"
              }`}
            >
              <div
                className={`flex items-center justify-between pb-3 mb-2 border-b ${
                  isLight ? "border-[#E4E7EC]" : "border-slate-800"
                }`}
              >
                <span className="text-xs font-bold">Bildirimler</span>
                <span className="text-[10px] text-[#6246EA] bg-[#6246EA]/10 px-2 py-0.5 rounded-full font-bold">
                  2 yeni
                </span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {sampleNotifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-2.5 rounded-xl text-xs transition-colors ${
                      n.unread
                        ? isLight
                          ? "bg-[#F4F3FF] border border-[#6246EA]/20"
                          : "bg-indigo-950/30 border border-indigo-500/20"
                        : isLight
                        ? "bg-[#F8F9FC]"
                        : "bg-slate-800/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{n.title}</span>
                      <span className={`text-[10px] ${isLight ? "text-[#667085]" : "text-slate-400"}`}>
                        {n.time}
                      </span>
                    </div>
                    <p className={`mt-1 text-[11px] ${isLight ? "text-[#667085]" : "text-slate-400"}`}>
                      {n.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Mini Badge */}
        <div
          className={`flex items-center gap-2 pl-2 border-l ${
            isLight ? "border-[#E4E7EC]" : "border-slate-800/80"
          }`}
        >
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-xl font-bold text-xs ${
              isLight
                ? "bg-[#ECE8FF] text-[#6246EA] border border-[#6246EA]/20"
                : "bg-gradient-to-tr from-slate-800 to-slate-700 text-slate-200 border border-slate-700"
            }`}
          >
            {user.name ? user.name.slice(0, 1).toUpperCase() : "A"}
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className={`text-xs font-semibold ${isLight ? "text-[#111827]" : "text-slate-200"}`}>
              {user.name}
            </span>
            <span className={`text-[10px] truncate max-w-[130px] ${isLight ? "text-[#667085]" : "text-slate-400"}`}>
              {user.email}
            </span>
          </div>
          <svg className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </header>
  );
}
