import React from "react";
import { cn } from "@/lib/utils";

type Accent = "brand" | "blue" | "violet" | "amber";

const ACCENT_TEXT: Record<Accent, string> = {
  brand: "text-brand",
  blue: "text-blue",
  violet: "text-violet",
  amber: "text-amber",
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
        {eyebrow && <p className={cn("mb-1 truncate text-[13px] font-semibold", ACCENT_TEXT[accent])}>{eyebrow}</p>}
        <h1 className="font-display text-[30px] font-semibold leading-[1.08] tracking-[-0.035em] text-ink sm:text-[38px]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-[15px] text-ink-3">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
