/**
 * Altiora domain model (application-facing).
 *
 * These are the camelCase types every feature and the DataSource speak in.
 * The snake_case database row shapes live in `types/database.ts`; the
 * SupabaseDataSource maps between the two so the rest of the app never sees
 * database naming.
 */

// ── Enums (mirror the Postgres enums) ───────────────────────────────────────
export type UserRole = "admin" | "mentor" | "intern";

export type InternshipStatus =
  "upcoming" | "active" | "paused" | "completed" | "terminated";

export type ReportStatus = "draft" | "submitted";

export const USER_ROLES: readonly UserRole[] = ["admin", "mentor", "intern"];
export const INTERNSHIP_STATUSES: readonly InternshipStatus[] = [
  "upcoming",
  "active",
  "paused",
  "completed",
  "terminated",
];
export const REPORT_STATUSES: readonly ReportStatus[] = ["draft", "submitted"];

// ── Shared field mixins ──────────────────────────────────────────────────────
export interface Timestamps {
  createdAt: string; // ISO-8601 UTC
  updatedAt: string;
}

export interface SoftDelete {
  deletedAt: string | null;
}

// ── Lookup / master entities ─────────────────────────────────────────────────
export interface Department extends Timestamps, SoftDelete {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface Team extends Timestamps, SoftDelete {
  id: string;
  departmentId: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface Cohort extends Timestamps, SoftDelete {
  id: string;
  name: string;
  slug: string;
  startDate: string; // ISO date
  endDate: string;
  description: string | null;
}

export interface Project extends Timestamps, SoftDelete {
  id: string;
  name: string;
  slug: string;
  departmentId: string | null;
  description: string | null;
}

export interface SkillCategory extends Timestamps, SoftDelete {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
}

export interface Skill extends Timestamps, SoftDelete {
  id: string;
  skillCategoryId: string | null;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
}

export interface LearningCategory extends Timestamps, SoftDelete {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
}

export interface LearningSource extends Timestamps, SoftDelete {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
}

// ── Identity ──────────────────────────────────────────────────────────────────
export interface AppUser extends Timestamps, SoftDelete {
  id: string;
  authId: string | null;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: UserRole;
}

// ── Internship lifecycle ──────────────────────────────────────────────────────
export interface Internship extends Timestamps, SoftDelete {
  id: string;
  userId: string;
  mentorId: string | null;
  cohortId: string | null;
  departmentId: string | null;
  teamId: string | null;
  projectId: string | null;
  position: string | null;
  startDate: string;
  endDate: string | null;
  status: InternshipStatus;
}

// ── Weekly report + children ──────────────────────────────────────────────────
export interface WeeklyReport extends Timestamps, SoftDelete {
  id: string;
  internshipId: string;
  year: number;
  weekNumber: number;
  startDate: string;
  endDate: string;
  mood: number | null; // 1..6
  satisfaction: number | null; // 1..10
  achievement: string | null;
  challenge: string | null;
  solution: string | null;
  mentorHelp: string | null;
  confidence: number | null; // 1..10
  workingHours: number | null;
  status: ReportStatus;
  submittedAt: string | null;
}

export interface WeeklySkillScore {
  id: string;
  reportId: string;
  skillId: string;
  score: number; // 1..5
}

export interface LearningLog extends Timestamps, SoftDelete {
  id: string;
  reportId: string;
  learningCategoryId: string | null;
  learningSourceId: string | null;
  projectId: string | null;
  title: string;
  difficulty: number | null; // 1..5
  confidence: number | null; // 1..5
  impact: number | null; // 1..5
  applied: boolean;
}

export interface MentorFeedback extends Timestamps, SoftDelete {
  id: string;
  reportId: string;
  mentorId: string | null;
  feedback: string | null;
  nextGoal: string | null;
  rating: number | null; // 1..5
}

// ── Composite / read-model types ──────────────────────────────────────────────

/** A fully-hydrated report, as the Weekly Report screen and detail views need it. */
export interface WeeklyReportDetail extends WeeklyReport {
  learningLogs: LearningLog[];
  skillScores: WeeklySkillScore[];
  feedback: MentorFeedback | null;
}

/** An intern with just enough context for mentor/admin lists. */
export interface InternSummary {
  user: AppUser;
  internship: Internship | null;
  cohort: Cohort | null;
  department: Department | null;
  mentor: Pick<AppUser, "id" | "fullName" | "avatarUrl"> | null;
  latestReport: WeeklyReport | null;
  submittedCount: number;
  needsReview: boolean; // has a submitted report without feedback
}

/** All lookup data, loaded once and passed to forms/filters. */
export interface Lookups {
  departments: Department[];
  teams: Team[];
  cohorts: Cohort[];
  projects: Project[];
  skillCategories: SkillCategory[];
  skills: Skill[];
  learningCategories: LearningCategory[];
  learningSources: LearningSource[];
}
