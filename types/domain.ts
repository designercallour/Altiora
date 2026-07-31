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

export type OneOnOneStatus = "not_started" | "completed";

export const USER_ROLES: readonly UserRole[] = ["admin", "mentor", "intern"];
export const INTERNSHIP_STATUSES: readonly InternshipStatus[] = [
  "upcoming",
  "active",
  "paused",
  "completed",
  "terminated",
];
export const REPORT_STATUSES: readonly ReportStatus[] = ["draft", "submitted"];
export const ONE_ON_ONE_STATUSES: readonly OneOnOneStatus[] = [
  "not_started",
  "completed",
];

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
  /** @deprecated Status is computed from the period — see lib/internship.ts. */
  status: InternshipStatus;
  notes: string | null;
}

/**
 * One mentor-supervision span for an internship. Reassignment closes the
 * current span (sets endedAt) and opens a new one, preserving an audit trail.
 * The current mentor is the assignment with endedAt = null.
 */
export interface MentorAssignment extends Timestamps {
  id: string;
  internshipId: string;
  mentorId: string;
  assignedById: string | null;
  note: string | null;
  startedAt: string;
  endedAt: string | null;
}

/** A mentor assignment with its mentor resolved, for history timelines. */
export interface MentorAssignmentDetail extends MentorAssignment {
  mentor: Pick<AppUser, "id" | "fullName" | "avatarUrl"> | null;
}

// ── In-app notifications ──────────────────────────────────────────────────────
/** A delivered in-app notification (the reminder inbox). */
export interface NotificationRecord {
  id: string;
  recipientId: string;
  type: string; // a NotificationType value, stored as text
  title: string;
  body: string | null;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
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
  /** Intern confirmed they completed at least one playback session this week. */
  playbackCompleted: boolean;
  /** Intern confirmed they posted an Instagram Story about their internship. */
  instagramStoryCompleted: boolean;
  /** Storage path/URL of the uploaded Instagram Story proof, or null. */
  instagramStoryUrl: string | null;
  status: ReportStatus;
  submittedAt: string | null;
  reviewedAt: string | null; // set when a mentor marks the report reviewed
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

// ── Learning intelligence (AI-extracted from reflection text) ─────────────────

export type LearningStatus = "New Learning" | "Continued Practice" | "Mastery";
export type LearningImportance = "Low" | "Medium" | "High";

export interface ExtractedSkill {
  name: string;
  confidence: number; // 0..1
  learningStatus: LearningStatus;
  importance: LearningImportance;
  evidence: string;
}

export interface ExtractedConcept {
  name: string;
  relatedSkill: string;
}

/** Structured signal Claude extracts from a report's reflection + learnings. */
export interface LearningIntelligence {
  summary: string;
  skills: ExtractedSkill[];
  concepts: ExtractedConcept[];
  learningDirection: string[];
  recommendedTopics: string[];
}

// ── Composite / read-model types ──────────────────────────────────────────────

/** A fully-hydrated report, as the Weekly Report screen and detail views need it. */
export interface WeeklyReportDetail extends WeeklyReport {
  learningLogs: LearningLog[];
  skillScores: WeeklySkillScore[];
  feedback: MentorFeedback | null;
  intelligence: LearningIntelligence | null;
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
  needsReview: boolean; // has a submitted report not yet marked reviewed
}

/** A mentor with workload context, for mentor management + dashboards. */
export interface MentorSummary {
  user: AppUser;
  activeInternCount: number;
  totalInternCount: number;
}

/** Full intern record for the admin detail page. */
export interface InternDetail {
  user: AppUser;
  internship: Internship | null;
  cohort: Cohort | null;
  mentor: Pick<AppUser, "id" | "fullName" | "avatarUrl"> | null;
  assignments: MentorAssignmentDetail[];
  submittedCount: number;
  latestReport: WeeklyReport | null;
}

// ── Monthly 1-on-1 (mentor ↔ intern monthly meeting notes) ────────────────────

/**
 * One month's documented mentor-intern check-in. Keyed to an internship (which
 * identifies the intern) plus a month/year. The meeting itself happens outside
 * the platform; this record captures its outcome. There is at most one row per
 * internship per month (enforced by a unique index).
 */
export interface MonthlyOneOnOne extends Timestamps {
  id: string;
  internshipId: string;
  /** The mentor who authored the notes (snapshot; may differ after reassignment). */
  mentorId: string | null;
  month: number; // 1..12
  year: number;
  strengths: string | null;
  concerns: string | null;
  goalsNextMonth: string | null;
  status: OneOnOneStatus;
  completedAt: string | null;
}

/** A row in the Monthly 1-on-1 management table. */
export interface OneOnOneListItem {
  /** The saved record id, or null when this month has no record yet. */
  id: string | null;
  internshipId: string;
  intern: Pick<AppUser, "id" | "fullName" | "avatarUrl">;
  mentor: Pick<AppUser, "id" | "fullName" | "avatarUrl"> | null;
  month: number;
  year: number;
  status: OneOnOneStatus;
  completedAt: string | null;
  /** Last time the record changed, or null for a not-yet-created month. */
  updatedAt: string | null;
}

/** Rollup of an intern's Weekly Reflections within a given month. */
export interface OneOnOneReflectionSummary {
  totalSubmitted: number;
  playbackCount: number;
  instagramCount: number;
  /** The submitted reflections that fall within the month, most recent first. */
  reports: WeeklyReport[];
}

/** Everything the Monthly 1-on-1 editor/detail screen needs. */
export interface OneOnOneContext {
  internshipId: string;
  intern: Pick<AppUser, "id" | "fullName" | "avatarUrl">;
  position: string | null; // the intern's role
  cohort: Cohort | null;
  mentor: Pick<AppUser, "id" | "fullName" | "avatarUrl"> | null;
  month: number;
  year: number;
  /** The saved record, or null if this month hasn't been started. */
  record: MonthlyOneOnOne | null;
  reflectionSummary: OneOnOneReflectionSummary;
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
