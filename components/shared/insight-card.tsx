import * as React from "react";
import type { LucideIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Tone = "default" | "primary" | "positive" | "attention";

const toneChip: Record<Tone, string> = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  positive: "bg-success/12 text-success",
  attention: "bg-warning/15 text-warning",
};

interface InsightCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  tone?: Tone;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

/**
 * A calm, editorial card for qualitative insight — reflections, mentor notes,
 * growth summaries. The reflection-first counterpart to StatCard.
 */
export function InsightCard({
  title,
  description,
  icon: Icon,
  tone = "default",
  children,
  footer,
  className,
}: InsightCardProps) {
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <div className="flex items-start gap-3">
          {Icon ? (
            <span
              className={cn(
                "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
                toneChip[tone],
              )}
            >
              <Icon className="size-4" aria-hidden />
            </span>
          ) : null}
          <div className="space-y-1">
            <CardTitle>{title}</CardTitle>
            {description ? (
              <CardDescription>{description}</CardDescription>
            ) : null}
          </div>
        </div>
      </CardHeader>
      {children ? (
        <CardContent className="text-sm leading-relaxed">
          {children}
        </CardContent>
      ) : null}
      {footer ? (
        <CardContent className="text-muted-foreground pt-0 text-xs">
          {footer}
        </CardContent>
      ) : null}
    </Card>
  );
}
