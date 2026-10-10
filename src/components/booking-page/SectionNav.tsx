"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Sticky in-page tabs with scroll-spy. */
export function SectionNav({ items }: { items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const visible = new Map<string, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) visible.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0);
        const top = items.find((it) => (visible.get(it.id) ?? 0) > 0);
        if (top) setActive(top.id);
      },
      { rootMargin: "-120px 0px -55% 0px", threshold: [0, 0.01] }
    );
    items.forEach((it) => {
      const el = document.getElementById(it.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [items]);

  if (items.length < 2) return null;

  return (
    <nav aria-label="Sayfa bölümleri" className="sticky top-14 z-30 border-b border-line bg-surface/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 sm:px-4">
        {items.map((it) => (
          <a
            key={it.id}
            href={`#${it.id}`}
            aria-current={active === it.id ? "true" : undefined}
            className={cn(
              "relative shrink-0 px-3 py-3 text-sm transition-colors",
              active === it.id ? "font-medium text-ink" : "text-ink-3 hover:text-ink"
            )}
          >
            {it.label}
            {active === it.id && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-ink" aria-hidden="true" />}
          </a>
        ))}
      </div>
    </nav>
  );
}
