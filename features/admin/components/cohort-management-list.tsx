"use client";

import * as React from "react";
import { Layers, Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { CohortFormDialog } from "./cohort-form-dialog";
import { ArchiveButton } from "./archive-button";
import { archiveCohortAction } from "@/features/admin/actions";
import { formatDate } from "@/lib/format";
import type { Cohort } from "@/types/domain";

export function CohortManagementList({
  cohorts,
  counts,
}: {
  cohorts: Cohort[];
  /** internshipId count keyed by cohortId. */
  counts: Record<string, number>;
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CohortFormDialog
          trigger={
            <Button className="h-9">
              <Plus />
              New cohort
            </Button>
          }
        />
      </div>

      {cohorts.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No cohorts yet"
          description="Create a cohort to group interns by their program intake."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {cohorts.map((c) => {
            const count = counts[c.id] ?? 0;
            return (
              <Card key={c.id} size="sm">
                <CardContent className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{c.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {formatDate(c.startDate)} – {formatDate(c.endDate)}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 tabular-nums">
                      {count} intern{count === 1 ? "" : "s"}
                    </Badge>
                  </div>
                  {c.description ? (
                    <p className="text-muted-foreground line-clamp-2 text-sm">
                      {c.description}
                    </p>
                  ) : null}
                  <div className="flex items-center gap-1">
                    <CohortFormDialog
                      cohort={c}
                      trigger={
                        <Button variant="ghost" size="sm">
                          <Pencil />
                          Edit
                        </Button>
                      }
                    />
                    <ArchiveButton
                      title={`Archive ${c.name}?`}
                      description="The cohort is hidden from new assignments. Interns already in it keep their records."
                      confirmLabel="Archive"
                      successMessage="Cohort archived"
                      action={() => archiveCohortAction(c.id)}
                      trigger={
                        <Button variant="ghost" size="sm">
                          <Trash2 />
                          Archive
                        </Button>
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
