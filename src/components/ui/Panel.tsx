import React from "react";
import { cn } from "@/lib/utils";

interface PanelProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  /** Remove body padding, e.g. for edge-to-edge row lists. */
  flush?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Panel({ title, description, action, flush, className, children }: PanelProps) {
  return (
    <section className={cn("rounded-panel border border-line bg-surface shadow-panel", className)}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            {title && <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-ink-3">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={flush ? undefined : "p-4 sm:p-5"}>{children}</div>
    </section>
  );
}
