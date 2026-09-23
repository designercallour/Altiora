import type { OffboardingContext } from "@/types/domain";
import type { OffboardingFormValues } from "@/schemas/offboarding";
import {
  defaultChecklist,
  normalizeChecklist,
  normalizeFounderFeedback,
} from "@/lib/offboarding";

/** Build editor form values from an offboarding context (record may be null). */
export function offboardingFormValues(
  ctx: OffboardingContext,
): OffboardingFormValues {
  const r = ctx.record;
  return {
    sessionDate: r?.sessionDate ?? "",
    lastDay: r?.lastDay ?? ctx.internshipEndDate ?? "",
    reflectionAchievement: r?.reflectionAchievement ?? "",
    reflectionChallenge: r?.reflectionChallenge ?? "",
    reflectionSkill: r?.reflectionSkill ?? "",
    supervisorFeedback: r?.supervisorFeedback ?? "",
    feedbackForSupervisor: r?.feedbackForSupervisor ?? "",
    founderFeedback: normalizeFounderFeedback(r?.founderFeedback).map((f) => ({
      founder: f.founder,
      good: f.good ?? "",
      improve: f.improve ?? "",
    })),
    feedbackForTeam: r?.feedbackForTeam ?? "",
    feedbackForStudio: r?.feedbackForStudio ?? "",
    wouldRecommend:
      r?.wouldRecommend === true
        ? "yes"
        : r?.wouldRecommend === false
          ? "no"
          : "unsure",
    careerPlan: r?.careerPlan ?? "",
    checklist: r ? normalizeChecklist(r.checklist) : defaultChecklist(),
    notesKeyPoints: r?.notesKeyPoints ?? "",
    notesFollowUp: r?.notesFollowUp ?? "",
  };
}
