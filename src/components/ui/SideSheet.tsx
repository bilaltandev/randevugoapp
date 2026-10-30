"use client";

import React, { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface SideSheetProps {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

/** Details beside the list: slides in from the right, a bottom sheet on phones. Mount it only while open. */
export function SideSheet({ onClose, title, children }: SideSheetProps) {
  const titleId = useId();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const sheet = (
    <div className="fixed inset-0 z-50 flex items-end justify-end md:items-stretch">
      <div className="absolute inset-0 bg-black/25" onClick={onClose} aria-hidden="true" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="dash-sheet relative flex max-h-[88dvh] w-full flex-col overflow-hidden text-ink md:m-3 md:max-h-none md:w-[420px]"
      >
        <header className="flex items-center justify-between gap-3 px-5 pb-2 pt-4">
          <h2 id={titleId} className="truncate text-[13px] font-medium text-ink-3">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-ink-2 transition-colors hover:text-ink"
            aria-label="Kapat"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 pb-6">{children}</div>
      </aside>
    </div>
  );

  // At the shell's root, like Modal, so the page's fade can't trap it under the top bar.
  const shell = typeof document !== "undefined" ? document.querySelector(".dash-shell") : null;
  return shell ? createPortal(sheet, shell) : sheet;
}

/** A round action with a label under it, like the buttons on an iOS contact card. */
export function SheetAction({
  icon: Icon,
  label,
  href,
  onClick,
  external,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  onClick?: () => void;
  external?: boolean;
}) {
  const body = (
    <>
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand">
        <Icon className="h-5 w-5" />
      </span>
      <span className="text-xs font-medium text-ink-2">{label}</span>
    </>
  );
  const className = "flex w-20 flex-col items-center gap-1.5 rounded-control transition-opacity hover:opacity-80";
  return href ? (
    <a href={href} className={className} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {body}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={className}>
      {body}
    </button>
  );
}

/** Label and value rows in one rounded group, like a section of the iOS Settings app. */
export function SheetRows({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="ios-list rounded-[14px] bg-surface-muted/60 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-4 px-3.5 py-2.5">
          <dt className="text-ink-3">{label}</dt>
          <dd className="text-right font-medium text-ink tabular-nums">{value || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
