/**
 * Derived analytics — pure functions over report data. Never stored; always
 * computed. Shared by the intern, mentor, and admin dashboards.
 */
import type { WeeklyReportDetail } from "@/types/domain";
import { internshipWeekNumber } from "@/lib/week";

export interface SeriesPoint {
  label: string;
  value: number;
}

/** Absolute, comparable week index (handles year boundaries). */
export function weekIndex(year: number, week: number): number {
  return year * 53 + week;
}

export function submittedAsc(
  details: WeeklyReportDetail[],
): WeeklyReportDetail[] {
  return details
    .filter((d) => d.status === "submitted")
    .sort(
      (a, b) =>
        weekIndex(a.year, a.weekNumber) - weekIndex(b.year, b.weekNumber),
    );
}

export function average(nums: Array<number | null | undefined>): number | null {
  const vals = nums.filter((n): n is number => typeof n === "number");
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

/** Consecutive submitted weeks ending at the most recent submission. */
export function computeStreak(details: WeeklyReportDetail[]): number {
  const submitted = submittedAsc(details);
  if (!submitted.length) return 0;
  const indices = submitted.map((d) => weekIndex(d.year, d.weekNumber));
  let streak = 1;
  for (let i = indices.length - 1; i > 0; i--) {
    if (indices[i]! - indices[i - 1]! === 1) streak++;
    else break;
  }
  return streak;
}

export function reportAverages(details: WeeklyReportDetail[]) {
  const submitted = submittedAsc(details);
  return {
    mood: average(submitted.map((d) => d.mood)),
    satisfaction: average(submitted.map((d) => d.satisfaction)),
    confidence: average(submitted.map((d) => d.confidence)),
  };
}

export function metricTrend(
  details: WeeklyReportDetail[],
  key: "mood" | "satisfaction" | "confidence",
  startDateISO?: string,
): SeriesPoint[] {
  return submittedAsc(details)
    .filter((d) => d[key] != null)
    .map((d) => ({
      label: startDateISO
        ? `W${internshipWeekNumber(startDateISO, d.year, d.weekNumber)}`
        : `W${d.weekNumber}`,
      value: d[key] as number,
    }));
}

/** Frequency of AI-extracted skills across submitted reports (most first). */
export function skillFrequency(details: WeeklyReportDetail[]): SeriesPoint[] {
  const map = new Map<string, number>();
  for (const d of submittedAsc(details))
    for (const s of d.intelligence?.skills ?? [])
      map.set(s.name, (map.get(s.name) ?? 0) + 1);
  return [...map]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

/** Frequency of AI-extracted concepts across submitted reports (most first). */
export function conceptFrequency(details: WeeklyReportDetail[]): SeriesPoint[] {
  const map = new Map<string, number>();
  for (const d of submittedAsc(details))
    for (const c of d.intelligence?.concepts ?? [])
      map.set(c.name, (map.get(c.name) ?? 0) + 1);
  return [...map]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

export function totalLearnings(details: WeeklyReportDetail[]): number {
  return submittedAsc(details).reduce(
    (sum, d) => sum + d.learningLogs.length,
    0,
  );
}

export function appliedRate(details: WeeklyReportDetail[]): number | null {
  const logs = submittedAsc(details).flatMap((d) => d.learningLogs);
  if (!logs.length) return null;
  return logs.filter((l) => l.applied).length / logs.length;
}

export function avgImpact(details: WeeklyReportDetail[]): number | null {
  return average(
    submittedAsc(details).flatMap((d) => d.learningLogs.map((l) => l.impact)),
  );
}

/** Latest recorded score per skill (from the most recent report that rated it). */
export function latestSkillScores(
  details: WeeklyReportDetail[],
): Map<string, number> {
  const map = new Map<string, number>();
  for (const d of submittedAsc(details)) {
    for (const s of d.skillScores) map.set(s.skillId, s.score);
  }
  return map;
}

/** First vs latest score per skill → growth delta. */
export function skillDeltas(
  details: WeeklyReportDetail[],
): Map<string, { latest: number; delta: number }> {
  const first = new Map<string, number>();
  const latest = new Map<string, number>();
  for (const d of submittedAsc(details)) {
    for (const s of d.skillScores) {
      if (!first.has(s.skillId)) first.set(s.skillId, s.score);
      latest.set(s.skillId, s.score);
    }
  }
  const out = new Map<string, { latest: number; delta: number }>();
  for (const [id, last] of latest) {
    out.set(id, { latest: last, delta: last - (first.get(id) ?? last) });
  }
  return out;
}

export function countBy<T>(
  items: T[],
  keyFn: (item: T) => string | null | undefined,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const item of items) {
    const k = keyFn(item);
    if (k == null) continue;
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return map;
}

/** Per learning-source: how many learnings and their average impact. */
export function sourceEffectiveness(
  details: WeeklyReportDetail[],
): Map<string, { count: number; avgImpact: number }> {
  const bySource = new Map<string, number[]>();
  for (const d of submittedAsc(details)) {
    for (const l of d.learningLogs) {
      if (!l.learningSourceId) continue;
      const arr = bySource.get(l.learningSourceId) ?? [];
      if (l.impact != null) arr.push(l.impact);
      bySource.set(l.learningSourceId, arr);
    }
  }
  const out = new Map<string, { count: number; avgImpact: number }>();
  for (const [id, impacts] of bySource) {
    out.set(id, {
      count: impacts.length,
      avgImpact: impacts.length ? average(impacts)! : 0,
    });
  }
  return out;
}

export function completionRate(submitted: number, expected: number): number {
  if (expected <= 0) return 0;
  return Math.min(1, submitted / expected);
}
