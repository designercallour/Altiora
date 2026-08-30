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

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000; // WIB = UTC+7

/** How many days before month-end the 1-on-1 window opens (inclusive). */
export const ONE_ON_ONE_WINDOW_DAYS = 7;

/** Last calendar day (1-based) of the given month. */
function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * First day (1-based) of a month's 1-on-1 fill window — the last
 * `ONE_ON_ONE_WINDOW_DAYS` days of the month. e.g. a 31-day month opens on the
 * 25th (25–31 inclusive).
 */
export function oneOnOneWindowStartDay(year: number, month: number): number {
  return lastDayOfMonth(year, month) - ONE_ON_ONE_WINDOW_DAYS + 1;
}

/**
 * Is a month's 1-on-1 writable right now? The check-in is an end-of-month
 * ritual: a month only opens during its final week. Because any *past* month's
 * window start is already behind us, the same rule keeps past months open for
 * catch-up while the current month stays locked until its final week and future
 * months stay closed. Evaluated in WIB, mirroring the weekly reflection ritual.
 */
export function isOneOnOneOpen(
  year: number,
  month: number,
  now: Date = new Date(),
): boolean {
  const wib = new Date(now.getTime() + WIB_OFFSET_MS);
  const ty = wib.getUTCFullYear();
  const tm = wib.getUTCMonth() + 1;
  const td = wib.getUTCDate();
  if (ty !== year) return ty > year; // later year → past month → open
  if (tm !== month) return tm > month; // later month → past month → open
  return td >= oneOnOneWindowStartDay(year, month); // this month → only final week
}

/**
 * The latest month whose 1-on-1 is currently "due" — the check-in a mentor is
 * expected to act on now. Inside the current month's window it's this month;
 * before the window it's the previous month (last month's check-in stays the
 * actionable one until this month's final week arrives). WIB-based.
 */
export function dueOneOnOnePeriod(now: Date = new Date()): {
  year: number;
  month: number;
} {
  const wib = new Date(now.getTime() + WIB_OFFSET_MS);
  const year = wib.getUTCFullYear();
  const month = wib.getUTCMonth() + 1;
  if (isOneOnOneOpen(year, month, now)) return { year, month };
  return month === 1
    ? { year: year - 1, month: 12 }
    : { year, month: month - 1 };
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
