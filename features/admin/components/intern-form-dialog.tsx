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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { internSchema } from "@/schemas/intern";
import {
  createInternAction,
  updateInternAction,
} from "@/features/admin/actions";
import type { Cohort, InternDetail, MentorSummary } from "@/types/domain";

const NONE = "__none__";

interface Props {
  cohorts: Cohort[];
  mentors: MentorSummary[];
  /** Present → edit mode; absent → create mode. */
  detail?: InternDetail;
  trigger: React.ReactNode;
}

export function InternFormDialog({ cohorts, mentors, detail, trigger }: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const editing = !!detail;
  const i = detail?.internship;

  const [fullName, setFullName] = React.useState(detail?.user.fullName ?? "");
  const [email, setEmail] = React.useState(detail?.user.email ?? "");
  const [cohortId, setCohortId] = React.useState(i?.cohortId ?? NONE);
  const [mentorId, setMentorId] = React.useState(i?.mentorId ?? NONE);
  const [position, setPosition] = React.useState(i?.position ?? "");
  const [startDate, setStartDate] = React.useState(i?.startDate ?? "");
  const [endDate, setEndDate] = React.useState(i?.endDate ?? "");
  const [notes, setNotes] = React.useState(i?.notes ?? "");

  const cohortItems: Record<string, string> = {
    [NONE]: "No cohort",
    ...Object.fromEntries(cohorts.map((c) => [c.id, c.name])),
  };
  const mentorItems: Record<string, string> = {
    [NONE]: "Unassigned",
    ...Object.fromEntries(mentors.map((m) => [m.user.id, m.user.fullName])),
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = {
      fullName,
      email,
      cohortId: cohortId === NONE ? null : cohortId,
      mentorId: mentorId === NONE ? null : mentorId,
      position: position.trim() || null,
      startDate,
      endDate,
      notes: notes.trim() || null,
    };
    const parsed = internSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the form.");
      return;
    }
    setSaving(true);
    const res =
      editing && i
        ? await updateInternAction(i.id, parsed.data)
        : await createInternAction(parsed.data);
    setSaving(false);
    if (res.ok) {
      toast.success(editing ? "Intern updated" : "Intern added", {
        description: `${fullName} is all set.`,
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit intern" : "Add intern"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update this intern's details. Status is computed from the period."
              : "Onboard an intern. They'll be able to sign in with this email."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="in-name">Full name</Label>
            <Input
              id="in-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Maya Putri"
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="in-email">Email</Label>
            <Input
              id="in-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="maya@example.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="in-start">Start date</Label>
              <Input
                id="in-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="in-end">End date</Label>
              <Input
                id="in-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Cohort</Label>
              <Select
                items={cohortItems}
                value={cohortId}
                onValueChange={(v) => setCohortId(v ?? NONE)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>No cohort</SelectItem>
                  {cohorts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Mentor</Label>
              <Select
                items={mentorItems}
                value={mentorId}
                onValueChange={(v) => setMentorId(v ?? NONE)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Unassigned</SelectItem>
                  {mentors.map((m) => (
                    <SelectItem key={m.user.id} value={m.user.id}>
                      {m.user.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="in-position">Role / position</Label>
            <Input
              id="in-position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="Product Design Intern"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="in-notes">Notes (optional)</Label>
            <Textarea
              id="in-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything worth remembering about this intern."
              rows={3}
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
              {saving ? "Saving…" : editing ? "Save changes" : "Add intern"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
