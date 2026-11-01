"use client";

import React, { useRef } from "react";
import { useReducedMotion, useScroll, useTransform } from "motion/react";
import * as m from "motion/react-m";
import { EASE_OUT } from "@/components/motion/MotionRoot";

/** The headline rises in, line by line. */
export function HeroTitle({ lines, className }: { lines: string[]; className?: string }) {
  return (
    <h1 className={className}>
      {lines.map((line, i) => (
        <m.span
          key={line}
          initial={{ y: 26 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.9, ease: EASE_OUT, delay: i * 0.1 }}
          className="block"
        >
          {line}
        </m.span>
      ))}
    </h1>
  );
}

/** The product leans back and settles flat as the visitor scrolls towards it. */
export function HeroStage({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : 14, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [reduce ? 1 : 0.94, 1]);

  return (
    <div ref={ref} className={className} style={{ perspective: 1600 }}>
      <m.div style={{ rotateX, scale, transformOrigin: "50% 100%" }}>{children}</m.div>
    </div>
  );
}
