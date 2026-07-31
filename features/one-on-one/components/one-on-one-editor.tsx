"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { OneOnOneNotesValues } from "@/schemas/one-on-one";
import type { OneOnOneStatus } from "@/types/domain";
import { OneOnOneStatusBadge } from "./one-on-one-status-badge";
import { completeOneOnOne, saveOneOnOneDraft } from "../actions";

interface OneOnOneEditorProps {
  internshipId: string;
  year: number;
  month: number;
  initialValues: OneOnOneNotesValues;
  initialStatus: OneOnOneStatus;
}

const FIELDS = [
  {
    name: "strengths",
    emoji: "💪",
    label: "Strengths",
    description: "Things the intern performed well during this month.",
    placeholder: "What stood out — the wins, the growth, the moments to celebrate.",
  },
  {
    name: "concerns",
    emoji: "💬",
    label: "Concerns",
    description:
      "Challenges, feedback, or topics that require attention and follow-up.",
    placeholder: "What to keep an eye on, and what you discussed together.",
  },
  {
    name: "goalsNextMonth",
    emoji: "🎯",
    label: "Goals for Next Month",
    description: "Objectives or focus areas for the upcoming month.",
    placeholder: "The focus areas you agreed on for the month ahead.",
  },
] as const;

export function OneOnOneEditor({
  internshipId,
  year,
  month,
  initialValues,
  initialStatus,
}: OneOnOneEditorProps) {
  const router = useRouter();
  const form = useForm<OneOnOneNotesValues>({ defaultValues: initialValues });
  const [status, setStatus] = React.useState<OneOnOneStatus>(initialStatus);
  const [saving, setSaving] = React.useState<null | "draft" | "complete">(null);

  async function onSaveDraft() {
    setSaving("draft");
    const res = await saveOneOnOneDraft({
      internshipId,
      year,
      month,
      values: form.getValues(),
    });
    setSaving(null);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Draft saved.");
    router.refresh();
  }

  async function onComplete() {
    setSaving("complete");
    const res = await completeOneOnOne({
      internshipId,
      year,
      month,
      values: form.getValues(),
    });
    setSaving(null);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setStatus("completed");
    toast.success("Marked as completed — this is now visible to the intern.");
    router.refresh();
  }

  const busy = saving !== null;

  return (
    <div className="space-y-5">
      <div className="space-y-5">
        {FIELDS.map((f) => (
          <div key={f.name} className="space-y-2">
            <div>
              <Label htmlFor={f.name} className="text-sm font-medium">
                <span aria-hidden>{f.emoji}</span> {f.label}
              </Label>
              <p className="text-muted-foreground mt-1 text-sm">
                {f.description}
              </p>
            </div>
            <Textarea
              id={f.name}
              rows={5}
              placeholder={f.placeholder}
              {...form.register(f.name)}
            />
          </div>
        ))}
      </div>

      <div className="border-border flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <span>Status</span>
          <OneOnOneStatusBadge status={status} />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onSaveDraft} disabled={busy}>
            <Save />
            {saving === "draft" ? "Saving…" : "Save draft"}
          </Button>
          <Button onClick={onComplete} disabled={busy}>
            <CheckCircle2 />
            {saving === "complete"
              ? "Saving…"
              : status === "completed"
                ? "Save & keep completed"
                : "Mark as completed"}
          </Button>
        </div>
      </div>
    </div>
  );
}
