"use client";

import React, { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "md",
}: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  }[maxWidth];

  const dialog = (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#101827]/50 dark:bg-black/70"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Content: bottom sheet on phones, centered dialog from sm up */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative z-10 w-full ${maxWidthClass} sm:max-w-md md:max-w-lg rounded-t-dialog sm:rounded-dialog border border-line bg-surface text-ink p-4 sm:p-6 shadow-pop`}
      >
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-line mb-4 sm:mb-5">
          <h3 id={titleId} className="text-base font-semibold text-ink truncate pr-2">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-control p-1.5 text-ink-3 hover:text-ink hover:bg-surface-muted transition-colors shrink-0"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="max-h-[75vh] sm:max-h-[80vh] overflow-y-auto pr-1">{children}</div>
      </div>
    </div>
  );

  // In the dashboard, render at the shell's root: the page content fades in (an animation makes it a stacking
  // context for a moment) and must never trap the dialog under the top bar. The shell keeps the theme classes.
  // Elsewhere (admin, support) the dialog stays where it is.
  const shell = typeof document !== "undefined" ? document.querySelector(".dash-shell") : null;
  return shell ? createPortal(dialog, shell) : dialog;
}
