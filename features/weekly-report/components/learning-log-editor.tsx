"use client";

import * as React from "react";
import { BookOpen, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import type { LearningLogInput } from "@/services/data-source";

interface Option {
  id: string;
  name: string;
}

interface LearningLogEditorProps {
  logs: LearningLogInput[];
  onChange: (logs: LearningLogInput[]) => void;
  // Retained for compatibility; the dialog no longer collects these.
  categories?: Option[];
  sources?: Option[];
  projects?: Option[];
}

const MIN_CHARS = 300;

function emptyLog(): LearningLogInput {
  return {
    title: "",
    learningCategoryId: null,
    learningSourceId: null,
    projectId: null,
    difficulty: null,
    confidence: null,
    impact: null,
    applied: false,
  };
}

export function LearningLogEditor({ logs, onChange }: LearningLogEditorProps) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<LearningLogInput>(emptyLog());
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const titleChars = draft.title.trim().length;
  const titleValid = titleChars >= MIN_CHARS;

  function openAdd() {
    setDraft(emptyLog());
    setEditingIndex(null);
    setOpen(true);
  }
  function openEdit(index: number) {
    setDraft({ ...logs[index]! });
    setEditingIndex(index);
    setOpen(true);
  }
  function remove(index: number) {
    onChange(logs.filter((_, i) => i !== index));
  }
  function commit() {
    if (!titleValid) return;
    const next = [...logs];
    if (editingIndex === null) next.push(draft);
    else next[editingIndex] = draft;
    onChange(next);
    setOpen(false);
  }

  const patch = (p: Partial<LearningLogInput>) =>
    setDraft((d) => ({ ...d, ...p }));

  return (
    <div className="space-y-3">
      {logs.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No learnings yet"
          description="What did you pick up this week? A technique, a tool, a lesson from your mentor — capture each one."
          action={
            <Button onClick={openAdd}>
              <Plus />
              Add a learning
            </Button>
          }
        />
      ) : (
        <>
          <ul className="space-y-2.5">
            {logs.map((log, i) => (
              <li
                key={log.id ?? i}
                className="group border-border bg-card hover:border-primary/30 flex items-start gap-3 rounded-xl border p-3.5 transition-colors"
              >
                <span className="bg-primary/10 text-primary mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg">
                  <BookOpen className="size-4" />
                </span>
                <p className="min-w-0 flex-1 text-sm leading-relaxed whitespace-pre-line">
                  {log.title}
                </p>
                <div className="flex shrink-0 items-center gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Edit learning"
                    onClick={() => openEdit(i)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove learning"
                    onClick={() => remove(i)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <Button variant="outline" onClick={openAdd} className="w-full">
            <Plus />
            Add another learning
          </Button>
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingIndex === null ? "Add a learning" : "Edit learning"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="log-title">What did you learn?</Label>
              <span
                className={cn(
                  "text-xs tabular-nums",
                  titleValid ? "text-success" : "text-muted-foreground",
                )}
              >
                {titleChars}/{MIN_CHARS} characters
              </span>
            </div>
            <Textarea
              id="log-title"
              autoFocus
              rows={8}
              placeholder="Describe this learning in depth — what it was, how you learned it, and why it matters. Concrete examples help. At least 300 characters."
              value={draft.title}
              onChange={(e) => patch({ title: e.target.value })}
            />
            <p className="text-muted-foreground text-xs">
              Go deep — this is where the real learning lives (min {MIN_CHARS}{" "}
              characters).
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              <X />
              Cancel
            </Button>
            <Button onClick={commit} disabled={!titleValid}>
              <Check />
              {editingIndex === null ? "Add learning" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
