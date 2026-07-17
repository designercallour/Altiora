"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { getDataSource } from "@/services";
import { feedbackSchema } from "@/schemas/feedback";
import { ROUTES } from "@/lib/constants";

export type FeedbackResult = { ok: true } | { ok: false; error: string };

export async function submitFeedback(
  reportId: string,
  input: unknown,
): Promise<FeedbackResult> {
  const user = await getCurrentUser();
  if (!user || user.role === "intern") {
    return { ok: false, error: "You don't have permission to give feedback." };
  }

  const parsed = feedbackSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Please check your feedback.",
    };
  }

  const { feedback, nextGoal, rating } = parsed.data;
  await getDataSource().upsertFeedback(
    reportId,
    {
      feedback,
      nextGoal: nextGoal.trim() ? nextGoal.trim() : null,
      rating,
    },
    user.id,
  );

  revalidatePath(ROUTES.report(reportId));
  revalidatePath(ROUTES.dashboard);
  return { ok: true };
}
