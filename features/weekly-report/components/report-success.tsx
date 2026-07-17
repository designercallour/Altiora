"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { LinkButton } from "@/components/shared/link-button";
import { ROUTES } from "@/lib/constants";

export function ReportSuccess({
  reportId,
  weekLabel,
}: {
  reportId: string;
  weekLabel: string;
}) {
  const reduce = useReducedMotion();

  return (
    <div className="mx-auto flex min-h-[calc(100svh-3.5rem)] max-w-md flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={reduce ? false : { scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="bg-success/12 text-success flex size-16 items-center justify-center rounded-2xl"
      >
        <Check className="size-8" strokeWidth={2.5} />
      </motion.div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.3 }}
        className="mt-6 space-y-2"
      >
        <p className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
          {weekLabel}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Reflection submitted
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed text-balance">
          Nicely done. Your mentor will see this week&rsquo;s reflection, and
          your growth is now part of the bigger picture. See you next week.
        </p>
      </motion.div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.3 }}
        className="mt-8 flex w-full flex-col gap-2 sm:flex-row sm:justify-center"
      >
        <LinkButton href={ROUTES.report(reportId)}>
          View reflection
          <ArrowRight />
        </LinkButton>
        <LinkButton href={ROUTES.dashboard} variant="outline">
          Back to dashboard
        </LinkButton>
      </motion.div>
    </div>
  );
}
