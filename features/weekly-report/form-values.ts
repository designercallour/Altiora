import type { ReportFormValues } from "@/schemas/weekly-report";
import type { WeeklyReportDetail } from "@/types/domain";

const DEFAULT_SCALE = 3;
const DEFAULT_SLIDER = 7;

/**
 * A fresh report form. Skill ratings are pre-seeded from the intern's previous
 * week when available (continuity + less effort + meaningful week-over-week
 * deltas), falling back to a neutral 3.
 */
export function defaultFormValues(
  skillIds: string[],
  priorScores?: Map<string, number>,
): ReportFormValues {
  return {
    mood: null,
    satisfaction: DEFAULT_SLIDER,
    achievement: "",
    challenge: "",
    solution: "",
    mentorHelp: "",
    confidence: DEFAULT_SLIDER,
    workingHours: null,
    skillScores: skillIds.map((skillId) => ({
      skillId,
      score: priorScores?.get(skillId) ?? DEFAULT_SCALE,
    })),
    learningLogs: [],
  };
}

/** Hydrate the form from an existing (draft) report. */
export function formValuesFromReport(
  report: WeeklyReportDetail,
  skillIds: string[],
): ReportFormValues {
  const scoreBySkill = new Map(
    report.skillScores.map((s) => [s.skillId, s.score]),
  );
  return {
    mood: report.mood,
    satisfaction: report.satisfaction ?? DEFAULT_SLIDER,
    achievement: report.achievement ?? "",
    challenge: report.challenge ?? "",
    solution: report.solution ?? "",
    mentorHelp: report.mentorHelp ?? "",
    confidence: report.confidence ?? DEFAULT_SLIDER,
    workingHours: report.workingHours,
    skillScores: skillIds.map((skillId) => ({
      skillId,
      score: scoreBySkill.get(skillId) ?? DEFAULT_SCALE,
    })),
    learningLogs: report.learningLogs.map((l) => ({
      id: l.id,
      title: l.title,
      learningCategoryId: l.learningCategoryId,
      learningSourceId: l.learningSourceId,
      projectId: l.projectId,
      difficulty: l.difficulty,
      confidence: l.confidence,
      impact: l.impact,
      applied: l.applied,
    })),
  };
}
