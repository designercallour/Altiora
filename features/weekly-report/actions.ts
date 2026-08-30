"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDataSource } from "@/services";
import type { ReportInput, ReportUpdate } from "@/services/data-source";
import {
  reportSubmitSchema,
  type ReportFormValues,
} from "@/schemas/weekly-report";
import {
  extractLearning,
  reflectionCorpus,
} from "@/services/ai/learning-intelligence";
import { isInternshipActive } from "@/lib/internship";
import { currentReflectionWeek, isWeeklyReflectionOpen } from "@/lib/week";
import { ROUTES } from "@/lib/constants";

const REFLECTION_LOCKED_MSG =
  "This week's reflection opens Friday at 09:00 WIB.";

/**
 * The current week's reflection is only writable inside its window
 * (Fri 09:00 WIB → Sun). Past weeks are unaffected. Server-side source of truth.
 */
function reflectionLocked(year: number, week: number, now = new Date()): boolean {
  const cw = currentReflectionWeek(now);
  const isCurrentWeek = year === cw.year && week === cw.week;
  return isCurrentWeek && !isWeeklyReflectionOpen(now);
}

export interface SavePayload {
  reportId: string | null;
  internshipId: string;
  year: number;
  weekNumber: number;
  startDate: string;
  endDate: string;
  values: ReportFormValues;
}

function nullIfEmpty(s: string): string | null {
  const t = s.trim();
  return t.length ? t : null;
}

function toScalars(v: ReportFormValues) {
  return {
    mood: v.mood,
    satisfaction: v.satisfaction,
    achievement: nullIfEmpty(v.achievement),
    challenge: nullIfEmpty(v.challenge),
    solution: nullIfEmpty(v.solution),
    mentorHelp: nullIfEmpty(v.mentorHelp),
    confidence: v.confidence,
    workingHours: v.workingHours,
    playbackCompleted: v.playbackCompleted,
    instagramStoryCompleted: v.instagramStoryCompleted,
    instagramStoryUrl: v.instagramStoryUrl,
  };
}

function toUpdate(v: ReportFormValues): ReportUpdate {
  return {
    ...toScalars(v),
    learningLogs: v.learningLogs,
    skillScores: v.skillScores,
  };
}

/** Upsert the draft. Returns the (possibly newly-created) report id. */
export async function saveWeeklyDraft(
  payload: SavePayload,
): Promise<{ reportId: string }> {
  if (reflectionLocked(payload.year, payload.weekNumber)) {
    throw new Error(REFLECTION_LOCKED_MSG);
  }

  const db = getDataSource();

  if (payload.reportId) {
    const updated = await db.updateReport(
      payload.reportId,
      toUpdate(payload.values),
    );
    return { reportId: updated.id };
  }

  const input: ReportInput = {
    internshipId: payload.internshipId,
    year: payload.year,
    weekNumber: payload.weekNumber,
    startDate: payload.startDate,
    endDate: payload.endDate,
    ...toScalars(payload.values),
    learningLogs: payload.values.learningLogs,
    skillScores: payload.values.skillScores,
  };
  const created = await db.createReport(input);
  return { reportId: created.id };
}

export type SubmitResult = { ok: false; error: string };

/**
 * Validate against the stricter submit rules, persist, mark submitted, and
 * redirect to the report with a one-time celebration flag. On validation
 * failure it returns an error instead of redirecting.
 *
 * Redirecting from the action (rather than the client) is deterministic — it
 * avoids racing the automatic route refresh that server actions trigger.
 */
export async function submitWeeklyReport(
  payload: SavePayload,
): Promise<SubmitResult> {
  const parsed = reportSubmitSchema.safeParse(payload.values);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Please complete the report.",
    };
  }

  // The current week's reflection is locked until its Friday 09:00 WIB window.
  if (reflectionLocked(payload.year, payload.weekNumber)) {
    return { ok: false, error: REFLECTION_LOCKED_MSG };
  }

  // Access control (server-side, defense in depth): reflections can only be
  // submitted while the internship is active — never trust the client gate.
  const internship = await getDataSource().getInternshipById(
    payload.internshipId,
  );
  if (!isInternshipActive(internship)) {
    return {
      ok: false,
      error: "Your internship isn't active, so reflections are closed.",
    };
  }

  const { reportId } = await saveWeeklyDraft(payload);
  const db = getDataSource();
  await db.submitReport(reportId);

  // Learning Intelligence: extract skills/concepts from the reflection text.
  const intelligence = await extractLearning(
    reflectionCorpus({
      achievement: payload.values.achievement,
      challenge: payload.values.challenge,
      learnings: payload.values.learningLogs.map((l) => l.title),
    }),
  );
  await db.saveReportIntelligence(reportId, intelligence);

  revalidatePath(ROUTES.dashboard);
  revalidatePath(ROUTES.reports);
  redirect(`${ROUTES.report(reportId)}?celebrate=1`);
}
