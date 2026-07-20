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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assignMentorSchema } from "@/schemas/mentor";
import { assignMentorAction } from "@/features/admin/actions";
import type { MentorSummary } from "@/types/domain";

interface Props {
  internshipId: string;
  internName: string;
  mentors: MentorSummary[];
  currentMentorId?: string | null;
  /** Pre-select this mentor (e.g. assigning from a mentor's page). */
  presetMentorId?: string;
  trigger: React.ReactNode;
}

export function AssignMentorDialog({
  internshipId,
  internName,
  mentors,
  currentMentorId,
  presetMentorId,
  trigger,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [mentorId, setMentorId] = React.useState(
    presetMentorId ?? currentMentorId ?? "",
  );
  const [note, setNote] = React.useState("");

  const mentorItems: Record<string, string> = Object.fromEntries(
    mentors.map((m) => [
      m.user.id,
      m.user.id === currentMentorId
        ? `${m.user.fullName} (current)`
        : m.user.fullName,
    ]),
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = assignMentorSchema.safeParse({
      mentorId,
      note: note.trim() || null,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Choose a mentor.");
      return;
    }
    if (mentorId === currentMentorId) {
      setError("That mentor is already assigned.");
      return;
    }
    setSaving(true);
    const res = await assignMentorAction(internshipId, parsed.data);
    setSaving(false);
    if (res.ok) {
      const name = mentors.find((m) => m.user.id === mentorId)?.user.fullName;
      toast.success("Mentor assigned", {
        description: `${name ?? "Mentor"} now mentors ${internName}.`,
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
          <DialogTitle>
            {currentMentorId ? "Reassign mentor" : "Assign mentor"}
          </DialogTitle>
          <DialogDescription>
            Choose who mentors {internName}. The previous assignment is kept in
            the history.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label>Mentor</Label>
            <Select
              items={mentorItems}
              value={mentorId}
              onValueChange={(v) => setMentorId(v ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a mentor" />
              </SelectTrigger>
              <SelectContent>
                {mentors.map((m) => (
                  <SelectItem key={m.user.id} value={m.user.id}>
                    {m.user.fullName}
                    {m.user.id === currentMentorId ? " (current)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="as-note">Note (optional)</Label>
            <Textarea
              id="as-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why the change? (kept in the audit trail)"
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
              {saving ? "Saving…" : "Assign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
