"use client";

import * as React from "react";
import Link from "next/link";
import { Search, UserPlus, Pencil, ArrowRight, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { MentorFormDialog } from "./mentor-form-dialog";
import { ArchiveButton } from "./archive-button";
import { archiveMentorAction } from "@/features/admin/actions";
import { getInitials } from "@/lib/format";
import { ROUTES } from "@/lib/constants";
import type { MentorSummary } from "@/types/domain";

export function MentorManagementList({
  mentors,
}: {
  mentors: MentorSummary[];
}) {
  const [q, setQ] = React.useState("");
  const term = q.trim().toLowerCase();
  const filtered = mentors.filter(
    (m) =>
      !term ||
      m.user.fullName.toLowerCase().includes(term) ||
      m.user.email.toLowerCase().includes(term),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search mentors"
            className="h-9 pl-8"
            aria-label="Search mentors"
          />
        </div>
        <MentorFormDialog
          trigger={
            <Button className="h-9">
              <UserPlus />
              Add mentor
            </Button>
          }
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No mentors found"
          description={
            mentors.length === 0
              ? "Add your first mentor to start assigning interns."
              : "Try a different search."
          }
        />
      ) : (
        <ul className="divide-border border-border divide-y overflow-hidden rounded-xl border">
          {filtered.map((m) => (
            <li
              key={m.user.id}
              className="hover:bg-muted/40 flex items-center gap-3 p-3 transition-colors sm:gap-4 sm:px-4"
            >
              <Avatar className="size-9 shrink-0">
                {m.user.avatarUrl ? (
                  <AvatarImage src={m.user.avatarUrl} alt="" />
                ) : null}
                <AvatarFallback>{getInitials(m.user.fullName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {m.user.fullName}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  {m.user.email}
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0 tabular-nums">
                {m.activeInternCount} active
              </Badge>
              <span className="text-muted-foreground hidden w-20 shrink-0 text-right text-xs tabular-nums sm:block">
                {m.totalInternCount} total
              </span>
              <div className="flex shrink-0 items-center gap-1">
                <MentorFormDialog
                  mentor={m.user}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Edit ${m.user.fullName}`}
                    >
                      <Pencil />
                    </Button>
                  }
                />
                <ArchiveButton
                  title={`Remove ${m.user.fullName}?`}
                  description="This mentor will no longer appear in assignment lists. Their past supervision history is preserved."
                  successMessage="Mentor removed"
                  action={() => archiveMentorAction(m.user.id)}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove ${m.user.fullName}`}
                    >
                      <Trash2 />
                    </Button>
                  }
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  nativeButton={false}
                  aria-label={`Open ${m.user.fullName}`}
                  render={<Link href={ROUTES.adminMentor(m.user.id)} />}
                >
                  <ArrowRight />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
