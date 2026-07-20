/**
 * The DataSource contract.
 *
 * This is the single seam between Altiora's features and its backend.
 * Features import ONLY from here (via `getDataSource()` in `services/index.ts`)
 * — never from `@/supabase/*` or the mock modules directly.
 *
 * Implementations:
 *   • MockDataSource     — in-memory, seeded (default, this phase)
 *   • SupabaseDataSource — @supabase/ssr backed (Phase 3+)
 */

import type {
  AppUser,
  Cohort,
  InternDetail,
  Internship,
  InternSummary,
  LearningIntelligence,
  Lookups,
  MentorAssignmentDetail,
  MentorFeedback,
  MentorSummary,
  ReportStatus,
  UserRole,
  WeeklyReport,
  WeeklyReportDetail,
} from "@/types/domain";

// ── Query / input DTOs ───────────────────────────────────────────────────────
export interface ReportQuery {
  internshipId?: string;
  userId?: string;
  mentorId?: string;
  cohortId?: string;
  status?: ReportStatus;
  year?: number;
  /** Cap the result set. Results are always ordered most-recent ISO week first. */
  limit?: number;
}

export interface InternQuery {
  mentorId?: string;
  cohortId?: string;
  departmentId?: string;
}

export interface LearningLogInput {
  /** Present when editing an existing log within a report. */
  id?: string;
  learningCategoryId: string | null;
  learningSourceId: string | null;
  projectId: string | null;
  title: string;
  difficulty: number | null;
  confidence: number | null;
  impact: number | null;
  applied: boolean;
}

export interface SkillScoreInput {
  skillId: string;
  score: number;
}

export interface ReportInput {
  internshipId: string;
  year: number;
  weekNumber: number;
  startDate: string;
  endDate: string;
  mood: number | null;
  satisfaction: number | null;
  achievement: string | null;
  challenge: string | null;
  solution: string | null;
  mentorHelp: string | null;
  confidence: number | null;
  workingHours: number | null;
  learningLogs: LearningLogInput[];
  skillScores: SkillScoreInput[];
}

export type ReportUpdate = Partial<Omit<ReportInput, "internshipId">>;

export interface FeedbackInput {
  feedback: string | null;
  nextGoal: string | null;
  rating: number | null;
}

export interface InternInput {
  fullName: string;
  email: string;
  cohortId: string | null;
  startDate: string;
  endDate: string;
  mentorId: string | null;
  position: string | null;
  notes: string | null;
}
export type InternUpdate = Partial<InternInput>;

export interface MentorInput {
  fullName: string;
  email: string;
}
export type MentorUpdate = Partial<MentorInput>;

export interface CohortInput {
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
}
export type CohortUpdate = Partial<CohortInput>;

export interface AssignMentorOptions {
  assignedById?: string | null;
  note?: string | null;
}

// ── The interface ──────────────────────────────────────────────────────────────
export interface DataSource {
  // Session / identity ---------------------------------------------------------
  getCurrentUser(): Promise<AppUser | null>;

  // Lookups --------------------------------------------------------------------
  getLookups(): Promise<Lookups>;

  // People ---------------------------------------------------------------------
  getUserById(id: string): Promise<AppUser | null>;
  listUsers(role?: UserRole): Promise<AppUser[]>;
  listInterns(query?: InternQuery): Promise<InternSummary[]>;

  // Internships ----------------------------------------------------------------
  getInternshipById(id: string): Promise<Internship | null>;
  getActiveInternshipForUser(userId: string): Promise<Internship | null>;
  listInternships(query?: InternQuery): Promise<Internship[]>;

  // Cohort management ----------------------------------------------------------
  listCohorts(): Promise<Cohort[]>;
  getCohortById(id: string): Promise<Cohort | null>;
  createCohort(input: CohortInput): Promise<Cohort>;
  updateCohort(id: string, patch: CohortUpdate): Promise<Cohort>;
  archiveCohort(id: string): Promise<void>;

  // Intern management ----------------------------------------------------------
  getInternDetail(internshipId: string): Promise<InternDetail | null>;
  /** Onboard an intern: creates the user, the internship, and (in supabase) the allowlist entry. */
  createIntern(input: InternInput): Promise<InternSummary>;
  updateIntern(
    internshipId: string,
    patch: InternUpdate,
  ): Promise<InternSummary>;
  archiveIntern(internshipId: string): Promise<void>;

  // Mentor management ----------------------------------------------------------
  listMentors(): Promise<MentorSummary[]>;
  getMentorById(id: string): Promise<AppUser | null>;
  createMentor(input: MentorInput): Promise<MentorSummary>;
  updateMentor(id: string, patch: MentorUpdate): Promise<MentorSummary>;
  archiveMentor(id: string): Promise<void>;

  // Mentor assignment ----------------------------------------------------------
  /** Reassign the internship's mentor, preserving history (closes prior span). */
  assignMentor(
    internshipId: string,
    mentorId: string,
    opts?: AssignMentorOptions,
  ): Promise<void>;
  listMentorAssignments(
    internshipId: string,
  ): Promise<MentorAssignmentDetail[]>;

  // Weekly reports -------------------------------------------------------------
  listReports(query?: ReportQuery): Promise<WeeklyReport[]>;
  /** Reports hydrated with learning logs, skill scores, and feedback — for analytics. */
  listReportDetails(query?: ReportQuery): Promise<WeeklyReportDetail[]>;
  getReportById(id: string): Promise<WeeklyReportDetail | null>;
  getReportByWeek(
    internshipId: string,
    year: number,
    week: number,
  ): Promise<WeeklyReportDetail | null>;
  createReport(input: ReportInput): Promise<WeeklyReportDetail>;
  updateReport(id: string, patch: ReportUpdate): Promise<WeeklyReportDetail>;
  submitReport(id: string): Promise<WeeklyReportDetail>;
  deleteReport(id: string): Promise<void>;

  // Mentor review --------------------------------------------------------------
  /** Mark a submitted report as reviewed by its mentor (idempotent). */
  markReportReviewed(id: string): Promise<WeeklyReportDetail>;

  // Learning intelligence ------------------------------------------------------
  /** Persist the AI-extracted learning signal for a report (upsert). */
  saveReportIntelligence(
    reportId: string,
    intelligence: LearningIntelligence,
  ): Promise<void>;

  // Mentor feedback ------------------------------------------------------------
  upsertFeedback(
    reportId: string,
    input: FeedbackInput,
    mentorId: string | null,
  ): Promise<MentorFeedback>;
}
