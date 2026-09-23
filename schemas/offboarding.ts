import { z } from "zod";

/**
 * Internship Offboarding — the supervisor-authored exit 1-on-1 + handover.
 * Every narrative field is optional free-text (a supervisor may save a partial
 * draft), so the schema only caps length. `wouldRecommend` is a tri-state for
 * the form; the action maps it to boolean | null.
 */
const longText = z.string().max(5000);
const isoDate = z.string().max(10); // "yyyy-MM-dd" or ""

export const founderFeedbackSchema = z.object({
  founder: z.string().max(120),
  good: z.string().max(3000),
  improve: z.string().max(3000),
});

export const assessmentScoreSchema = z.object({
  aspect: z.string().max(120),
  score: z.number().int().min(0).max(10).nullable(),
  note: z.string().max(1000),
});

export const offboardingValuesSchema = z.object({
  division: z.string().max(200),
  sessionDate: isoDate,
  lastDay: isoDate,
  // 2.2 — intern reflection
  reflectionAchievement: longText,
  reflectionChallenge: longText,
  reflectionSkill: longText,
  // 2.3 — supervisor → intern
  supervisorFeedback: longText,
  // form penilaian
  assessmentScores: z.array(assessmentScoreSchema),
  // 2.4 — intern → …
  feedbackForSupervisor: longText,
  founderFeedback: z.array(founderFeedbackSchema),
  feedbackForTeam: longText,
  feedbackForStudio: longText,
  wouldRecommend: z.enum(["yes", "no", "unsure"]),
  // 2.5 — career
  careerPlan: longText,
  linkedinDeadline: isoDate,
  // 1 / 3 / 4 — checklist
  checklist: z.record(z.string(), z.boolean()),
  // 5 — notes
  notesKeyPoints: longText,
  notesFollowUp: longText,
});

export type OffboardingFormValues = z.infer<typeof offboardingValuesSchema>;
export type FounderFeedbackValues = z.infer<typeof founderFeedbackSchema>;
export type AssessmentScoreValues = z.infer<typeof assessmentScoreSchema>;
