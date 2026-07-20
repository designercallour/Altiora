"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { getDataSource } from "@/services";
import { internSchema, internUpdateSchema } from "@/schemas/intern";
import { mentorSchema, assignMentorSchema } from "@/schemas/mentor";
import { cohortSchema, cohortUpdateSchema } from "@/schemas/cohort";
import { notifications, buildNotification } from "@/lib/notifications";
import { ROUTES } from "@/lib/constants";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/** All admin management is admin-only. Returns the acting admin, or null. */
async function requireAdmin() {
  const user = await getCurrentUser();
  return user && user.role === "admin" ? user : null;
}

const firstError = (issues: { message: string }[], fallback: string) =>
  issues[0]?.message ?? fallback;

function revalidateManagement() {
  revalidatePath(ROUTES.adminInterns);
  revalidatePath(ROUTES.adminMentors);
  revalidatePath(ROUTES.adminCohorts);
  revalidatePath(ROUTES.dashboard);
}

// ── Interns ──────────────────────────────────────────────────────────────────
export async function createInternAction(
  input: unknown,
): Promise<ActionResult<{ internshipId: string }>> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Admins only." };

  const parsed = internSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: firstError(parsed.error.issues, "Check the form.") };

  const v = parsed.data;
  try {
    const summary = await getDataSource().createIntern({
      fullName: v.fullName,
      email: v.email,
      cohortId: v.cohortId,
      mentorId: v.mentorId,
      position: v.position,
      startDate: v.startDate,
      endDate: v.endDate,
      notes: v.notes,
    });
    if (v.mentorId && summary.internship) {
      await notifications.dispatch(
        buildNotification("intern_assigned", v.mentorId, {
          internshipId: summary.internship.id,
          internId: summary.user.id,
          mentorId: v.mentorId,
        }),
      );
    }
    revalidateManagement();
    return {
      ok: true,
      data: { internshipId: summary.internship?.id ?? "" },
    };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function updateInternAction(
  internshipId: string,
  input: unknown,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Admins only." };

  const parsed = internUpdateSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: firstError(parsed.error.issues, "Check the form.") };

  try {
    await getDataSource().updateIntern(internshipId, parsed.data);
    revalidateManagement();
    revalidatePath(ROUTES.intern(internshipId));
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function archiveInternAction(
  internshipId: string,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Admins only." };
  try {
    await getDataSource().archiveIntern(internshipId);
    revalidateManagement();
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ── Mentors ──────────────────────────────────────────────────────────────────
export async function createMentorAction(input: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Admins only." };

  const parsed = mentorSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: firstError(parsed.error.issues, "Check the form.") };

  try {
    await getDataSource().createMentor(parsed.data);
    revalidateManagement();
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function updateMentorAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Admins only." };

  const parsed = mentorSchema.partial().safeParse(input);
  if (!parsed.success)
    return { ok: false, error: firstError(parsed.error.issues, "Check the form.") };

  try {
    await getDataSource().updateMentor(id, parsed.data);
    revalidateManagement();
    revalidatePath(ROUTES.adminMentor(id));
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function archiveMentorAction(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Admins only." };
  // Guard: don't orphan interns — a mentor with active interns can't be removed.
  const mentors = await getDataSource().listMentors();
  const target = mentors.find((m) => m.user.id === id);
  if (target && target.activeInternCount > 0) {
    return {
      ok: false,
      error: `Reassign ${target.activeInternCount} active intern${
        target.activeInternCount === 1 ? "" : "s"
      } before removing this mentor.`,
    };
  }
  try {
    await getDataSource().archiveMentor(id);
    revalidateManagement();
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ── Cohorts ──────────────────────────────────────────────────────────────────
export async function createCohortAction(input: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Admins only." };

  const parsed = cohortSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: firstError(parsed.error.issues, "Check the form.") };

  try {
    await getDataSource().createCohort(parsed.data);
    revalidateManagement();
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function updateCohortAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Admins only." };

  const parsed = cohortUpdateSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: firstError(parsed.error.issues, "Check the form.") };

  try {
    await getDataSource().updateCohort(id, parsed.data);
    revalidateManagement();
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function archiveCohortAction(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Admins only." };
  try {
    await getDataSource().archiveCohort(id);
    revalidateManagement();
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ── Mentor assignment ──────────────────────────────────────────────────────
export async function assignMentorAction(
  internshipId: string,
  input: unknown,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Admins only." };

  const parsed = assignMentorSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: firstError(parsed.error.issues, "Choose a mentor.") };

  const db = getDataSource();
  const internship = await db.getInternshipById(internshipId);
  if (!internship) return { ok: false, error: "Internship not found." };

  try {
    await db.assignMentor(internshipId, parsed.data.mentorId, {
      assignedById: admin.id,
      note: parsed.data.note,
    });
    await notifications.dispatch(
      buildNotification("mentor_reassigned", parsed.data.mentorId, {
        internshipId,
        internId: internship.userId,
        fromMentorId: internship.mentorId,
        toMentorId: parsed.data.mentorId,
      }),
    );
    revalidateManagement();
    revalidatePath(ROUTES.intern(internshipId));
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
