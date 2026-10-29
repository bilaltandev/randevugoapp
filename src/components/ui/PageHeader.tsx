import React from "react";
import { cn } from "@/lib/utils";

type Accent = "brand" | "blue" | "violet" | "amber";

const ACCENT_TEXT: Record<Accent, string> = {
  brand: "text-brand",
  blue: "text-blue",
  violet: "text-violet",
  amber: "text-amber",
};
const ACCENT_BG: Record<Accent, string> = {
  brand: "bg-brand",
  blue: "bg-blue",
  violet: "bg-violet",
  amber: "bg-amber",
};

interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  /** Small label above the title in the page's accent (e.g. today's date), like the mobile app. */
  eyebrow?: React.ReactNode;
  accent?: Accent;
}

export function PageHeader({ title, description, actions, eyebrow, accent = "brand" }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="mb-2 flex items-center gap-2">
          <span className={cn("h-[2px] w-5 rounded-full", ACCENT_BG[accent])} aria-hidden="true" />
          {eyebrow && <span className={cn("truncate text-[13px] font-bold tracking-[0.01em]", ACCENT_TEXT[accent])}>{eyebrow}</span>}
        </div>
        <h1 className="font-display text-[28px] font-extrabold leading-[1.1] tracking-[-0.035em] text-ink sm:text-[34px]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-[15px] text-ink-3">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
