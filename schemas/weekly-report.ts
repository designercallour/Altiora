import { z } from "zod";

/** A single learning log as edited in the form. */
export const learningLogInputSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, "Give this learning a title").max(160),
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
  satisfaction: z.number().int().min(1).max(10),
  achievement: z.string().max(2000),
  challenge: z.string().max(2000),
  solution: z.string().max(2000),
  mentorHelp: z.string().max(2000),
  confidence: z.number().int().min(1).max(10),
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
    .min(3, "Share at least one thing you achieved"),
  challenge: z.string().trim().min(3, "Describe a challenge you faced"),
  learningLogs: z
    .array(learningLogInputSchema)
    .min(1, "Add at least one learning from this week"),
  skillScores: z
    .array(skillScoreInputSchema)
    .min(1, "Rate your skills for this week"),
});

/** Field groups per wizard step — used for per-step validation gating. */
export const STEP_FIELDS = {
  mood: ["mood", "satisfaction"],
  reflection: ["achievement", "challenge", "solution", "mentorHelp"],
  learning: ["learningLogs"],
  skills: ["skillScores"],
  confidence: ["confidence", "workingHours"],
} as const satisfies Record<string, (keyof ReportFormValues)[]>;
