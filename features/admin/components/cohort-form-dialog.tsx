"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cohortSchema } from "@/schemas/cohort";
import {
  createCohortAction,
  updateCohortAction,
} from "@/features/admin/actions";
import type { Cohort } from "@/types/domain";

interface Props {
  cohort?: Cohort;
  trigger: React.ReactNode;
}

export function CohortFormDialog({ cohort, trigger }: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const editing = !!cohort;

  const [name, setName] = React.useState(cohort?.name ?? "");
  const [description, setDescription] = React.useState(
    cohort?.description ?? "",
  );
  const [startDate, setStartDate] = React.useState(cohort?.startDate ?? "");
  const [endDate, setEndDate] = React.useState(cohort?.endDate ?? "");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = cohortSchema.safeParse({
      name,
      description: description.trim() || null,
      startDate,
      endDate,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the form.");
      return;
    }
    setSaving(true);
    const res =
      editing && cohort
        ? await updateCohortAction(cohort.id, parsed.data)
        : await createCohortAction(parsed.data);
    setSaving(false);
    if (res.ok) {
      toast.success(editing ? "Cohort updated" : "Cohort created", {
        description: `${name} is all set.`,
      });
      setOpen(false);
      router.refresh();
    } else {
      setError(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit cohort" : "New cohort"}</DialogTitle>
          <DialogDescription>
            Cohorts group interns by their program intake.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="ch-name">Name</Label>
            <Input
              id="ch-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Summer 2026"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="ch-start">Start date</Label>
              <Input
                id="ch-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ch-end">End date</Label>
              <Input
                id="ch-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ch-desc">Description (optional)</Label>
            <Textarea
              id="ch-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What defines this cohort?"
              rows={2}
            />
          </div>

          {error ? (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Create cohort"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
