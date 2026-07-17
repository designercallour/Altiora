import { z } from "zod";

/** Minimum characters for the deep free-text fields (learnings + reflection). */
export const MIN_CHARS = 300;

/** A single learning log as edited in the form. */
export const learningLogInputSchema = z.object({
  id: z.string().optional(),
  title: z
    .string()
    .trim()
    .refine(
      (v) => v.length >= MIN_CHARS,
      `Write at least ${MIN_CHARS} characters for this learning`,
    ),
  learningCategoryId: z.string().nullable(),
  learningSourceId: z.string().nullable(),
  projectId: z.string().nullable(),
  difficulty: z.number().int().min(1).max(5).nullable(),
  confidence: z.number().int().min(1).max(5).nullable(),
  impact: z.number().int().min(1).max(5).nullable(),
  applied: z.boolean(),
});

export const skillScoreInputSchema = z.object({
  skillId: z.string(),
  score: z.number().int().min(1).max(5),
});

/** Full form shape (draft-friendly: metrics may be null while in progress). */
export const reportFormSchema = z.object({
  mood: z.number().int().min(1).max(6).nullable(),
  satisfaction: z.number().int().min(1).max(10).nullable(),
  achievement: z.string().max(5000),
  challenge: z.string().max(5000),
  solution: z.string().max(2000),
  mentorHelp: z.string().max(2000),
  confidence: z.number().int().min(1).max(10).nullable(),
  workingHours: z.number().min(0).max(168).nullable(),
  skillScores: z.array(skillScoreInputSchema),
  learningLogs: z.array(learningLogInputSchema),
});

export type ReportFormValues = z.infer<typeof reportFormSchema>;

/** Stricter rules enforced only at submit time. */
export const reportSubmitSchema = reportFormSchema.extend({
  mood: z.number({ error: "Choose how your week felt" }).int().min(1).max(6),
  achievement: z
    .string()
    .trim()
    .refine(
      (v) => v.length >= MIN_CHARS,
      `Write at least ${MIN_CHARS} characters about your biggest achievement`,
    ),
  challenge: z
    .string()
    .trim()
    .refine(
      (v) => v.length >= MIN_CHARS,
      `Write at least ${MIN_CHARS} characters about a challenge you faced`,
    ),
  learningLogs: z
    .array(learningLogInputSchema)
    .min(3, "Capture at least three learnings this week"),
});

/** Field groups per wizard step — used for per-step validation gating. */
export const STEP_FIELDS = {
  mood: ["mood", "satisfaction"],
  reflection: ["achievement", "challenge", "solution", "mentorHelp"],
  learning: ["learningLogs"],
} as const satisfies Record<string, (keyof ReportFormValues)[]>;
