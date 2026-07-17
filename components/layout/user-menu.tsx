"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChevronsUpDown,
  LogOut,
  Settings,
  UserRound,
  Repeat2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/lib/constants";
import { ROLE_LABELS } from "@/lib/domain";
import { getInitials } from "@/lib/format";
import { signInAsPersona, signOut } from "@/features/auth/actions";
import type { AppUser } from "@/types/domain";
import { cn } from "@/lib/utils";

export function UserMenu({
  user,
  personas,
  variant = "full",
}: {
  user: AppUser;
  personas: AppUser[];
  variant?: "full" | "compact";
}) {
  const avatar = (
    <Avatar size={variant === "full" ? "default" : "sm"}>
      {user.avatarUrl ? (
        <AvatarImage src={user.avatarUrl} alt={user.fullName} />
      ) : null}
      <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
    </Avatar>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Account menu"
            className={cn(
              "focus-visible:ring-ring/50 flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2",
              variant === "full" &&
                "hover:bg-sidebar-accent w-full p-1.5 text-left transition-colors",
            )}
          />
        }
      >
        {avatar}
        {variant === "full" ? (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                {user.fullName}
              </span>
              <span className="text-muted-foreground block truncate text-xs">
                {user.email}
              </span>
            </span>
            <ChevronsUpDown className="text-muted-foreground size-4 shrink-0" />
          </>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60" sideOffset={8}>
        <div className="flex items-center gap-2.5 px-1.5 py-1.5">
          {avatar}
          <span className="min-w-0">
            <span className="text-foreground block truncate text-sm font-medium">
              {user.fullName}
            </span>
            <span className="text-muted-foreground block truncate text-xs">
              {user.email}
            </span>
          </span>
        </div>
        <div className="px-1.5 pb-1.5">
          <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link href={ROUTES.settings} />}>
            <UserRound />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href={ROUTES.settings} />}>
            <Settings />
            Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>

        {personas.length > 1 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Repeat2 />
                Switch persona
                <Badge variant="outline" className="ml-auto">
                  Dev
                </Badge>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="max-h-80 w-56 overflow-y-auto">
                {personas.map((p) => (
                  <DropdownMenuItem
                    key={p.id}
                    disabled={p.id === user.id}
                    onClick={() => {
                      if (p.id !== user.id) void signInAsPersona(p.id);
                    }}
                  >
                    <Avatar size="sm">
                      <AvatarFallback>{getInitials(p.fullName)}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{p.fullName}</span>
                    </span>
                    <span className="text-muted-foreground text-[11px]">
                      {p.id === user.id ? "current" : ROLE_LABELS[p.role]}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        ) : null}

        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => void signOut()}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
