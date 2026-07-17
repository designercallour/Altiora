import * as React from "react";
import { CommandMenuProvider } from "./command-menu";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import type { AppUser } from "@/types/domain";

/**
 * The authenticated application shell: fixed sidebar (desktop), sticky top bar,
 * command palette, and a scrollable content region. Every authenticated page
 * renders inside this. Feature pages only provide their own content.
 */
export function AppShell({
  user,
  personas,
  children,
}: {
  user: AppUser;
  personas: AppUser[];
  children: React.ReactNode;
}) {
  return (
    <CommandMenuProvider>
      <a
        href="#main-content"
        className="bg-primary text-primary-foreground focus-visible:ring-ring sr-only z-50 rounded-md px-3 py-2 text-sm font-medium focus-visible:not-sr-only focus-visible:fixed focus-visible:top-3 focus-visible:left-3 focus-visible:ring-2"
      >
        Skip to content
      </a>
      <Sidebar
        user={user}
        personas={personas}
        className="fixed inset-y-0 left-0 z-30 hidden lg:flex"
      />
      <div className="flex min-h-svh flex-col lg:pl-64">
        <Topbar user={user} personas={personas} />
        <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
      </div>
    </CommandMenuProvider>
  );
}
