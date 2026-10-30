import React from "react";
import { cn } from "@/lib/utils";

/** An input that sits inside a settings row: borderless and right-aligned, like the iOS Settings app. */
export const settingsInput =
  "min-w-0 flex-1 border-0 bg-transparent p-0 text-right text-[15px] text-ink shadow-none outline-none placeholder:text-ink-3 focus:outline-none focus-visible:outline-none";

/** A titled block of rows, with an optional explanation under it. */
export function SettingsGroup({
  title,
  footer,
  className,
  children,
}: {
  title?: string;
  footer?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={className}>
      {title && <h2 className="px-4 pb-1.5 text-[13px] font-semibold text-ink-3">{title}</h2>}
      <div className="ios-list ios-group [--ios-inset:16px]">{children}</div>
      {footer && <p className="px-4 pt-1.5 text-[13px] leading-5 text-ink-3">{footer}</p>}
    </section>
  );
}

/** Label on the left, control on the right. The whole row focuses the control. */
export function SettingsRow({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={cn("flex min-h-12 items-center gap-4 px-4 py-2 focus-within:bg-surface-muted/50", className)}>
      <span className="shrink-0 text-[15px] text-ink">{label}</span>
      {children}
    </label>
  );
}
