"use client";

import * as React from "react";
import Link from "next/link";
import { Search, UserPlus, Pencil, ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusChip } from "@/components/shared/status-chip";
import { EmptyState } from "@/components/shared/empty-state";
import { InternFormDialog } from "./intern-form-dialog";
import { getInitials } from "@/lib/format";
import { internshipStatus, internshipLifecycle } from "@/lib/internship";
import { ROUTES } from "@/lib/constants";
import type { Cohort, InternSummary, MentorSummary } from "@/types/domain";

const ALL = "__all__";

export function InternManagementList({
  interns,
  cohorts,
  mentors,
}: {
  interns: InternSummary[];
  cohorts: Cohort[];
  mentors: MentorSummary[];
}) {
  const [q, setQ] = React.useState("");
  const [cohortId, setCohortId] = React.useState(ALL);
  const [status, setStatus] = React.useState(ALL);

  const cohortItems: Record<string, string> = {
    [ALL]: "All cohorts",
    ...Object.fromEntries(cohorts.map((c) => [c.id, c.name])),
  };
  const statusItems: Record<string, string> = {
    [ALL]: "All statuses",
    active: "Active",
    inactive: "Inactive",
  };

  const filtered = interns.filter((s) => {
    const term = q.trim().toLowerCase();
    if (
      term &&
      !s.user.fullName.toLowerCase().includes(term) &&
      !s.user.email.toLowerCase().includes(term)
    )
      return false;
    if (cohortId !== ALL && s.internship?.cohortId !== cohortId) return false;
    if (status !== ALL) {
      const st = s.internship ? internshipStatus(s.internship) : "inactive";
      if (st !== status) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or email"
            className="h-9 pl-8"
            aria-label="Search interns"
          />
        </div>
        <Select
          items={cohortItems}
          value={cohortId}
          onValueChange={(v) => setCohortId(v ?? ALL)}
        >
          <SelectTrigger size="default" className="h-9 sm:w-44">
            <SelectValue placeholder="Cohort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All cohorts</SelectItem>
            {cohorts.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          items={statusItems}
          value={status}
          onValueChange={(v) => setStatus(v ?? ALL)}
        >
          <SelectTrigger size="default" className="h-9 sm:w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <InternFormDialog
          cohorts={cohorts}
          mentors={mentors}
          trigger={
            <Button className="h-9">
              <UserPlus />
              Add intern
            </Button>
          }
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No interns found"
          description={
            interns.length === 0
              ? "Add your first intern to get started."
              : "Try a different search or filter."
          }
        />
      ) : (
        <ul className="divide-border border-border divide-y overflow-hidden rounded-xl border">
          {filtered.map((s) => {
            const life = s.internship
              ? internshipLifecycle(s.internship)
              : null;
            return (
              <li
                key={s.user.id}
                className="hover:bg-muted/40 flex items-center gap-3 p-3 transition-colors sm:gap-4 sm:px-4"
              >
                <Avatar className="size-9 shrink-0">
                  {s.user.avatarUrl ? (
                    <AvatarImage src={s.user.avatarUrl} alt="" />
                  ) : null}
                  <AvatarFallback>
                    {getInitials(s.user.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {s.user.fullName}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {s.user.email}
                  </p>
                </div>
                <div className="hidden w-32 shrink-0 md:block">
                  <p className="text-muted-foreground truncate text-xs">
                    {s.cohort?.name ?? "No cohort"}
                  </p>
                  <p className="truncate text-xs">
                    {s.mentor?.fullName ?? "Unassigned"}
                  </p>
                </div>
                <div className="hidden w-24 shrink-0 text-right lg:block">
                  {life?.status === "active" && life.weeksRemaining != null ? (
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {life.weeksRemaining}w left
                    </span>
                  ) : null}
                </div>
                <StatusChip internship={s.internship} className="shrink-0" />
                <div className="flex shrink-0 items-center gap-1">
                  <InternFormDialog
                    cohorts={cohorts}
                    mentors={mentors}
                    detail={{
                      user: s.user,
                      internship: s.internship,
                      cohort: s.cohort,
                      mentor: s.mentor,
                      assignments: [],
                      submittedCount: s.submittedCount,
                      latestReport: s.latestReport,
                    }}
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Edit ${s.user.fullName}`}
                      >
                        <Pencil />
                      </Button>
                    }
                  />
                  {s.internship ? (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      nativeButton={false}
                      aria-label={`Open ${s.user.fullName}`}
                      render={<Link href={ROUTES.intern(s.internship.id)} />}
                    >
                      <ArrowRight />
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
