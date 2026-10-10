import React from "react";
import { cn } from "@/lib/utils";

interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
}

interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  /** Stretch segments to fill the row (useful on phones). */
  fill?: boolean;
  "aria-label"?: string;
}

/** Compact single-choice switch: view modes, filters, page tabs. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  fill,
  ...rest
}: SegmentedProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={rest["aria-label"]}
      className={cn(
        "inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-[10px] border border-line bg-surface-muted p-[3px]",
        fill && "flex w-full",
        className
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[7px] px-3 text-[13px] font-medium transition-colors",
              fill && "flex-1",
              active ? "bg-surface text-ink shadow-raised" : "text-ink-3 hover:text-ink"
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {opt.label}
            {typeof opt.count === "number" && (
              <span className={cn("tabular-nums", active ? "text-ink-3" : "text-ink-3/80")}>{opt.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
