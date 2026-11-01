"use client";

import React, { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

function hasWebGL() {
  try {
    return !!document.createElement("canvas").getContext("webgl2");
  } catch {
    return false;
  }
}

/**
 * Loads the 3D calendar after the first paint, so the headline never waits for it. Without WebGL the
 * section keeps its plain background; a visitor who prefers less motion gets one still frame.
 */
export function HeroCalendar({ className }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !hasWebGL()) return;
    let dispose: (() => void) | undefined;
    let cancelled = false;

    import("./heroScene").then(({ mountHeroScene }) => {
      if (cancelled) return;
      dispose = mountHeroScene(host, { animate: !reduce, onReady: () => setReady(true) });
    });

    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [reduce]);

  return <div ref={hostRef} aria-hidden="true" className={className} style={{ opacity: ready ? 1 : 0, transition: "opacity 1.2s ease" }} />;
}
