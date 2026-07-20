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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assignMentorAction } from "@/features/admin/actions";
import type { InternSummary } from "@/types/domain";

/**
 * From a mentor's page: pick an intern and hand them to this mentor. Only
 * interns not already supervised by this mentor are offered.
 */
export function AssignInternToMentorDialog({
  mentorId,
  mentorName,
  interns,
  trigger,
}: {
  mentorId: string;
  mentorName: string;
  interns: InternSummary[];
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [internshipId, setInternshipId] = React.useState("");

  const assignable = interns.filter(
    (s) => s.internship && s.internship.mentorId !== mentorId,
  );
  const internItems: Record<string, string> = Object.fromEntries(
    assignable.map((s) => [
      s.internship!.id,
      s.mentor
        ? `${s.user.fullName} · now with ${s.mentor.fullName}`
        : s.user.fullName,
    ]),
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!internshipId) {
      setError("Choose an intern.");
      return;
    }
    setSaving(true);
    const res = await assignMentorAction(internshipId, { mentorId, note: null });
    setSaving(false);
    if (res.ok) {
      const name = interns.find((s) => s.internship?.id === internshipId)?.user
        .fullName;
      toast.success("Intern assigned", {
        description: `${name ?? "Intern"} now reports to ${mentorName}.`,
      });
      setOpen(false);
      setInternshipId("");
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
          <DialogTitle>Assign an intern</DialogTitle>
          <DialogDescription>
            Hand an intern to {mentorName}. Any current mentor is replaced and
            the change is recorded in the history.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label>Intern</Label>
            <Select
              items={internItems}
              value={internshipId}
              onValueChange={(v) => setInternshipId(v ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose an intern" />
              </SelectTrigger>
              <SelectContent>
                {assignable.map((s) => (
                  <SelectItem key={s.internship!.id} value={s.internship!.id}>
                    {s.user.fullName}
                    {s.mentor ? ` · now with ${s.mentor.fullName}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Button type="submit" disabled={saving || assignable.length === 0}>
              {saving ? "Assigning…" : "Assign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
