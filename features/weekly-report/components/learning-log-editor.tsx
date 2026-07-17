"use client";

import * as React from "react";
import { BookOpen, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import type { LearningLogInput } from "@/services/data-source";
import { RatingScale } from "./rating-scale";

interface Option {
  id: string;
  name: string;
}

interface LearningLogEditorProps {
  logs: LearningLogInput[];
  onChange: (logs: LearningLogInput[]) => void;
  categories: Option[];
  sources: Option[];
  projects: Option[];
}

const NONE = "__none__";

function emptyLog(): LearningLogInput {
  return {
    title: "",
    learningCategoryId: null,
    learningSourceId: null,
    projectId: null,
    difficulty: 3,
    confidence: 3,
    impact: 3,
    applied: false,
  };
}

export function LearningLogEditor({
  logs,
  onChange,
  categories,
  sources,
  projects,
}: LearningLogEditorProps) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<LearningLogInput>(emptyLog());
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);

  const nameById = React.useMemo(() => {
    const m = new Map<string, string>();
    [...categories, ...sources, ...projects].forEach((o) =>
      m.set(o.id, o.name),
    );
    return m;
  }, [categories, sources, projects]);

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
    if (!draft.title.trim()) return;
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
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="text-sm font-medium">{log.title}</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {log.learningCategoryId ? (
                      <Badge variant="secondary">
                        {nameById.get(log.learningCategoryId)}
                      </Badge>
                    ) : null}
                    {log.learningSourceId ? (
                      <Badge variant="outline">
                        {nameById.get(log.learningSourceId)}
                      </Badge>
                    ) : null}
                    {log.applied ? (
                      <Badge variant="outline" className="gap-1">
                        <Check className="size-3" />
                        Applied
                      </Badge>
                    ) : null}
                    <span className="text-muted-foreground text-xs">
                      Impact {log.impact ?? "–"}/5
                    </span>
                  </div>
                </div>
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

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="log-title">What did you learn?</Label>
              <Input
                id="log-title"
                autoFocus
                placeholder="e.g. Auto-layout patterns for responsive components"
                value={draft.title}
                onChange={(e) => patch({ title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={draft.learningCategoryId ?? undefined}
                  onValueChange={(v) => patch({ learningCategoryId: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Source</Label>
                <Select
                  value={draft.learningSourceId ?? undefined}
                  onValueChange={(v) => patch({ learningSourceId: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {sources.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {projects.length ? (
              <div className="space-y-2">
                <Label>Project (optional)</Label>
                <Select
                  value={draft.projectId ?? NONE}
                  onValueChange={(v) =>
                    patch({ projectId: v === NONE ? null : v })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="No project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>No project</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Difficulty</Label>
                <RatingScale
                  ariaLabel="Difficulty"
                  value={draft.difficulty}
                  onChange={(v) => patch({ difficulty: v })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Confidence</Label>
                <RatingScale
                  ariaLabel="Confidence"
                  value={draft.confidence}
                  onChange={(v) => patch({ confidence: v })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Impact</Label>
                <RatingScale
                  ariaLabel="Impact"
                  value={draft.impact}
                  onChange={(v) => patch({ impact: v })}
                />
              </div>
            </div>

            <div className="border-border flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="log-applied" className="font-medium">
                  Applied it already?
                </Label>
                <p className="text-muted-foreground text-xs">
                  Did you put this learning into practice?
                </p>
              </div>
              <Switch
                id="log-applied"
                checked={draft.applied}
                onCheckedChange={(v) => patch({ applied: v })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              <X />
              Cancel
            </Button>
            <Button onClick={commit} disabled={!draft.title.trim()}>
              <Check />
              {editingIndex === null ? "Add learning" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
