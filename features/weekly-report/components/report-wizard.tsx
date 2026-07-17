"use client";

import * as React from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LinkButton } from "@/components/shared/link-button";
import { useAutosave } from "@/hooks/use-autosave";
import { moodLevel } from "@/lib/domain";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  MIN_CHARS,
  reportSubmitSchema,
  type ReportFormValues,
} from "@/schemas/weekly-report";
import { saveWeeklyDraft, submitWeeklyReport } from "../actions";
import { MoodPicker } from "./mood-picker";
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
  categories: Option[];
  sources: Option[];
  projects: Option[];
}

const MIN_LEARNINGS = 3;

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
    key: "review",
    title: "Review",
    subtitle: "One last look before you submit.",
  },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

export function ReportWizard(props: WizardProps) {
  const { internshipId, week, initialValues } = props;
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
          values.achievement.trim().length >= MIN_CHARS &&
          values.challenge.trim().length >= MIN_CHARS
        );
      case "learning":
        return values.learningLogs.length >= MIN_LEARNINGS;
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
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight">
              {STEPS[step]!.title}
            </h1>
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
          <MoodPicker value={values.mood} onChange={(v) => setValue("mood", v)} />
        );
      case "reflection":
        return (
          <div className="space-y-5">
            <ReflectionField
              label="Your biggest achievement"
              chars={values.achievement.trim().length}
              placeholder="What went well? What are you proud of? Go into detail — the context, what you actually did, and why it mattered."
              register={form.register("achievement")}
            />
            <ReflectionField
              label="A challenge you faced"
              chars={values.challenge.trim().length}
              placeholder="What was hard this week? What made it difficult, how did you work through it, and what would you do differently?"
              register={form.register("challenge")}
            />
          </div>
        );
      case "learning": {
        const count = values.learningLogs.length;
        const enough = count >= MIN_LEARNINGS;
        return (
          <div className="space-y-3">
            <div className="border-border flex items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5">
              <span
                className={cn(
                  "text-sm",
                  enough
                    ? "text-success font-medium"
                    : "text-muted-foreground",
                )}
              >
                {enough
                  ? "Great — you've captured enough for this week."
                  : `Add at least ${MIN_LEARNINGS} learnings to continue.`}
              </span>
              <span className="text-muted-foreground text-sm font-medium tabular-nums">
                {count}/{MIN_LEARNINGS}
              </span>
            </div>
            <LearningLogEditor
              logs={values.learningLogs}
              onChange={(logs) => setValue("learningLogs", logs)}
              categories={props.categories}
              sources={props.sources}
              projects={props.projects}
            />
          </div>
        );
      }
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

function ReflectionField({
  label,
  chars,
  placeholder,
  register,
}: {
  label: string;
  chars: number;
  placeholder: string;
  register: UseFormRegisterReturn;
}) {
  const valid = chars >= MIN_CHARS;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>
          {label}
          <span className="text-primary ml-0.5">*</span>
        </Label>
        <span
          className={cn(
            "text-xs tabular-nums",
            valid ? "text-success" : "text-muted-foreground",
          )}
        >
          {chars}/{MIN_CHARS} characters
        </span>
      </div>
      <Textarea rows={7} placeholder={placeholder} {...register} />
      <p className="text-muted-foreground text-xs">
        Go deep — at least {MIN_CHARS} characters.
      </p>
    </div>
  );
}
