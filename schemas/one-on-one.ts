import { z } from "zod";

/**
 * Monthly 1-on-1 mentor notes. All three fields are optional free-text — a
 * mentor may save a partial draft — so the schema only caps length.
 */
export const oneOnOneNotesSchema = z.object({
  strengths: z.string().max(5000),
  concerns: z.string().max(5000),
  goalsNextMonth: z.string().max(5000),
});

export type OneOnOneNotesValues = z.infer<typeof oneOnOneNotesSchema>;
