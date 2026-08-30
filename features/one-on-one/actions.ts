"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { getDataSource } from "@/services";
import {
  oneOnOneNotesSchema,
  type OneOnOneNotesValues,
} from "@/schemas/one-on-one";
import { isOneOnOneOpen, monthLabel } from "@/lib/one-on-one";
import { ROUTES } from "@/lib/constants";

/**
 * A month's 1-on-1 is only writable from its final week onward (past months
 * stay open for catch-up; future months are locked). Server-side source of
 * truth — never trust the client gate.
 */
function windowClosed(year: number, month: number): boolean {
  return !isOneOnOneOpen(year, month);
}

const windowClosedMsg = (year: number, month: number) =>
  `The ${monthLabel(year, month)} 1-on-1 opens in the final week of the month.`;

export interface OneOnOnePayload {
  internshipId: string;
  year: number;
  month: number;
  values: OneOnOneNotesValues;
}

export type OneOnOneResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

type Guard = { ok: true; userId: string } | { ok: false; error: string };

/**
 * Only an admin or the internship's currently-assigned mentor may write a
 * 1-on-1. Server-side source of truth — never trust the client. (RLS enforces
 * the same in supabase mode.)
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
      error: "You don't have permission to edit this 1-on-1.",
    };
  }
  return { ok: true, userId: user.id };
}

function nullIfEmpty(s: string): string | null {
  const t = s.trim();
  return t.length ? t : null;
}

function toNotes(values: OneOnOneNotesValues) {
  return {
    strengths: nullIfEmpty(values.strengths),
    concerns: nullIfEmpty(values.concerns),
    goalsNextMonth: nullIfEmpty(values.goalsNextMonth),
  };
}

function revalidate(payload: OneOnOnePayload, recordId?: string) {
  revalidatePath(ROUTES.oneOnOnes);
  revalidatePath(
    ROUTES.oneOnOne(payload.internshipId, payload.year, payload.month),
  );
  if (recordId) revalidatePath(ROUTES.oneOnOneRecord(recordId));
}

/** Create/update the mentor notes without changing status. */
export async function saveOneOnOneDraft(
  payload: OneOnOnePayload,
): Promise<OneOnOneResult> {
  const g = await guard(payload.internshipId);
  if (!g.ok) return g;
  if (windowClosed(payload.year, payload.month)) {
    return { ok: false, error: windowClosedMsg(payload.year, payload.month) };
  }
  const parsed = oneOnOneNotesSchema.safeParse(payload.values);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid notes.",
    };
  }
  const db = getDataSource();
  const record = await db.upsertOneOnOne(
    payload.internshipId,
    payload.year,
    payload.month,
    toNotes(parsed.data),
    g.userId,
  );
  revalidate(payload, record.id);
  return { ok: true, id: record.id };
}

/** Save the notes and mark the record Completed (visible to the intern). */
export async function completeOneOnOne(
  payload: OneOnOnePayload,
): Promise<OneOnOneResult> {
  const g = await guard(payload.internshipId);
  if (!g.ok) return g;
  if (windowClosed(payload.year, payload.month)) {
    return { ok: false, error: windowClosedMsg(payload.year, payload.month) };
  }
  const parsed = oneOnOneNotesSchema.safeParse(payload.values);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid notes.",
    };
  }
  const db = getDataSource();
  const record = await db.upsertOneOnOne(
    payload.internshipId,
    payload.year,
    payload.month,
    toNotes(parsed.data),
    g.userId,
  );
  const completed = await db.setOneOnOneStatus(record.id, "completed");
  revalidate(payload, completed.id);
  return { ok: true, id: completed.id };
}
