import {
  addWeeks,
  endOfISOWeek,
  format,
  getISOWeek,
  getISOWeekYear,
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

/** Stable sortable key, e.g. "2026-W03". */
export function weekKey(year: number, week: number): string {
  return `${year}-W${String(week).padStart(2, "0")}`;
}

/** e.g. "Week 3 · Jan 12 – Jan 18". */
export function formatWeekLabel(range: WeekRange): string {
  const start = new Date(`${range.startDate}T00:00:00Z`);
  const end = new Date(`${range.endDate}T00:00:00Z`);
  return `Week ${range.week} · ${format(start, "MMM d")} – ${format(end, "MMM d")}`;
}
