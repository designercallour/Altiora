import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date");

/** Field shape without cross-field refinement, so `.partial()` can derive from it. */
const internShape = z.object({
  fullName: z.string().trim().min(2, "Enter the intern's full name").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  cohortId: z.string().uuid().nullable().default(null),
  mentorId: z.string().uuid().nullable().default(null),
  position: z.string().trim().max(120).nullable().default(null),
  startDate: isoDate,
  endDate: isoDate,
  notes: z.string().trim().max(2000).nullable().default(null),
});

const periodValid = (v: { startDate?: string; endDate?: string }) =>
  !v.startDate || !v.endDate || v.endDate >= v.startDate;
const periodError = {
  message: "End date must be on or after the start date",
  path: ["endDate"],
};

/** Onboard an intern (all fields required). Dates are ISO calendar dates. */
export const internSchema = internShape.refine(periodValid, periodError);

/** Edit an intern — every field optional; period only checked when both present. */
export const internUpdateSchema = internShape
  .partial()
  .refine(periodValid, periodError);

export type InternFormValues = z.infer<typeof internSchema>;
