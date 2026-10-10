import { cn } from "@/lib/utils";

/** Selectable option tiles/chips (layouts, sizes, directions): one look for "picked" vs "available". */
export function choiceClasses(selected: boolean, className?: string) {
  return cn(
    "rounded-control border text-sm transition-colors",
    selected
      ? "border-brand bg-brand-soft text-brand-ink"
      : "border-line-strong bg-surface text-ink-2 hover:bg-surface-muted hover:text-ink",
    className
  );
}
