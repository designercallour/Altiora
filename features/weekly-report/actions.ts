"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDataSource } from "@/services";
import type { ReportInput, ReportUpdate } from "@/services/data-source";
import {
  reportSubmitSchema,
  type ReportFormValues,
} from "@/schemas/weekly-report";
import { ROUTES } from "@/lib/constants";

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

  const { reportId } = await saveWeeklyDraft(payload);
  await getDataSource().submitReport(reportId);

  revalidatePath(ROUTES.dashboard);
  revalidatePath(ROUTES.reports);
  redirect(`${ROUTES.report(reportId)}?celebrate=1`);
}
