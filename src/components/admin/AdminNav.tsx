"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, LayoutDashboard, LogOut, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AdminNavItem<T extends string> {
  id: T;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface AdminNavProps<T extends string> {
  items: AdminNavItem<T>[];
  active: T;
  onChange: (id: T) => void;
  adminName: string;
  adminEmail: string;
  loggingOut: boolean;
  onLogout: () => void;
}

function NavButton<T extends string>({
  item,
  active,
  onClick,
  compact,
}: {
  item: AdminNavItem<T>;
  active: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex shrink-0 items-center gap-2.5 rounded-xl text-[13px] font-medium transition-colors",
        compact ? "h-9 px-3" : "h-10 w-full px-3",
        active ? "bg-white/[0.11] text-white" : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className={cn("truncate", !compact && "flex-1 text-left")}>{item.label}</span>
      {!!item.badge && (
        <span className="min-w-5 rounded-full bg-[#34D399] px-1.5 text-center text-[11px] font-semibold leading-5 text-[#04261B]">{item.badge}</span>
      )}
    </button>
  );
}

/** The admin panel's navigation: a glass rail on large screens, a scrolling row on phones. */
export function AdminNav<T extends string>({ items, active, onChange, adminName, adminEmail, loggingOut, onLogout }: AdminNavProps<T>) {
  const brand = (
    <div className="flex items-center gap-2.5">
      <span className="relative h-8 w-8 shrink-0">
        <Image src="/brand/calendlygo-mark.png" alt="" fill sizes="32px" className="object-contain" unoptimized />
      </span>
      <div className="leading-tight">
        <p className="text-sm font-semibold tracking-tight text-white">CalendlyGo</p>
        <p className="text-[11px] text-slate-400">Yönetim</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Phones and tablets */}
      <div className="admin-glass mb-4 rounded-2xl p-2 lg:hidden">
        <div className="flex items-center justify-between px-2 py-1.5">
          {brand}
          <button
            type="button"
            onClick={onLogout}
            disabled={loggingOut}
            aria-label="Çıkış yap"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-white/[0.05] hover:text-white disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <nav aria-label="Yönetim menüsü" className="mt-1 flex gap-1 overflow-x-auto scrollbar-none">
          {items.map((item) => (
            <NavButton key={item.id} item={item} active={item.id === active} onClick={() => onChange(item.id)} compact />
          ))}
        </nav>
      </div>

      {/* Large screens */}
      <aside className="admin-glass sticky top-6 hidden h-[calc(100vh-3rem)] flex-col rounded-3xl p-3 lg:flex">
        <div className="px-2 py-3">{brand}</div>
        <nav aria-label="Yönetim menüsü" className="mt-3 flex-1 space-y-0.5 overflow-y-auto">
          {items.map((item) => (
            <NavButton key={item.id} item={item} active={item.id === active} onClick={() => onChange(item.id)} />
          ))}
        </nav>

        <div className="space-y-0.5 border-t border-white/[0.08] pt-3">
          <Link href="/dashboard" className="flex h-9 items-center gap-2.5 rounded-xl px-3 text-[13px] font-medium text-slate-400 hover:bg-white/[0.05] hover:text-white">
            <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
            İşletme paneli
          </Link>
          <Link href="/" target="_blank" className="flex h-9 items-center gap-2.5 rounded-xl px-3 text-[13px] font-medium text-slate-400 hover:bg-white/[0.05] hover:text-white">
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            Siteyi aç
          </Link>
          <button
            type="button"
            onClick={onLogout}
            disabled={loggingOut}
            className="flex h-9 w-full items-center gap-2.5 rounded-xl px-3 text-[13px] font-medium text-slate-400 hover:bg-white/[0.05] hover:text-white disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {loggingOut ? "Çıkılıyor..." : "Çıkış yap"}
          </button>
          <div className="mt-2 px-3 pb-1 pt-2">
            <p className="truncate text-[13px] font-medium text-white">{adminName}</p>
            <p className="truncate text-[11px] text-slate-400">{adminEmail}</p>
          </div>
        </div>
      </aside>
    </>
  );
}
