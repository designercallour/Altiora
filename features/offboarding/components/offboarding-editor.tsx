"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { OFFBOARDING_CHECKLIST, ASSESSMENT_SCALE_MAX } from "@/lib/offboarding";
import type { OffboardingFormValues } from "@/schemas/offboarding";
import type { OffboardingStatus } from "@/types/domain";
import { OffboardingStatusBadge } from "./offboarding-status-badge";
import { completeOffboarding, saveOffboardingDraft } from "../actions";

interface OffboardingEditorProps {
  internshipId: string;
  initialValues: OffboardingFormValues;
  initialStatus: OffboardingStatus;
}

function Field({
  id,
  label,
  description,
  placeholder,
  rows = 4,
  register,
}: {
  id: keyof OffboardingFormValues | string;
  label: string;
  description?: string;
  placeholder?: string;
  rows?: number;
  register: ReturnType<typeof useForm<OffboardingFormValues>>["register"];
}) {
  return (
    <div className="space-y-2">
      <div>
        <Label htmlFor={id as string} className="text-sm font-medium">
          {label}
        </Label>
        {description ? (
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        ) : null}
      </div>
      <Textarea
        id={id as string}
        rows={rows}
        placeholder={placeholder}
        {...register(id as keyof OffboardingFormValues)}
      />
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-1">
      {eyebrow ? (
        <p className="text-primary text-xs font-medium tracking-wide uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h3 className="text-base font-semibold">{title}</h3>
      {description ? (
        <p className="text-muted-foreground text-sm">{description}</p>
      ) : null}
    </div>
  );
}

const RECOMMEND_OPTIONS = [
  { value: "yes", label: "Ya" },
  { value: "no", label: "Tidak" },
  { value: "unsure", label: "Belum yakin" },
] as const;

export function OffboardingEditor({
  internshipId,
  initialValues,
  initialStatus,
}: OffboardingEditorProps) {
  const router = useRouter();
  const form = useForm<OffboardingFormValues>({ defaultValues: initialValues });
  const { register, watch, setValue, getValues } = form;
  const [status, setStatus] = React.useState<OffboardingStatus>(initialStatus);
  const [saving, setSaving] = React.useState<null | "draft" | "complete">(null);

  const checklist = watch("checklist");
  const founders = watch("founderFeedback");
  const recommend = watch("wouldRecommend");
  const assessment = watch("assessmentScores");

  async function run(kind: "draft" | "complete") {
    setSaving(kind);
    const fn = kind === "draft" ? saveOffboardingDraft : completeOffboarding;
    const res = await fn({ internshipId, values: getValues() });
    setSaving(null);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    if (kind === "complete") {
      setStatus("completed");
      toast.success("Offboarding completed — now visible to the intern.");
    } else {
      toast.success("Draft saved.");
    }
    router.refresh();
  }

  const busy = saving !== null;

  return (
    <div className="space-y-10">
      {/* Session info */}
      <section className="space-y-4">
        <SectionTitle title="Info & tanggal" />
        <div className="space-y-2">
          <Label htmlFor="division">Divisi / tim</Label>
          <Input
            id="division"
            placeholder="mis. Design — Brand"
            {...register("division")}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sessionDate">Tanggal sesi 1-on-1</Label>
            <Input id="sessionDate" type="date" {...register("sessionDate")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastDay">Hari terakhir magang</Label>
            <Input id="lastDay" type="date" {...register("lastDay")} />
          </div>
        </div>
      </section>

      <Separator />

      {/* 2.2 Reflection */}
      <section className="space-y-5">
        <SectionTitle
          eyebrow="2.2"
          title="Refleksi anak magang"
          description="Ditulis supervisor berdasarkan jawaban intern saat sesi."
        />
        <Field
          id="reflectionAchievement"
          label="Pencapaian yang paling dibanggakan"
          register={register}
        />
        <Field
          id="reflectionChallenge"
          label="Tantangan terbesar & cara mengatasinya"
          register={register}
        />
        <Field
          id="reflectionSkill"
          label="Skill yang paling berkembang"
          register={register}
        />
      </section>

      <Separator />

      {/* 2.3 Supervisor feedback */}
      <section className="space-y-5">
        <SectionTitle
          eyebrow="2.3"
          title="Feedback supervisor untuk anak magang"
          description="Apresiasi konkret + area pengembangan beserta sarannya."
        />
        <Field
          id="supervisorFeedback"
          label="Feedback supervisor (tulis lengkap)"
          rows={6}
          register={register}
        />
      </section>

      <Separator />

      {/* Form penilaian */}
      <section className="space-y-5">
        <SectionTitle
          title="Form penilaian"
          description={`Skor tiap aspek (1–${ASSESSMENT_SCALE_MAX}) beserta catatan singkat, dibahas bersama saat sesi.`}
        />
        <div className="space-y-4">
          {assessment.map((row, i) => (
            <div
              key={row.aspect}
              className="border-border bg-muted/30 space-y-3 rounded-xl border p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium">{row.aspect}</p>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: ASSESSMENT_SCALE_MAX }, (_, n) => {
                    const value = n + 1;
                    const active = row.score === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-label={`${row.aspect}: ${value}`}
                        onClick={() =>
                          setValue(
                            `assessmentScores.${i}.score` as const,
                            active ? null : value,
                          )
                        }
                        className={cn(
                          "size-8 rounded-lg border text-sm transition-colors",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:bg-muted",
                        )}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </div>
              <Textarea
                rows={2}
                placeholder="Catatan (opsional) — contoh konkret yang mendasari skor."
                {...register(`assessmentScores.${i}.note` as const)}
              />
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* 2.4 Feedback from intern */}
      <section className="space-y-6">
        <SectionTitle
          eyebrow="2.4"
          title="Feedback dari anak magang"
          description="Dua sisi untuk tiap pihak: yang sudah baik & yang bisa ditingkatkan."
        />

        <Field
          id="feedbackForSupervisor"
          label="a. Untuk supervisor (tulis lengkap)"
          register={register}
        />

        {/* Founder feedback table */}
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium">b. Untuk founder</Label>
            <p className="text-muted-foreground mt-1 text-sm">
              Kesan terhadap arahan, keterlibatan, dan komunikasi tiap founder.
            </p>
          </div>
          <div className="space-y-4">
            {founders.map((f, i) => (
              <div
                key={f.founder}
                className="border-border bg-muted/30 space-y-3 rounded-xl border p-4"
              >
                <p className="text-sm font-medium">{f.founder}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor={`founder-good-${i}`}
                      className="text-muted-foreground text-xs"
                    >
                      Yang sudah baik
                    </Label>
                    <Textarea
                      id={`founder-good-${i}`}
                      rows={3}
                      {...register(`founderFeedback.${i}.good` as const)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor={`founder-improve-${i}`}
                      className="text-muted-foreground text-xs"
                    >
                      Yang bisa ditingkatkan
                    </Label>
                    <Textarea
                      id={`founder-improve-${i}`}
                      rows={3}
                      {...register(`founderFeedback.${i}.improve` as const)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Field
          id="feedbackForTeam"
          label="c. Untuk tim (tulis lengkap)"
          description="Kolaborasi, onboarding, dan komunikasi di tim."
          register={register}
        />
        <Field
          id="feedbackForStudio"
          label="d. Untuk studio (culture, program, tools, cara kerja)"
          rows={6}
          register={register}
        />

        {/* Would recommend */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Merekomendasikan studio ke teman sebagai tempat magang?
          </Label>
          <div className="flex flex-wrap gap-2">
            {RECOMMEND_OPTIONS.map((opt) => {
              const active = recommend === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setValue("wouldRecommend", opt.value)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-muted",
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <Separator />

      {/* 2.5 Career */}
      <section className="space-y-5">
        <SectionTitle
          eyebrow="2.5"
          title="Karier & rekomendasi LinkedIn"
          description="Rencana setelah magang dan dukungan yang bisa diberikan."
        />
        <Field
          id="careerPlan"
          label="Rencana karier setelah magang"
          register={register}
        />
        <div className="space-y-2">
          <Label htmlFor="linkedinDeadline">
            Tenggat kirim rekomendasi LinkedIn (dua arah)
          </Label>
          <Input
            id="linkedinDeadline"
            type="date"
            className="max-w-xs"
            {...register("linkedinDeadline")}
          />
        </div>
      </section>

      <Separator />

      {/* Checklist */}
      <section className="space-y-5">
        <SectionTitle
          title="Checklist"
          description="Persiapan, serah terima & akses, dan rekomendasi LinkedIn."
        />
        {OFFBOARDING_CHECKLIST.map((sec) => (
          <div key={sec.title} className="space-y-2.5">
            <p className="text-sm font-medium">{sec.title}</p>
            <div className="space-y-2">
              {sec.items.map((item) => (
                <label
                  key={item.key}
                  htmlFor={`cl-${item.key}`}
                  className="flex cursor-pointer items-start gap-3"
                >
                  <Checkbox
                    id={`cl-${item.key}`}
                    checked={Boolean(checklist?.[item.key])}
                    onCheckedChange={(v) =>
                      setValue(`checklist.${item.key}` as const, Boolean(v))
                    }
                    className="mt-0.5"
                  />
                  <span className="text-sm leading-snug">{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </section>

      <Separator />

      {/* 5 Notes */}
      <section className="space-y-5">
        <SectionTitle eyebrow="5" title="Catatan" />
        <Field
          id="notesKeyPoints"
          label="Poin penting dari sesi"
          register={register}
        />
        <Field
          id="notesFollowUp"
          label="Tindak lanjut & PIC"
          register={register}
        />
      </section>

      {/* Actions */}
      <div className="border-border sticky bottom-0 -mx-px flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <span>Status</span>
          <OffboardingStatusBadge status={status} />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => run("draft")}
            disabled={busy}
          >
            <Save />
            {saving === "draft" ? "Saving…" : "Save draft"}
          </Button>
          <Button onClick={() => run("complete")} disabled={busy}>
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
