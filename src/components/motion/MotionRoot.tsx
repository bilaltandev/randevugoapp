"use client";

import React from "react";
import { LazyMotion, MotionConfig, domAnimation } from "motion/react";
import * as m from "motion/react-m";

/** Loads only the animation features the site uses, and follows the visitor's reduced-motion setting. */
export function MotionRoot({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}

export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/**
 * Slides content up as it enters the viewport. Transform only: if the animation never runs,
 * the content is still there and readable.
 */
export function Reveal({
  children,
  delay = 0,
  distance = 24,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
  className?: string;
}) {
  return (
    <m.div
      initial={{ y: distance }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.7, ease: EASE_OUT, delay }}
      className={className}
    >
      {children}
    </m.div>
  );
}
