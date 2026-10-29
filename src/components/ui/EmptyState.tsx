import React from "react";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}

/** Nothing to show yet: a ringed icon over a short explanation. */
export function EmptyState({ icon: Icon, title, description, actions }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      {Icon && (
        <span className="mb-4 rounded-full border border-brand-line p-1.5" aria-hidden="true">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand">
            <Icon className="h-5 w-5" />
          </span>
        </span>
      )}
      <p className="text-[15px] font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-3">{description}</p>}
      {actions && <div className="mt-5 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  );
}
