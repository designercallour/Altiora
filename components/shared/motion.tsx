"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { fadeInUp, staggerContainer } from "@/lib/motion";

/** Single element that fades + rises in on mount. Respects reduced motion. */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={fadeInUp}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

/** Container that staggers its <StaggerItem> children in on mount. */
export function Stagger({
  children,
  className,
  stagger = 0.05,
  delayChildren = 0.04,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  delayChildren?: number;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={staggerContainer(stagger, delayChildren)}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div className={cn(className)} variants={fadeInUp}>
      {children}
    </motion.div>
  );
}
