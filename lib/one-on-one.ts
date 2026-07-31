/**
 * Monthly 1-on-1 helpers — status labels, month math, and the Weekly
 * Reflection rollup shared by both DataSource implementations and the UI.
 */
import type {
  OneOnOneReflectionSummary,
  OneOnOneStatus,
  WeeklyReport,
} from "@/types/domain";

export const ONE_ON_ONE_STATUS_LABELS: Record<OneOnOneStatus, string> = {
  not_started: "Not started",
  completed: "Completed",
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const pad2 = (n: number) => String(n).padStart(2, "0");

/** "July 2026" for month=7, year=2026. */
export function monthLabel(year: number, month: number): string {
  const name = MONTH_NAMES[month - 1] ?? "—";
  return `${name} ${year}`;
}

/** "2026-07" — the URL/period token for a year+month. */
export function periodParam(year: number, month: number): string {
  return `${year}-${pad2(month)}`;
}

/** Parse a "2026-07" period token; null if malformed or out of range. */
export function parsePeriod(
  token: string,
): { year: number; month: number } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(token);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (!Number.isInteger(year) || month < 1 || month > 12) return null;
  return { year, month };
}

/** Inclusive [start, end] ISO dates (YYYY-MM-DD) covering a calendar month. */
export function monthDateRange(
  year: number,
  month: number,
): { start: string; end: string } {
  const start = `${year}-${pad2(month)}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const end = `${year}-${pad2(month)}-${pad2(lastDay)}`;
  return { start, end };
}

/** The current {year, month} (1-based month) in UTC. */
export function currentPeriod(now: Date = new Date()): {
  year: number;
  month: number;
} {
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
}

/**
 * A report belongs to a month if its week [startDate, endDate] overlaps the
 * calendar month — weeks straddling a boundary are counted in both months.
 */
export function reflectionsInMonth(
  reports: WeeklyReport[],
  year: number,
  month: number,
): WeeklyReport[] {
  const { start, end } = monthDateRange(year, month);
  return reports.filter((r) => r.startDate <= end && r.endDate >= start);
}

/** Roll a set of month reflections up into the 1-on-1 summary counts. */
export function summarizeReflections(
  reports: WeeklyReport[],
): OneOnOneReflectionSummary {
  const submitted = reports
    .filter((r) => r.status === "submitted")
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
  return {
    totalSubmitted: submitted.length,
    playbackCount: submitted.filter((r) => r.playbackCompleted).length,
    instagramCount: submitted.filter((r) => r.instagramStoryCompleted).length,
    reports: submitted,
  };
}
