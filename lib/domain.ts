/**
 * Fixed ordinal scales used by the Weekly Report UI and analytics.
 *
 * These are measures, not lookup dimensions — they live in code, not the DB.
 * (Categorical dimensions like learning categories/sources come from the
 * DataSource lookups.)
 */

export interface MoodLevel {
  value: number; // 1 (lowest) .. 6 (highest) — higher is better for averaging
  emoji: string;
  label: string;
}

/** Ascending by wellbeing. The emoji picker renders these best→worst. */
export const MOOD_SCALE: readonly MoodLevel[] = [
  { value: 1, emoji: "😭", label: "Overwhelmed" },
  { value: 2, emoji: "😔", label: "Low" },
  { value: 3, emoji: "😐", label: "Neutral" },
  { value: 4, emoji: "🙂", label: "Okay" },
  { value: 5, emoji: "😄", label: "Good" },
  { value: 6, emoji: "😀", label: "Great" },
];

export function moodLevel(value: number | null | undefined): MoodLevel | null {
  if (value == null) return null;
  return MOOD_SCALE.find((m) => m.value === value) ?? null;
}

// Slider ranges -----------------------------------------------------------------
export const SATISFACTION_MIN = 1;
export const SATISFACTION_MAX = 10;
export const CONFIDENCE_MIN = 1;
export const CONFIDENCE_MAX = 10;

// 1..5 scale used by difficulty, confidence, impact (learning logs), skill scores,
// and mentor rating.
export interface ScalePoint {
  value: number;
  label: string;
}

export const SCALE_1_5: readonly ScalePoint[] = [
  { value: 1, label: "Very low" },
  { value: 2, label: "Low" },
  { value: 3, label: "Moderate" },
  { value: 4, label: "High" },
  { value: 5, label: "Very high" },
];

export const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Trivial",
  2: "Easy",
  3: "Moderate",
  4: "Hard",
  5: "Very hard",
};

export const APPLIED_OPTIONS = [
  { value: true, label: "Applied" },
  { value: false, label: "Not yet" },
] as const;

// Human labels for enums --------------------------------------------------------
export const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  mentor: "Mentor",
  intern: "Intern",
};

export const INTERNSHIP_STATUS_LABELS: Record<string, string> = {
  upcoming: "Upcoming",
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  terminated: "Terminated",
};

export const REPORT_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
};

/** The 8 skills the Weekly Report rates, by slug (canonical order). */
export const RATED_SKILL_SLUGS: readonly string[] = [
  "ui-design",
  "ux-thinking",
  "communication",
  "problem-solving",
  "critical-thinking",
  "presentation",
  "time-management",
  "research",
];
