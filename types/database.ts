/**
 * Database row shapes (snake_case) — the wire format of the Postgres schema.
 *
 * Hand-authored to mirror `supabase/schema.sql`. When the live Supabase project
 * is connected (Phase 3+), replace this file with generated types:
 *
 *   supabase gen types typescript --project-id <id> > types/database.ts
 *
 * The DataSource implementations are the ONLY place allowed to import these.
 * Everything else uses the camelCase domain types in `types/domain.ts`.
 */

import type { InternshipStatus, ReportStatus, UserRole } from "@/types/domain";

export interface DepartmentRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface TeamRow {
  id: string;
  department_id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CohortRow {
  id: string;
  name: string;
  slug: string;
  start_date: string;
  end_date: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ProjectRow {
  id: string;
  name: string;
  slug: string;
  department_id: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SkillCategoryRow {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SkillRow {
  id: string;
  skill_category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface LearningCategoryRow {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface LearningSourceRow {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface UserRow {
  id: string;
  auth_id: string | null;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface InternshipRow {
  id: string;
  user_id: string;
  mentor_id: string | null;
  cohort_id: string | null;
  department_id: string | null;
  team_id: string | null;
  project_id: string | null;
  position: string | null;
  start_date: string;
  end_date: string | null;
  status: InternshipStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface WeeklyReportRow {
  id: string;
  internship_id: string;
  year: number;
  week_number: number;
  start_date: string;
  end_date: string;
  mood: number | null;
  satisfaction: number | null;
  achievement: string | null;
  challenge: string | null;
  solution: string | null;
  mentor_help: string | null;
  confidence: number | null;
  working_hours: number | null;
  status: ReportStatus;
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface WeeklySkillScoreRow {
  id: string;
  report_id: string;
  skill_id: string;
  score: number;
  created_at: string;
  updated_at: string;
}

export interface LearningLogRow {
  id: string;
  report_id: string;
  learning_category_id: string | null;
  learning_source_id: string | null;
  project_id: string | null;
  title: string;
  difficulty: number | null;
  confidence: number | null;
  impact: number | null;
  applied: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface MentorFeedbackRow {
  id: string;
  report_id: string;
  mentor_id: string | null;
  feedback: string | null;
  next_goal: string | null;
  rating: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
