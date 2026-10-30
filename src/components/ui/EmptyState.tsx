import React from "react";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}

/** Nothing to show yet: a large quiet icon over a short explanation, like an empty iOS list. */
export function EmptyState({ icon: Icon, title, description, actions }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      {Icon && (
        <span className="mb-4 text-ink-3" aria-hidden="true">
          <Icon className="h-11 w-11" strokeWidth={1.25} />
        </span>
      )}
      <p className="font-display text-[20px] font-semibold tracking-[-0.02em] text-ink">{title}</p>
      {description && <p className="mt-1.5 max-w-sm text-[15px] leading-relaxed text-ink-3">{description}</p>}
      {actions && <div className="mt-5 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  );
}
