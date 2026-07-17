"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCommandMenu } from "./command-menu";
import { cn } from "@/lib/utils";

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="bg-background text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-0.5 rounded border px-1.5 font-sans text-[11px] font-medium select-none">
      {children}
    </kbd>
  );
}

/** Input-styled search affordance for the sidebar. */
export function SearchTrigger({ className }: { className?: string }) {
  const { setOpen } = useCommandMenu();
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cn(
        "border-border bg-background/60 text-muted-foreground hover:bg-accent/60 focus-visible:ring-ring/50 flex h-9 w-full items-center gap-2 rounded-lg border px-2.5 text-sm transition-colors outline-none focus-visible:ring-2",
        className,
      )}
    >
      <Search className="size-4 shrink-0" />
      <span className="flex-1 text-left">Search…</span>
      <Kbd>⌘K</Kbd>
    </button>
  );
}

/** Compact icon trigger for the top bar (mobile). */
export function SearchButton({ className }: { className?: string }) {
  const { setOpen } = useCommandMenu();
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Search"
      className={className}
      onClick={() => setOpen(true)}
    >
      <Search className="size-4" />
    </Button>
  );
}
