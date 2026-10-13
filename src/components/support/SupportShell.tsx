"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Building2, Inbox, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";

const NAV = [
  { name: "Talepler", href: "/support", icon: Inbox, match: (p: string) => p === "/support" || p.startsWith("/support/tickets") },
  { name: "İşletmeler", href: "/support/businesses", icon: Building2, match: (p: string) => p.startsWith("/support/businesses") },
];

export function SupportShell({ agentName, children }: { agentName: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/support/login";
    }
  };

  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <header className="sticky top-0 z-30 border-b border-sidebar-line bg-sidebar text-sidebar-text">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link href="/support" className="flex shrink-0 items-center gap-2.5" aria-label="Destek paneli ana sayfa">
            <span className="relative h-8 w-8 overflow-hidden rounded-control bg-black">
              <Image src="/brand/calendlygo-mark.png" alt="" fill sizes="32px" className="object-cover" unoptimized />
            </span>
            <span className="hidden text-sm font-semibold text-sidebar-text-strong sm:inline">Destek Paneli</span>
          </Link>

          <nav className="flex min-w-0 flex-1 items-center gap-1" aria-label="Destek paneli menüsü">
            {NAV.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-control px-2.5 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-sidebar-raised text-sidebar-text-strong"
                      : "hover:bg-sidebar-raised hover:text-sidebar-text-strong"
                  )}
                >
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden items-center gap-2 text-sm md:inline-flex">
              <Avatar name={agentName} size="sm" />
              <span className="max-w-40 truncate text-sidebar-text-strong">{agentName}</span>
            </span>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex h-8 items-center gap-1.5 rounded-control px-2 text-sm hover:bg-sidebar-raised hover:text-sidebar-text-strong disabled:opacity-60"
              aria-label="Çıkış yap"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Çıkış</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
