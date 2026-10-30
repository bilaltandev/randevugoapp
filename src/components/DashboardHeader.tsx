"use client";

import React, { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Copy, Check, ExternalLink, Globe, Plus, Menu, Search, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface DashboardHeaderProps {
  business: {
    id: string;
    name: string;
    slug: string;
  };
  currentTheme?: "light" | "dark";
  onToggleTheme?: () => void;
  onToggleMobileMenu?: () => void;
  /** Opens the Ctrl/⌘+K command palette. */
  onOpenSearch?: () => void;
}

const noopSubscribe = () => () => {};

/**
 * Slim top bar. Every page renders its own title (PageHeader), so the bar only holds
 * what is useful everywhere: the public booking link, the theme switch and "Yeni randevu".
 */
export function DashboardHeader({
  business,
  currentTheme = "light",
  onToggleTheme,
  onToggleMobileMenu,
  onOpenSearch,
}: DashboardHeaderProps) {
  const [copied, setCopied] = useState(false);
  // The platform's own shortcut key; "Ctrl" during server render.
  const modKey = useSyncExternalStore(
    noopSubscribe,
    () => (/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl"),
    () => "Ctrl"
  );
  const isLight = currentTheme === "light";

  const bookingUrl =
    typeof window !== "undefined" ? `${window.location.origin}/${business.slug}` : `http://localhost:3000/${business.slug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const iconButton =
    "inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-2 hover:bg-surface-muted hover:text-ink transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

  return (
    <header className="sticky top-0 z-20 flex h-14 w-full shrink-0 items-center justify-between gap-3 px-3 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-2">
        {onToggleMobileMenu && (
          <button type="button" onClick={onToggleMobileMenu} className={`md:hidden -ml-1 ${iconButton}`} aria-label="Menüyü aç">
            <Menu className="w-5 h-5" />
          </button>
        )}
        <span className="md:hidden truncate font-display text-[15px] font-bold tracking-[-0.02em] text-ink">{business.name}</span>

        {/* Public booking link */}
        <div className="hidden md:flex h-9 items-center rounded-full bg-surface-muted/70 pl-1 text-[13px]">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-muted text-ink-3" aria-hidden="true">
            <Globe className="h-3.5 w-3.5" />
          </span>
          <Link
            href={`/${business.slug}`}
            target="_blank"
            className="flex h-full items-center gap-1.5 px-3 text-ink-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-brand"
            title="Rezervasyon sayfanızı yeni sekmede açın"
          >
            <span className="text-ink-3">calendlygo.com/</span>
            <span className="font-medium max-w-[180px] truncate text-ink">{business.slug}</span>
            <ExternalLink className="w-3.5 h-3.5 text-ink-3" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex h-full items-center rounded-r-full border-l border-line px-3 text-ink-3 hover:bg-surface-muted hover:text-ink transition-colors"
            aria-label="Rezervasyon bağlantısını kopyala"
            title="Bağlantıyı kopyala"
          >
            {copied ? <Check className="w-4 h-4 text-brand" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        {onOpenSearch && (
          <button
            type="button"
            onClick={onOpenSearch}
            className="hidden h-9 items-center gap-2 rounded-full bg-surface-muted/70 pl-3.5 pr-1.5 text-[13px] text-ink-3 transition-colors hover:text-ink sm:flex lg:w-56"
            aria-label="Hızlı arama"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            <span className="flex-1 text-left">Ara...</span>
            <kbd className="rounded-full border border-line bg-surface-muted px-2 py-0.5 font-sans text-[11px] font-medium">
              {modKey} K
            </kbd>
          </button>
        )}
        {onOpenSearch && (
          <button type="button" onClick={onOpenSearch} className={`sm:hidden ${iconButton}`} aria-label="Hızlı arama">
            <Search className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          onClick={handleCopyLink}
          className={`md:hidden ${iconButton}`}
          aria-label="Rezervasyon bağlantısını kopyala"
          title="Rezervasyon bağlantısını kopyala"
        >
          {copied ? <Check className="w-4 h-4 text-brand" /> : <Copy className="w-4 h-4" />}
        </button>

        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            className={iconButton}
            aria-label={isLight ? "Koyu temaya geç" : "Açık temaya geç"}
            title={isLight ? "Koyu temaya geç" : "Açık temaya geç"}
          >
            {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        )}

        <Button href="/dashboard/calendar?new=1" variant="primary" className="h-9 w-9 px-0 sm:w-auto sm:px-4">
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">Yeni randevu</span>
          <span className="sr-only sm:hidden">Yeni randevu</span>
        </Button>
      </div>
    </header>
  );
}
