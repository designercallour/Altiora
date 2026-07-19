"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Brand } from "./brand";
import { NavList } from "./nav-list";
import { SearchTrigger } from "./search-trigger";
import { UserMenu } from "./user-menu";
import { PRIMARY_NAV, SECONDARY_NAV, navFor } from "@/lib/nav";
import type { AppUser } from "@/types/domain";

export function MobileNav({
  user,
  personas,
}: {
  user: AppUser;
  personas: AppUser[];
}) {
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Open navigation"
            className="lg:hidden"
          />
        }
      >
        <Menu className="size-4" />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0" showCloseButton={false}>
        <SheetHeader className="h-14 flex-row items-center px-4">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Primary navigation for Altiora
          </SheetDescription>
          <Brand />
        </SheetHeader>
        <div className="px-3 pb-3">
          <SearchTrigger />
        </div>
        <div className="flex-1 overflow-y-auto px-3">
          <NavList items={navFor(PRIMARY_NAV, user.role)} onNavigate={close} />
          <div className="mt-2 border-t pt-2">
            <NavList items={SECONDARY_NAV} onNavigate={close} />
          </div>
        </div>
        <div className="border-t p-2">
          <UserMenu user={user} personas={personas} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
