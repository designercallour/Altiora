"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { getDataSource } from "@/services";
import {
  offboardingValuesSchema,
  type OffboardingFormValues,
} from "@/schemas/offboarding";
import { isOffboardingAvailable } from "@/lib/offboarding";
import type { OffboardingInput } from "@/services/data-source";
import { ROUTES } from "@/lib/constants";

export interface OffboardingPayload {
  internshipId: string;
  values: OffboardingFormValues;
}

export type OffboardingResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

type Guard = { ok: true; userId: string } | { ok: false; error: string };

/**
 * Only an admin or the internship's currently-assigned mentor may write an
 * offboarding, and only while it's available (near the end / after completion).
 * Server-side source of truth — never trust the client. (RLS enforces the
 * permission half in supabase mode.)
 */
async function guard(internshipId: string): Promise<Guard> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "You need to sign in." };
  const internship = await getDataSource().getInternshipById(internshipId);
  if (!internship) return { ok: false, error: "Internship not found." };
  const allowed =
    user.role === "admin" ||
    (user.role === "mentor" && internship.mentorId === user.id);
  if (!allowed) {
    return {
      ok: false,
      error: "You don't have permission to edit this offboarding.",
    };
  }
  if (!isOffboardingAvailable(internship)) {
    return {
      ok: false,
      error: "Offboarding opens near the end of the internship.",
    };
  }
  return { ok: true, userId: user.id };
}

function nullIfEmpty(s: string): string | null {
  const t = s.trim();
  return t.length ? t : null;
}

function toInput(values: OffboardingFormValues): OffboardingInput {
  return {
    sessionDate: nullIfEmpty(values.sessionDate),
    lastDay: nullIfEmpty(values.lastDay),
    reflectionAchievement: nullIfEmpty(values.reflectionAchievement),
    reflectionChallenge: nullIfEmpty(values.reflectionChallenge),
    reflectionSkill: nullIfEmpty(values.reflectionSkill),
    supervisorFeedback: nullIfEmpty(values.supervisorFeedback),
    feedbackForSupervisor: nullIfEmpty(values.feedbackForSupervisor),
    founderFeedback: values.founderFeedback.map((f) => ({
      founder: f.founder,
      good: nullIfEmpty(f.good),
      improve: nullIfEmpty(f.improve),
    })),
    feedbackForTeam: nullIfEmpty(values.feedbackForTeam),
    feedbackForStudio: nullIfEmpty(values.feedbackForStudio),
    wouldRecommend:
      values.wouldRecommend === "yes"
        ? true
        : values.wouldRecommend === "no"
          ? false
          : null,
    careerPlan: nullIfEmpty(values.careerPlan),
    checklist: values.checklist,
    notesKeyPoints: nullIfEmpty(values.notesKeyPoints),
    notesFollowUp: nullIfEmpty(values.notesFollowUp),
  };
}

function revalidate(internshipId: string, recordId?: string) {
  revalidatePath(ROUTES.offboarding);
  revalidatePath(ROUTES.offboardingEditor(internshipId));
  if (recordId) revalidatePath(ROUTES.offboardingRecord(recordId));
}

/** Create/update the offboarding record without changing status. */
export async function saveOffboardingDraft(
  payload: OffboardingPayload,
): Promise<OffboardingResult> {
  const g = await guard(payload.internshipId);
  if (!g.ok) return g;
  const parsed = offboardingValuesSchema.safeParse(payload.values);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }
  const db = getDataSource();
  const record = await db.upsertOffboarding(
    payload.internshipId,
    toInput(parsed.data),
    g.userId,
  );
  revalidate(payload.internshipId, record.id);
  return { ok: true, id: record.id };
}

/** Save the record and mark it Completed (visible to the intern). */
export async function completeOffboarding(
  payload: OffboardingPayload,
): Promise<OffboardingResult> {
  const g = await guard(payload.internshipId);
  if (!g.ok) return g;
  const parsed = offboardingValuesSchema.safeParse(payload.values);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }
  const db = getDataSource();
  const record = await db.upsertOffboarding(
    payload.internshipId,
    toInput(parsed.data),
    g.userId,
  );
  const completed = await db.setOffboardingStatus(record.id, "completed");
  revalidate(payload.internshipId, completed.id);
  return { ok: true, id: completed.id };
}
