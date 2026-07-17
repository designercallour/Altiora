"use client";

import { Check, CloudOff, Loader2, PencilLine } from "lucide-react";
import type { SaveStatus } from "@/hooks/use-autosave";
import { cn } from "@/lib/utils";

export function AutosaveIndicator({
  status,
  className,
}: {
  status: SaveStatus;
  className?: string;
}) {
  const map = {
    idle: { icon: PencilLine, label: "Draft", tone: "text-muted-foreground" },
    saving: { icon: Loader2, label: "Saving…", tone: "text-muted-foreground" },
    saved: { icon: Check, label: "Saved", tone: "text-success" },
    error: { icon: CloudOff, label: "Not saved", tone: "text-destructive" },
  } as const;
  const { icon: Icon, label, tone } = map[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        tone,
        className,
      )}
      aria-live="polite"
    >
      <Icon className={cn("size-3.5", status === "saving" && "animate-spin")} />
      {label}
    </span>
  );
}
