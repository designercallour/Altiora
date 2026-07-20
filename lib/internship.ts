/**
 * Internship lifecycle — the single source of truth for status.
 *
 * Status is NEVER stored or manually edited. It is derived purely from the
 * internship period (start/end dates) relative to "now". The product surfaces
 * only two statuses — Active / Inactive — while `phase` gives finer detail for
 * UI copy (upcoming vs. completed). See docs/adr/0002-computed-internship-status.md.
 */
import type { Internship } from "@/types/domain";

export type InternshipLifecycleStatus = "active" | "inactive";
export type InternshipPhase =
  | "upcoming" // starts in the future
  | "active" // today is within [start, end]
  | "completed" // ended in the past
  | "unscheduled"; // no start date yet

export interface InternshipLifecycle {
  /** The ONLY status the product uses for access + filtering. */
  status: InternshipLifecycleStatus;
  /** Finer-grained phase, for human-facing copy. */
  phase: InternshipPhase;
  daysUntilStart: number | null; // when upcoming
  daysRemaining: number | null; // inclusive of today, when active
  weeksRemaining: number | null;
  totalDays: number | null;
  progress: number; // 0..1 through the period
}

const MS_PER_DAY = 86_400_000;

/** Whole-day index in UTC, so comparisons ignore time-of-day + timezone. */
const dayIndex = (d: Date) =>
  Math.floor(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / MS_PER_DAY,
  );
const parseDayIndex = (iso: string) => dayIndex(new Date(iso));

/**
 * Derive the full lifecycle of an internship at a point in time.
 * Active ⇔ today ∈ [startDate, endDate] (inclusive).
 */
export function internshipLifecycle(
  internship: Pick<Internship, "startDate" | "endDate">,
  now: Date = new Date(),
): InternshipLifecycle {
  const today = dayIndex(now);
  const start = internship.startDate ? parseDayIndex(internship.startDate) : null;
  const end = internship.endDate ? parseDayIndex(internship.endDate) : null;

  const base = {
    daysUntilStart: null,
    daysRemaining: null,
    weeksRemaining: null,
    totalDays: start != null && end != null ? end - start + 1 : null,
    progress: 0,
  };

  if (start == null) {
    return { ...base, status: "inactive", phase: "unscheduled" };
  }
  if (today < start) {
    return {
      ...base,
      status: "inactive",
      phase: "upcoming",
      daysUntilStart: start - today,
    };
  }
  if (end != null && today > end) {
    return {
      ...base,
      status: "inactive",
      phase: "completed",
      daysRemaining: 0,
      weeksRemaining: 0,
      progress: 1,
    };
  }

  // Active.
  const daysRemaining = end != null ? end - today + 1 : null;
  const totalDays = end != null ? end - start + 1 : null;
  const elapsed = today - start + 1;
  const progress =
    totalDays != null && totalDays > 0
      ? Math.min(1, Math.max(0, elapsed / totalDays))
      : 0;

  return {
    status: "active",
    phase: "active",
    daysUntilStart: null,
    daysRemaining,
    weeksRemaining: daysRemaining != null ? Math.ceil(daysRemaining / 7) : null,
    totalDays,
    progress,
  };
}

/** Shorthand: just the Active/Inactive status. */
export function internshipStatus(
  internship: Pick<Internship, "startDate" | "endDate">,
  now?: Date,
): InternshipLifecycleStatus {
  return internshipLifecycle(internship, now).status;
}

export const isInternshipActive = (
  internship: Pick<Internship, "startDate" | "endDate"> | null | undefined,
  now?: Date,
): boolean => !!internship && internshipStatus(internship, now) === "active";

/** True when the period ends within `days` from now (for "ending soon"). */
export function endsWithinDays(
  internship: Pick<Internship, "startDate" | "endDate">,
  days: number,
  now: Date = new Date(),
): boolean {
  const life = internshipLifecycle(internship, now);
  return (
    life.status === "active" &&
    life.daysRemaining != null &&
    life.daysRemaining <= days
  );
}

export const LIFECYCLE_STATUS_LABELS: Record<InternshipLifecycleStatus, string> =
  {
    active: "Active",
    inactive: "Inactive",
  };

export const PHASE_LABELS: Record<InternshipPhase, string> = {
  upcoming: "Starts soon",
  active: "Active",
  completed: "Completed",
  unscheduled: "Not scheduled",
};
