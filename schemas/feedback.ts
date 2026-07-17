import { z } from "zod";

export const feedbackSchema = z.object({
  feedback: z.string().trim().min(3, "Share a few words of feedback").max(2000),
  nextGoal: z.string().trim().max(500).optional().default(""),
  rating: z.number().int().min(1).max(5).nullable(),
});

export type FeedbackFormValues = z.infer<typeof feedbackSchema>;
