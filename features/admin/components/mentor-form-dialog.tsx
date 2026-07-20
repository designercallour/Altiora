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
import { mentorSchema } from "@/schemas/mentor";
import {
  createMentorAction,
  updateMentorAction,
} from "@/features/admin/actions";
import type { AppUser } from "@/types/domain";

interface Props {
  mentor?: Pick<AppUser, "id" | "fullName" | "email">;
  trigger: React.ReactNode;
}

export function MentorFormDialog({ mentor, trigger }: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const editing = !!mentor;

  const [fullName, setFullName] = React.useState(mentor?.fullName ?? "");
  const [email, setEmail] = React.useState(mentor?.email ?? "");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = mentorSchema.safeParse({ fullName, email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the form.");
      return;
    }
    setSaving(true);
    const res =
      editing && mentor
        ? await updateMentorAction(mentor.id, parsed.data)
        : await createMentorAction(parsed.data);
    setSaving(false);
    if (res.ok) {
      toast.success(editing ? "Mentor updated" : "Mentor added", {
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit mentor" : "Add mentor"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update this mentor's details."
              : "Add a mentor. They'll be able to sign in with this email."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="mn-name">Full name</Label>
            <Input
              id="mn-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Temmy Callour"
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="mn-email">Email</Label>
            <Input
              id="mn-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="mentor@callourstudio.com"
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
              {saving ? "Saving…" : editing ? "Save changes" : "Add mentor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
