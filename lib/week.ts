import {
  addWeeks,
  endOfISOWeek,
  format,
  getISOWeek,
  getISOWeekYear,
  setISOWeek,
  startOfISOWeek,
} from "date-fns";

export interface IsoWeek {
  year: number;
  week: number;
}

export interface WeekRange {
  year: number;
  week: number;
  /** ISO date (yyyy-MM-dd), Monday. */
  startDate: string;
  /** ISO date (yyyy-MM-dd), Sunday. */
  endDate: string;
}

const ISO_DATE = "yyyy-MM-dd";

export function isoWeek(date: Date = new Date()): IsoWeek {
  return { year: getISOWeekYear(date), week: getISOWeek(date) };
}

export function weekRange(date: Date = new Date()): WeekRange {
  const start = startOfISOWeek(date);
  const end = endOfISOWeek(date);
  return {
    year: getISOWeekYear(date),
    week: getISOWeek(date),
    startDate: format(start, ISO_DATE),
    endDate: format(end, ISO_DATE),
  };
}

/** Range for the ISO week `offset` weeks from `date` (negative = past). */
export function weekRangeFrom(date: Date, offset: number): WeekRange {
  return weekRange(addWeeks(date, offset));
}

/** Range for a specific ISO week (e.g. year 2026, week 29). */
export function weekRangeOf(year: number, week: number): WeekRange {
  // Jan 4 is always in ISO week 1 of its ISO year — a safe anchor.
  const anchor = new Date(Date.UTC(year, 0, 4));
  return weekRange(setISOWeek(anchor, week));
}

/** Stable sortable key, e.g. "2026-W03". */
export function weekKey(year: number, week: number): string {
  return `${year}-W${String(week).padStart(2, "0")}`;
}

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000; // WIB = UTC+7

/**
 * Is the weekly-reflection window open for the current ISO week?
 *
 * The reflection is an end-of-week ritual: interns are prompted only from
 * **Friday 09:00 WIB** through the end of that ISO week (Sunday). Monday–Thursday
 * (and Friday before 09:00 WIB) it stays closed. Mirrors the Friday reminder cron.
 */
export function isWeeklyReflectionOpen(now: Date = new Date()): boolean {
  const wib = new Date(now.getTime() + WIB_OFFSET_MS);
  const day = wib.getUTCDay(); // 0 Sun … 5 Fri, 6 Sat
  const hour = wib.getUTCHours();
  if (day === 6 || day === 0) return true; // Sat, Sun (still this ISO week)
  if (day === 5 && hour >= 9) return true; // Fri from 09:00 WIB
  return false;
}

/** e.g. "Week 3 · Jan 12 – Jan 18". */
export function formatWeekLabel(range: WeekRange): string {
  const start = new Date(`${range.startDate}T00:00:00Z`);
  const end = new Date(`${range.endDate}T00:00:00Z`);
  return `Week ${range.week} · ${format(start, "MMM d")} – ${format(end, "MMM d")}`;
}
