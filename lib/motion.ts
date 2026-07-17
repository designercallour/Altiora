/**
 * Motion tokens for Framer Motion — mirrors the CSS easings in globals.css.
 * Keep durations short and easings ease-out; motion should be barely noticed.
 * Components gate these behind `useReducedMotion()`.
 */
import type { Variants } from "framer-motion";

export const EASE = {
  emphasized: [0.16, 1, 0.3, 1] as const, // smooth settle
  standard: [0.4, 0, 0.2, 1] as const,
  outQuart: [0.25, 1, 0.5, 1] as const,
};

export const DURATION = {
  fast: 0.15,
  base: 0.24,
  slow: 0.4,
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: DURATION.base, ease: EASE.standard },
  },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.base, ease: EASE.emphasized },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: DURATION.base, ease: EASE.emphasized },
  },
};

/** Container that staggers its children on entrance. */
export function staggerContainer(stagger = 0.05, delayChildren = 0): Variants {
  return {
    hidden: {},
    show: { transition: { staggerChildren: stagger, delayChildren } },
  };
}
