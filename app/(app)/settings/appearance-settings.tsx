"use client";

import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMounted } from "@/hooks/use-mounted";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const current = mounted ? theme : undefined;

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="grid max-w-md grid-cols-3 gap-3"
    >
      {OPTIONS.map((o) => {
        const active = current === o.value;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(o.value)}
            className={cn(
              "focus-visible:ring-ring/50 flex flex-col items-center gap-2 rounded-xl border p-4 text-sm transition-colors outline-none focus-visible:ring-2",
              active
                ? "border-primary ring-primary bg-accent/50 ring-1"
                : "border-border hover:bg-accent/50",
            )}
          >
            <Icon
              className={cn("size-5", active && "text-primary")}
              aria-hidden
            />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
