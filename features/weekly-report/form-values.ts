import type { ReportFormValues } from "@/schemas/weekly-report";
import type { WeeklyReportDetail } from "@/types/domain";

/** A fresh, empty report form. */
export function defaultFormValues(): ReportFormValues {
  return {
    mood: null,
    satisfaction: null,
    achievement: "",
    challenge: "",
    solution: "",
    mentorHelp: "",
    confidence: null,
    workingHours: null,
    skillScores: [],
    learningLogs: [],
  };
}

/** Hydrate the form from an existing (draft) report. */
export function formValuesFromReport(
  report: WeeklyReportDetail,
): ReportFormValues {
  return {
    mood: report.mood,
    satisfaction: report.satisfaction,
    achievement: report.achievement ?? "",
    challenge: report.challenge ?? "",
    solution: report.solution ?? "",
    mentorHelp: report.mentorHelp ?? "",
    confidence: report.confidence,
    workingHours: report.workingHours,
    skillScores: report.skillScores.map((s) => ({
      skillId: s.skillId,
      score: s.score,
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
