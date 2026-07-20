import { z } from "zod";

/** Add / edit a mentor. */
export const mentorSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the mentor's full name").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
});

export type MentorFormValues = z.infer<typeof mentorSchema>;

/** Assign (or reassign) a mentor to an internship. */
export const assignMentorSchema = z.object({
  mentorId: z.string().uuid("Choose a mentor"),
  note: z.string().trim().max(500).nullable().default(null),
});

export type AssignMentorFormValues = z.infer<typeof assignMentorSchema>;
