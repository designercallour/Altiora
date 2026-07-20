import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date");

/** Field shape without cross-field refinement, so `.partial()` can derive from it. */
const cohortShape = z.object({
  name: z.string().trim().min(2, "Name the cohort").max(120),
  description: z.string().trim().max(500).nullable().default(null),
  startDate: isoDate,
  endDate: isoDate,
});

const periodValid = (v: { startDate?: string; endDate?: string }) =>
  !v.startDate || !v.endDate || v.endDate >= v.startDate;
const periodError = {
  message: "End date must be on or after the start date",
  path: ["endDate"],
};

/** Create a cohort (all fields required). */
export const cohortSchema = cohortShape.refine(periodValid, periodError);

/** Edit a cohort — every field optional; period only checked when both present. */
export const cohortUpdateSchema = cohortShape
  .partial()
  .refine(periodValid, periodError);

export type CohortFormValues = z.infer<typeof cohortSchema>;
