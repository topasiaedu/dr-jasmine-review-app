"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

type StepPanelProps = {
  stepKey: string;
  children: ReactNode;
};

/**
 * Calm enter animation for each wizard step. Honors prefers-reduced-motion.
 */
export function StepPanel({ stepKey, children }: StepPanelProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      key={stepKey}
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { duration: 0.38, ease: [0.22, 1, 0.36, 1] }
      }
      className="rounded-2xl border border-[color:var(--brand-line)] bg-card p-4 shadow-[var(--brand-shadow)] sm:p-[18px]"
    >
      {children}
    </motion.section>
  );
}
