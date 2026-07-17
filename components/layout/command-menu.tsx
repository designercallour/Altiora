"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Monitor, Moon, NotebookPen, Sun } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { PRIMARY_NAV, SECONDARY_NAV, navFor } from "@/lib/nav";
import { ROUTES } from "@/lib/constants";
import type { UserRole } from "@/types/domain";

interface CommandMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const CommandMenuContext = React.createContext<CommandMenuContextValue | null>(
  null,
);

export function useCommandMenu(): CommandMenuContextValue {
  const ctx = React.useContext(CommandMenuContext);
  if (!ctx)
    throw new Error("useCommandMenu must be used within CommandMenuProvider");
  return ctx;
}

export function CommandMenuProvider({
  children,
  role,
}: {
  children: React.ReactNode;
  role: UserRole;
}) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { setTheme } = useTheme();

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const run = React.useCallback((fn: () => void) => {
    setOpen(false);
    fn();
  }, []);

  return (
    <CommandMenuContext.Provider value={{ open, setOpen }}>
      {children}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput placeholder="Search or jump to…" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Actions">
              <CommandItem
                value="start weekly report new reflection"
                onSelect={() => run(() => router.push(ROUTES.newReport))}
              >
                <NotebookPen />
                <span>Start weekly report</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Navigate">
              {navFor([...PRIMARY_NAV, ...SECONDARY_NAV], role).map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.href}
                    value={`${item.label} ${item.description ?? ""}`}
                    onSelect={() => run(() => router.push(item.href))}
                  >
                    <Icon />
                    <span>{item.label}</span>
                    {item.badge === "soon" ? (
                      <CommandShortcut>Soon</CommandShortcut>
                    ) : null}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Theme">
              <CommandItem
                value="light theme"
                onSelect={() => run(() => setTheme("light"))}
              >
                <Sun />
                <span>Light</span>
              </CommandItem>
              <CommandItem
                value="dark theme"
                onSelect={() => run(() => setTheme("dark"))}
              >
                <Moon />
                <span>Dark</span>
              </CommandItem>
              <CommandItem
                value="system theme"
                onSelect={() => run(() => setTheme("system"))}
              >
                <Monitor />
                <span>System</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </CommandMenuContext.Provider>
  );
}
