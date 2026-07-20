import "server-only";
import type { DataSource } from "@/services/data-source";
import { internshipStatus } from "@/lib/internship";

export interface ReminderResult {
  /** Active interns considered for the given week. */
  targeted: number;
  /** New reminders actually created (deduped ones are not counted). */
  created: number;
}

/**
 * Create a weekly-report reminder for every ACTIVE intern who has not submitted
 * a report for (year, week). Idempotent per intern per week via a dedupe key, so
 * running it repeatedly (or a retry) never double-notifies.
 *
 * `db` is passed in so the caller controls the client — the cron uses a
 * service-role DataSource so it can write for all interns without a session.
 */
export async function remindInternsForWeek(
  db: DataSource,
  year: number,
  week: number,
  now: Date = new Date(),
): Promise<ReminderResult> {
  const interns = await db.listInterns();
  const active = interns.filter(
    (s) => s.internship && internshipStatus(s.internship, now) === "active",
  );

  let created = 0;
  for (const s of active) {
    const internship = s.internship!;
    const reports = await db.listReports({ internshipId: internship.id, year });
    const submitted = reports.some(
      (r) => r.weekNumber === week && r.status === "submitted",
    );
    if (submitted) continue;

    const rec = await db.createNotification({
      recipientId: s.user.id,
      type: "reflection_overdue",
      title: "Weekly reflection reminder",
      body: `Your Week ${week} reflection hasn't been submitted yet. Take a few quiet minutes to complete it.`,
      payload: { internshipId: internship.id, year, weekNumber: week },
      dedupeKey: `reflection_overdue:${year}:${week}`,
    });
    if (rec) created++;
  }

  return { targeted: active.length, created };
}
