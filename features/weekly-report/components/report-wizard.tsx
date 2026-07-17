"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LinkButton } from "@/components/shared/link-button";
import { useAutosave } from "@/hooks/use-autosave";
import { moodLevel } from "@/lib/domain";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  reportSubmitSchema,
  type ReportFormValues,
} from "@/schemas/weekly-report";
import { saveWeeklyDraft, submitWeeklyReport } from "../actions";
import { MoodPicker } from "./mood-picker";
import { ScaleField } from "./scale-field";
import { RatingScale } from "./rating-scale";
import { LearningLogEditor } from "./learning-log-editor";
import { AutosaveIndicator } from "./autosave-indicator";

interface Option {
  id: string;
  name: string;
}

interface WizardProps {
  reportId: string | null;
  internshipId: string;
  week: {
    year: number;
    weekNumber: number;
    startDate: string;
    endDate: string;
    label: string;
  };
  initialValues: ReportFormValues;
  skills: Option[];
  categories: Option[];
  sources: Option[];
  projects: Option[];
}

const STEPS = [
  {
    key: "mood",
    title: "How was your week?",
    subtitle: "A quick check-in — there are no wrong answers.",
  },
  {
    key: "reflection",
    title: "Your work",
    subtitle: "Your wins, your challenges, and how you worked through them.",
  },
  {
    key: "learning",
    title: "What you learned",
    subtitle:
      "Capture each learning as its own entry — this is the heart of Altiora.",
  },
  {
    key: "skills",
    title: "Skill growth",
    subtitle: "Where are your skills this week? Trust your gut.",
  },
  {
    key: "confidence",
    title: "Wrapping up",
    subtitle: "How confident do you feel, and how much did you work?",
  },
  {
    key: "review",
    title: "Review",
    subtitle: "One last look before you submit.",
  },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

export function ReportWizard(props: WizardProps) {
  const { internshipId, week, initialValues, skills } = props;
  const reduce = useReducedMotion();
  const form = useForm<ReportFormValues>({ defaultValues: initialValues });
  const values = form.watch();

  const [step, setStep] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);

  const reportIdRef = React.useRef(props.reportId);

  const save = React.useCallback(
    async (v: ReportFormValues) => {
      const res = await saveWeeklyDraft({
        reportId: reportIdRef.current,
        internshipId,
        year: week.year,
        weekNumber: week.weekNumber,
        startDate: week.startDate,
        endDate: week.endDate,
        values: v,
      });
      reportIdRef.current = res.reportId;
    },
    [internshipId, week.year, week.weekNumber, week.startDate, week.endDate],
  );

  const { status } = useAutosave(values, save, {
    enabled: !submitting,
  });

  const setValue = <K extends keyof ReportFormValues>(
    name: K,
    value: ReportFormValues[K],
  ) => form.setValue(name as never, value as never, { shouldDirty: true });

  // ── Per-step gating ────────────────────────────────────────────────────
  function stepComplete(key: StepKey): boolean {
    switch (key) {
      case "mood":
        return values.mood !== null;
      case "reflection":
        return (
          values.achievement.trim().length > 0 &&
          values.challenge.trim().length > 0
        );
      case "learning":
        return values.learningLogs.length > 0;
      case "skills":
        return values.skillScores.length === skills.length;
      default:
        return true;
    }
  }

  const currentKey = STEPS[step]!.key;
  const canContinue = stepComplete(currentKey);

  function goNext() {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  }
  function goBack() {
    if (step > 0) setStep((s) => s - 1);
  }
  function goTo(key: StepKey) {
    const idx = STEPS.findIndex((s) => s.key === key);
    if (idx >= 0) setStep(idx);
  }

  async function onSubmit() {
    const parsed = reportSubmitSchema.safeParse(form.getValues());
    if (!parsed.success) {
      toast.error(
        parsed.error.issues[0]?.message ?? "Please complete the report.",
      );
      return;
    }
    setSubmitting(true);
    // On success the action redirects; execution only continues on failure.
    const res = await submitWeeklyReport({
      reportId: reportIdRef.current,
      internshipId,
      year: week.year,
      weekNumber: week.weekNumber,
      startDate: week.startDate,
      endDate: week.endDate,
      values: form.getValues(),
    });
    toast.error(res.error);
    setSubmitting(false);
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="mx-auto flex min-h-[calc(100svh-3.5rem)] w-full max-w-2xl flex-col px-4 py-5 sm:px-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
            {week.label}
          </p>
          <p className="text-sm font-medium">
            Step {step + 1} of {STEPS.length}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AutosaveIndicator status={status} />
          <LinkButton href={ROUTES.reports} variant="ghost" size="sm">
            <X />
            Exit
          </LinkButton>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-muted mt-3 h-1 overflow-hidden rounded-full">
        <motion.div
          className="bg-primary h-full rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: reduce ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      {/* Step body */}
      <div className="flex flex-1 flex-col justify-center py-8">
        <motion.div
          key={currentKey}
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="mb-6 space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">
              {STEPS[step]!.title}
            </h1>
            <p className="text-muted-foreground text-sm">
              {STEPS[step]!.subtitle}
            </p>
          </div>
          {renderStep(currentKey)}
        </motion.div>
      </div>

      {/* Footer */}
      <div className="border-border sticky bottom-0 flex items-center justify-between gap-3 border-t py-4">
        <Button
          variant="ghost"
          onClick={goBack}
          disabled={step === 0}
          className={cn(step === 0 && "invisible")}
        >
          <ArrowLeft />
          Back
        </Button>
        {currentKey === "review" ? (
          <Button onClick={onSubmit} disabled={submitting}>
            <Send />
            {submitting ? "Submitting…" : "Submit reflection"}
          </Button>
        ) : (
          <Button onClick={goNext} disabled={!canContinue}>
            Continue
            <ArrowRight />
          </Button>
        )}
      </div>
    </div>
  );

  // ── Step renderers ───────────────────────────────────────────────────────
  function renderStep(key: StepKey) {
    switch (key) {
      case "mood":
        return (
          <div className="space-y-8">
            <MoodPicker
              value={values.mood}
              onChange={(v) => setValue("mood", v)}
            />
            <div className="space-y-3">
              <Label>How satisfied are you with your week?</Label>
              <ScaleField
                value={values.satisfaction}
                onChange={(v) => setValue("satisfaction", v)}
                minLabel="Not at all"
                maxLabel="Completely"
              />
            </div>
          </div>
        );
      case "reflection":
        return (
          <div className="space-y-5">
            <Field label="Your biggest achievement" required>
              <Textarea
                rows={3}
                placeholder="What went well? What are you proud of?"
                {...form.register("achievement")}
              />
            </Field>
            <Field label="A challenge you faced" required>
              <Textarea
                rows={3}
                placeholder="What was hard this week?"
                {...form.register("challenge")}
              />
            </Field>
            <Field label="How you approached it" hint="Optional">
              <Textarea
                rows={2}
                placeholder="What did you try? What worked?"
                {...form.register("solution")}
              />
            </Field>
            <Field label="Where you'd like mentor support" hint="Optional">
              <Textarea
                rows={2}
                placeholder="Anything you'd like help or feedback on?"
                {...form.register("mentorHelp")}
              />
            </Field>
          </div>
        );
      case "learning":
        return (
          <LearningLogEditor
            logs={values.learningLogs}
            onChange={(logs) => setValue("learningLogs", logs)}
            categories={props.categories}
            sources={props.sources}
            projects={props.projects}
          />
        );
      case "skills":
        return (
          <div className="space-y-4">
            {skills.map((skill) => {
              const score =
                values.skillScores.find((s) => s.skillId === skill.id)?.score ??
                null;
              return (
                <div
                  key={skill.id}
                  className="flex items-center justify-between gap-4"
                >
                  <span className="text-sm font-medium">{skill.name}</span>
                  <RatingScale
                    ariaLabel={skill.name}
                    value={score}
                    onChange={(v) => {
                      const next = values.skillScores.some(
                        (s) => s.skillId === skill.id,
                      )
                        ? values.skillScores.map((s) =>
                            s.skillId === skill.id ? { ...s, score: v } : s,
                          )
                        : [
                            ...values.skillScores,
                            { skillId: skill.id, score: v },
                          ];
                      setValue("skillScores", next);
                    }}
                    className="w-52 shrink-0"
                  />
                </div>
              );
            })}
          </div>
        );
      case "confidence":
        return (
          <div className="space-y-8">
            <div className="space-y-3">
              <Label>How confident do you feel right now?</Label>
              <ScaleField
                value={values.confidence}
                onChange={(v) => setValue("confidence", v)}
                minLabel="Still finding my feet"
                maxLabel="Very confident"
              />
            </div>
            <Field label="Working hours this week" hint="Optional">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                max={168}
                placeholder="e.g. 40"
                className="max-w-40"
                value={values.workingHours ?? ""}
                onChange={(e) =>
                  setValue(
                    "workingHours",
                    e.target.value === "" ? null : Number(e.target.value),
                  )
                }
              />
            </Field>
          </div>
        );
      case "review":
        return <ReviewStep />;
      default:
        return null;
    }
  }

  function ReviewStep() {
    const mood = moodLevel(values.mood);
    const rows: { label: string; value: React.ReactNode; step: StepKey }[] = [
      {
        label: "Mood",
        step: "mood",
        value: mood ? `${mood.emoji} ${mood.label}` : "—",
      },
      {
        label: "Satisfaction",
        step: "mood",
        value: `${values.satisfaction}/10`,
      },
      {
        label: "Achievement",
        step: "reflection",
        value: values.achievement.trim() || "—",
      },
      {
        label: "Challenge",
        step: "reflection",
        value: values.challenge.trim() || "—",
      },
      {
        label: "Learnings",
        step: "learning",
        value: `${values.learningLogs.length} captured`,
      },
      {
        label: "Skills rated",
        step: "skills",
        value: `${values.skillScores.length}/${skills.length}`,
      },
      {
        label: "Confidence",
        step: "confidence",
        value: `${values.confidence}/10`,
      },
      {
        label: "Working hours",
        step: "confidence",
        value: values.workingHours != null ? `${values.workingHours}h` : "—",
      },
    ];
    return (
      <div className="divide-border border-border divide-y rounded-xl border">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-start justify-between gap-4 px-4 py-3"
          >
            <span className="text-muted-foreground text-sm">{r.label}</span>
            <div className="flex min-w-0 items-start gap-3">
              <span className="line-clamp-2 max-w-xs text-right text-sm">
                {r.value}
              </span>
              <button
                type="button"
                onClick={() => goTo(r.step)}
                className="text-primary shrink-0 text-xs font-medium hover:underline"
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>
          {label}
          {required ? <span className="text-primary ml-0.5">*</span> : null}
        </Label>
        {hint ? (
          <span className="text-muted-foreground text-xs">{hint}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}
