import React from "react";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-12 w-12 text-base",
};

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}

/** Photo when available, otherwise the first letter on a neutral tile. */
export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const classes = cn("shrink-0 rounded-control border border-line", SIZES[size], className);
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} className={cn(classes, "object-cover")} />;
  }
  return (
    <span
      className={cn(classes, "inline-flex items-center justify-center bg-surface-muted font-semibold text-ink-2")}
      aria-hidden="true"
    >
      {name.trim().slice(0, 1).toLocaleUpperCase("tr-TR") || "?"}
    </span>
  );
}
