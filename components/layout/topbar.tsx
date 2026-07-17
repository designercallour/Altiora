import * as React from "react";
import { Brand } from "./brand";
import { Breadcrumbs } from "./breadcrumbs";
import { MobileNav } from "./mobile-nav";
import { SearchButton } from "./search-trigger";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import type { AppUser } from "@/types/domain";

export function Topbar({
  user,
  personas,
}: {
  user: AppUser;
  personas: AppUser[];
}) {
  return (
    <header className="bg-background/80 sticky top-0 z-20 flex h-14 items-center gap-2 border-b px-3 backdrop-blur-md sm:px-4 lg:px-6">
      {/* Mobile: menu + brand. Desktop: breadcrumbs. */}
      <MobileNav user={user} personas={personas} />
      <div className="flex min-w-0 flex-1 items-center lg:hidden">
        <Brand />
      </div>
      <div className="hidden min-w-0 flex-1 lg:block">
        <Breadcrumbs />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <SearchButton className="lg:hidden" />
        <ThemeToggle />
        <div className="lg:hidden">
          <UserMenu user={user} personas={personas} variant="compact" />
        </div>
      </div>
    </header>
  );
}
