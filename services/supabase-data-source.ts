/**
 * Supabase-backed DataSource.
 *
 * The ONLY place Supabase is imported. Maps snake_case rows (types/database.ts)
 * to the camelCase domain model, mirroring MockDataSource semantics so the rest
 * of the app is identical on either backend. Access control is enforced by
 * Postgres RLS (see supabase/schema.sql) — these queries assume the caller's
 * session, so a mentor only ever receives their assigned interns' rows, etc.
 *
 * Active only when NEXT_PUBLIC_DATA_SOURCE=supabase.
 */

import { createClient } from "@/supabase/server";
import type {
  AssignMentorOptions,
  CohortInput,
  CohortUpdate,
  DataSource,
  FeedbackInput,
  InternInput,
  InternQuery,
  InternUpdate,
  MentorInput,
  MentorUpdate,
  ReportInput,
  ReportQuery,
  ReportUpdate,
} from "./data-source";
import type {
  CohortRow,
  DepartmentRow,
  InternshipRow,
  LearningCategoryRow,
  LearningLogRow,
  LearningSourceRow,
  MentorAssignmentRow,
  MentorFeedbackRow,
  ProjectRow,
  SkillCategoryRow,
  SkillRow,
  TeamRow,
  UserRow,
  WeeklyReportRow,
  WeeklySkillScoreRow,
} from "@/types/database";
import type {
  AppUser,
  Cohort,
  Department,
  ExtractedConcept,
  ExtractedSkill,
  InternDetail,
  Internship,
  InternSummary,
  LearningCategory,
  LearningIntelligence,
  LearningLog,
  LearningSource,
  Lookups,
  MentorAssignment,
  MentorAssignmentDetail,
  MentorFeedback,
  MentorSummary,
  Project,
  Skill,
  SkillCategory,
  Team,
  UserRole,
  WeeklyReport,
  WeeklyReportDetail,
  WeeklySkillScore,
} from "@/types/domain";
import { internshipStatus } from "@/lib/internship";

interface ReportIntelligenceRow {
  report_id: string;
  summary: string | null;
  learning_direction: string[] | null;
  recommended_topics: string[] | null;
  skills: ExtractedSkill[] | null;
  concepts: ExtractedConcept[] | null;
}

type ReportRowWithChildren = WeeklyReportRow & {
  learning_logs: LearningLogRow[] | null;
  weekly_skill_scores: WeeklySkillScoreRow[] | null;
  mentor_feedback: MentorFeedbackRow[] | null;
  report_intelligence: ReportIntelligenceRow[] | null;
};

const REPORT_SELECT =
  "*, learning_logs(*), weekly_skill_scores(*), mentor_feedback(*), report_intelligence(*)";

// ── Row → domain mappers ──────────────────────────────────────────────────────
const toUser = (r: UserRow): AppUser => ({
  id: r.id,
  authId: r.auth_id,
  email: r.email,
  fullName: r.full_name,
  avatarUrl: r.avatar_url,
  role: r.role,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  deletedAt: r.deleted_at,
});

const toDepartment = (r: DepartmentRow): Department => ({
  id: r.id,
  name: r.name,
  slug: r.slug,
  description: r.description,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  deletedAt: r.deleted_at,
});

const toTeam = (r: TeamRow): Team => ({
  id: r.id,
  departmentId: r.department_id,
  name: r.name,
  slug: r.slug,
  description: r.description,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  deletedAt: r.deleted_at,
});

const toCohort = (r: CohortRow): Cohort => ({
  id: r.id,
  name: r.name,
  slug: r.slug,
  startDate: r.start_date,
  endDate: r.end_date,
  description: r.description,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  deletedAt: r.deleted_at,
});

const toProject = (r: ProjectRow): Project => ({
  id: r.id,
  name: r.name,
  slug: r.slug,
  departmentId: r.department_id,
  description: r.description,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  deletedAt: r.deleted_at,
});

const toSkillCategory = (r: SkillCategoryRow): SkillCategory => ({
  id: r.id,
  name: r.name,
  slug: r.slug,
  sortOrder: r.sort_order,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  deletedAt: r.deleted_at,
});

const toSkill = (r: SkillRow): Skill => ({
  id: r.id,
  skillCategoryId: r.skill_category_id,
  name: r.name,
  slug: r.slug,
  description: r.description,
  sortOrder: r.sort_order,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  deletedAt: r.deleted_at,
});

const toLearningCategory = (r: LearningCategoryRow): LearningCategory => ({
  id: r.id,
  name: r.name,
  slug: r.slug,
  sortOrder: r.sort_order,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  deletedAt: r.deleted_at,
});

const toLearningSource = (r: LearningSourceRow): LearningSource => ({
  id: r.id,
  name: r.name,
  slug: r.slug,
  sortOrder: r.sort_order,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  deletedAt: r.deleted_at,
});

const toInternship = (r: InternshipRow): Internship => ({
  id: r.id,
  userId: r.user_id,
  mentorId: r.mentor_id,
  cohortId: r.cohort_id,
  departmentId: r.department_id,
  teamId: r.team_id,
  projectId: r.project_id,
  position: r.position,
  startDate: r.start_date,
  endDate: r.end_date,
  status: r.status,
  notes: r.notes,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  deletedAt: r.deleted_at,
});

const toMentorAssignment = (r: MentorAssignmentRow): MentorAssignment => ({
  id: r.id,
  internshipId: r.internship_id,
  mentorId: r.mentor_id,
  assignedById: r.assigned_by_id,
  note: r.note,
  startedAt: r.started_at,
  endedAt: r.ended_at,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const toReport = (r: WeeklyReportRow): WeeklyReport => ({
  id: r.id,
  internshipId: r.internship_id,
  year: r.year,
  weekNumber: r.week_number,
  startDate: r.start_date,
  endDate: r.end_date,
  mood: r.mood,
  satisfaction: r.satisfaction,
  achievement: r.achievement,
  challenge: r.challenge,
  solution: r.solution,
  mentorHelp: r.mentor_help,
  confidence: r.confidence,
  workingHours: r.working_hours,
  status: r.status,
  submittedAt: r.submitted_at,
  reviewedAt: r.reviewed_at,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  deletedAt: r.deleted_at,
});

const toSkillScore = (r: WeeklySkillScoreRow): WeeklySkillScore => ({
  id: r.id,
  reportId: r.report_id,
  skillId: r.skill_id,
  score: r.score,
});

const toLearningLog = (r: LearningLogRow): LearningLog => ({
  id: r.id,
  reportId: r.report_id,
  learningCategoryId: r.learning_category_id,
  learningSourceId: r.learning_source_id,
  projectId: r.project_id,
  title: r.title,
  difficulty: r.difficulty,
  confidence: r.confidence,
  impact: r.impact,
  applied: r.applied,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  deletedAt: r.deleted_at,
});

const toFeedback = (r: MentorFeedbackRow): MentorFeedback => ({
  id: r.id,
  reportId: r.report_id,
  mentorId: r.mentor_id,
  feedback: r.feedback,
  nextGoal: r.next_goal,
  rating: r.rating,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  deletedAt: r.deleted_at,
});

function toIntelligence(
  row: ReportIntelligenceRow | null | undefined,
): LearningIntelligence | null {
  if (!row) return null;
  return {
    summary: row.summary ?? "",
    skills: row.skills ?? [],
    concepts: row.concepts ?? [],
    learningDirection: row.learning_direction ?? [],
    recommendedTopics: row.recommended_topics ?? [],
  };
}

function hydrate(r: ReportRowWithChildren): WeeklyReportDetail {
  const feedback = (r.mentor_feedback ?? []).filter(
    (f) => f.deleted_at == null,
  );
  return {
    ...toReport(r),
    learningLogs: (r.learning_logs ?? [])
      .filter((l) => l.deleted_at == null)
      .map(toLearningLog)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    skillScores: (r.weekly_skill_scores ?? []).map(toSkillScore),
    feedback: feedback[0] ? toFeedback(feedback[0]) : null,
    intelligence: toIntelligence(r.report_intelligence?.[0]),
  };
}

function byWeekDesc(a: { year: number; weekNumber: number }, b: typeof a) {
  return b.year - a.year || b.weekNumber - a.weekNumber;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// snake_case payloads for writes
function reportScalars(v: ReportUpdate) {
  const out: Record<string, unknown> = {};
  if (v.year !== undefined) out.year = v.year;
  if (v.weekNumber !== undefined) out.week_number = v.weekNumber;
  if (v.startDate !== undefined) out.start_date = v.startDate;
  if (v.endDate !== undefined) out.end_date = v.endDate;
  if (v.mood !== undefined) out.mood = v.mood;
  if (v.satisfaction !== undefined) out.satisfaction = v.satisfaction;
  if (v.achievement !== undefined) out.achievement = v.achievement;
  if (v.challenge !== undefined) out.challenge = v.challenge;
  if (v.solution !== undefined) out.solution = v.solution;
  if (v.mentorHelp !== undefined) out.mentor_help = v.mentorHelp;
  if (v.confidence !== undefined) out.confidence = v.confidence;
  if (v.workingHours !== undefined) out.working_hours = v.workingHours;
  return out;
}

export class SupabaseDataSource implements DataSource {
  private async db() {
    return createClient();
  }

  // ── session ──────────────────────────────────────────────────────────────
  async getCurrentUser(): Promise<AppUser | null> {
    const supabase = await this.db();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", user.id)
      .is("deleted_at", null)
      .maybeSingle();
    return data ? toUser(data as UserRow) : null;
  }

  // ── lookups ────────────────────────────────────────────────────────────────
  async getLookups(): Promise<Lookups> {
    const supabase = await this.db();
    const [
      departments,
      teams,
      cohorts,
      projects,
      skillCategories,
      skills,
      learningCategories,
      learningSources,
    ] = await Promise.all([
      supabase.from("departments").select("*").is("deleted_at", null),
      supabase.from("teams").select("*").is("deleted_at", null),
      supabase.from("cohorts").select("*").is("deleted_at", null),
      supabase.from("projects").select("*").is("deleted_at", null),
      supabase
        .from("skill_categories")
        .select("*")
        .is("deleted_at", null)
        .order("sort_order"),
      supabase
        .from("skills")
        .select("*")
        .is("deleted_at", null)
        .order("sort_order"),
      supabase
        .from("learning_categories")
        .select("*")
        .is("deleted_at", null)
        .order("sort_order"),
      supabase
        .from("learning_sources")
        .select("*")
        .is("deleted_at", null)
        .order("sort_order"),
    ]);

    return {
      departments: ((departments.data ?? []) as DepartmentRow[]).map(
        toDepartment,
      ),
      teams: ((teams.data ?? []) as TeamRow[]).map(toTeam),
      cohorts: ((cohorts.data ?? []) as CohortRow[]).map(toCohort),
      projects: ((projects.data ?? []) as ProjectRow[]).map(toProject),
      skillCategories: ((skillCategories.data ?? []) as SkillCategoryRow[]).map(
        toSkillCategory,
      ),
      skills: ((skills.data ?? []) as SkillRow[]).map(toSkill),
      learningCategories: (
        (learningCategories.data ?? []) as LearningCategoryRow[]
      ).map(toLearningCategory),
      learningSources: (
        (learningSources.data ?? []) as LearningSourceRow[]
      ).map(toLearningSource),
    };
  }

  // ── people ─────────────────────────────────────────────────────────────────
  async getUserById(id: string): Promise<AppUser | null> {
    const supabase = await this.db();
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();
    return data ? toUser(data as UserRow) : null;
  }

  async listUsers(role?: UserRole): Promise<AppUser[]> {
    const supabase = await this.db();
    let q = supabase.from("users").select("*").is("deleted_at", null);
    if (role) q = q.eq("role", role);
    const { data } = await q;
    return ((data ?? []) as UserRow[]).map(toUser);
  }

  async listInterns(query: InternQuery = {}): Promise<InternSummary[]> {
    const supabase = await this.db();
    const [usersRes, internshipsRes] = await Promise.all([
      supabase.from("users").select("*").is("deleted_at", null),
      supabase.from("internships").select("*").is("deleted_at", null),
    ]);
    const users = ((usersRes.data ?? []) as UserRow[]).map(toUser);
    const internships = ((internshipsRes.data ?? []) as InternshipRow[]).map(
      toInternship,
    );
    const interns = users.filter((u) => u.role === "intern");
    const usersById = new Map(users.map((u) => [u.id, u]));

    const cohorts = await supabase.from("cohorts").select("*");
    const cohortsById = new Map(
      ((cohorts.data ?? []) as CohortRow[]).map((c) => [c.id, toCohort(c)]),
    );
    const departments = await supabase.from("departments").select("*");
    const deptById = new Map(
      ((departments.data ?? []) as DepartmentRow[]).map((d) => [
        d.id,
        toDepartment(d),
      ]),
    );

    const internshipIds = internships.map((i) => i.id);
    const reportsRes = internshipIds.length
      ? await supabase
          .from("weekly_reports")
          .select("*, mentor_feedback(id, deleted_at)")
          .in("internship_id", internshipIds)
          .is("deleted_at", null)
      : { data: [] };
    const reportRows = (reportsRes.data ?? []) as (WeeklyReportRow & {
      mentor_feedback: { id: string; deleted_at: string | null }[] | null;
    })[];

    const summaries = interns.map((intern) => {
      const own = internships.filter((i) => i.userId === intern.id);
      const internship =
        own.find((i) => i.status === "active") ?? own[0] ?? null;
      const cohort = internship
        ? (cohortsById.get(internship.cohortId ?? "") ?? null)
        : null;
      const department = internship
        ? (deptById.get(internship.departmentId ?? "") ?? null)
        : null;
      const mentorUser = internship?.mentorId
        ? (usersById.get(internship.mentorId) ?? null)
        : null;

      const reports = internship
        ? reportRows
            .filter((r) => r.internship_id === internship.id)
            .map((r) => toReport(r))
            .sort(byWeekDesc)
        : [];
      const submitted = reports.filter((r) => r.status === "submitted");
      const needsReview = submitted.some((r) => r.reviewedAt == null);

      return {
        user: intern,
        internship,
        cohort,
        department,
        mentor: mentorUser
          ? {
              id: mentorUser.id,
              fullName: mentorUser.fullName,
              avatarUrl: mentorUser.avatarUrl,
            }
          : null,
        latestReport: reports[0] ?? null,
        submittedCount: submitted.length,
        needsReview,
      } satisfies InternSummary;
    });

    let filtered = summaries;
    if (query.mentorId)
      filtered = filtered.filter(
        (s) => s.internship?.mentorId === query.mentorId,
      );
    if (query.cohortId)
      filtered = filtered.filter(
        (s) => s.internship?.cohortId === query.cohortId,
      );
    if (query.departmentId)
      filtered = filtered.filter(
        (s) => s.internship?.departmentId === query.departmentId,
      );

    return filtered.sort((a, b) =>
      a.user.fullName.localeCompare(b.user.fullName),
    );
  }

  // ── internships ──────────────────────────────────────────────────────────
  async getInternshipById(id: string): Promise<Internship | null> {
    const supabase = await this.db();
    const { data } = await supabase
      .from("internships")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();
    return data ? toInternship(data as InternshipRow) : null;
  }

  async getActiveInternshipForUser(userId: string): Promise<Internship | null> {
    const supabase = await this.db();
    const { data } = await supabase
      .from("internships")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null);
    const items = ((data ?? []) as InternshipRow[]).map(toInternship);
    return items.find((i) => i.status === "active") ?? items[0] ?? null;
  }

  async listInternships(query: InternQuery = {}): Promise<Internship[]> {
    const supabase = await this.db();
    let q = supabase.from("internships").select("*").is("deleted_at", null);
    if (query.mentorId) q = q.eq("mentor_id", query.mentorId);
    if (query.cohortId) q = q.eq("cohort_id", query.cohortId);
    if (query.departmentId) q = q.eq("department_id", query.departmentId);
    const { data } = await q;
    return ((data ?? []) as InternshipRow[]).map(toInternship);
  }

  // ── cohorts ──────────────────────────────────────────────────────────────
  async listCohorts(): Promise<Cohort[]> {
    const supabase = await this.db();
    const { data } = await supabase
      .from("cohorts")
      .select("*")
      .is("deleted_at", null)
      .order("start_date", { ascending: false });
    return ((data ?? []) as CohortRow[]).map(toCohort);
  }

  async getCohortById(id: string): Promise<Cohort | null> {
    const supabase = await this.db();
    const { data } = await supabase
      .from("cohorts")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();
    return data ? toCohort(data as CohortRow) : null;
  }

  async createCohort(input: CohortInput): Promise<Cohort> {
    const supabase = await this.db();
    const { data, error } = await supabase
      .from("cohorts")
      .insert({
        name: input.name,
        slug: slugify(input.name),
        description: input.description,
        start_date: input.startDate,
        end_date: input.endDate,
      })
      .select("*")
      .single();
    if (error || !data)
      throw new Error(error?.message ?? "Failed to create cohort");
    return toCohort(data as CohortRow);
  }

  async updateCohort(id: string, patch: CohortUpdate): Promise<Cohort> {
    const supabase = await this.db();
    const payload: Record<string, unknown> = {};
    if (patch.name !== undefined) {
      payload.name = patch.name;
      payload.slug = slugify(patch.name);
    }
    if (patch.description !== undefined) payload.description = patch.description;
    if (patch.startDate !== undefined) payload.start_date = patch.startDate;
    if (patch.endDate !== undefined) payload.end_date = patch.endDate;
    const { data, error } = await supabase
      .from("cohorts")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();
    if (error || !data)
      throw new Error(error?.message ?? `Cohort ${id} not found`);
    return toCohort(data as CohortRow);
  }

  async archiveCohort(id: string): Promise<void> {
    const supabase = await this.db();
    await supabase
      .from("cohorts")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
  }

  // ── intern management ──────────────────────────────────────────────────────
  async getInternDetail(internshipId: string): Promise<InternDetail | null> {
    const supabase = await this.db();
    const { data: internshipRow } = await supabase
      .from("internships")
      .select("*")
      .eq("id", internshipId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!internshipRow) return null;
    const internship = toInternship(internshipRow as InternshipRow);

    const [userRes, cohortRes, mentorRes, reportsRes, assignments] =
      await Promise.all([
        supabase
          .from("users")
          .select("*")
          .eq("id", internship.userId)
          .maybeSingle(),
        internship.cohortId
          ? supabase
              .from("cohorts")
              .select("*")
              .eq("id", internship.cohortId)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        internship.mentorId
          ? supabase
              .from("users")
              .select("*")
              .eq("id", internship.mentorId)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        supabase
          .from("weekly_reports")
          .select("*")
          .eq("internship_id", internship.id)
          .is("deleted_at", null),
        this.listMentorAssignments(internship.id),
      ]);
    if (!userRes.data) return null;
    const mentorUser = mentorRes.data
      ? toUser(mentorRes.data as UserRow)
      : null;
    const reports = ((reportsRes.data ?? []) as WeeklyReportRow[])
      .map(toReport)
      .sort(byWeekDesc);
    return {
      user: toUser(userRes.data as UserRow),
      internship,
      cohort: cohortRes.data ? toCohort(cohortRes.data as CohortRow) : null,
      mentor: mentorUser
        ? {
            id: mentorUser.id,
            fullName: mentorUser.fullName,
            avatarUrl: mentorUser.avatarUrl,
          }
        : null,
      assignments,
      submittedCount: reports.filter((r) => r.status === "submitted").length,
      latestReport: reports[0] ?? null,
    };
  }

  private async upsertUserByEmail(
    email: string,
    fullName: string,
    role: UserRole,
  ): Promise<AppUser> {
    const supabase = await this.db();
    const { data: existing } = await supabase
      .from("users")
      .select("*")
      .ilike("email", email)
      .is("deleted_at", null)
      .maybeSingle();
    if (existing) {
      const { data, error } = await supabase
        .from("users")
        .update({ full_name: fullName, role })
        .eq("id", (existing as UserRow).id)
        .select("*")
        .single();
      if (error || !data)
        throw new Error(error?.message ?? "Failed to update user");
      return toUser(data as UserRow);
    }
    const { data, error } = await supabase
      .from("users")
      .insert({ email, full_name: fullName, role })
      .select("*")
      .single();
    if (error || !data)
      throw new Error(error?.message ?? "Failed to create user");
    return toUser(data as UserRow);
  }

  async createIntern(input: InternInput): Promise<InternSummary> {
    const supabase = await this.db();
    const user = await this.upsertUserByEmail(
      input.email,
      input.fullName,
      "intern",
    );
    // Grant login access via the allowlist (idempotent).
    await supabase
      .from("allowed_emails")
      .upsert({ email: input.email, role: "intern" }, { onConflict: "email" });
    const { data, error } = await supabase
      .from("internships")
      .insert({
        user_id: user.id,
        mentor_id: input.mentorId,
        cohort_id: input.cohortId,
        position: input.position,
        start_date: input.startDate,
        end_date: input.endDate,
        status: "active",
        notes: input.notes,
      })
      .select("id")
      .single();
    if (error || !data)
      throw new Error(error?.message ?? "Failed to create internship");
    const internshipId = (data as { id: string }).id;
    if (input.mentorId) {
      await this.openAssignment(internshipId, input.mentorId, null, null);
    }
    const detail = await this.getInternDetail(internshipId);
    return this.summaryFromDetail(detail);
  }

  async updateIntern(
    internshipId: string,
    patch: InternUpdate,
  ): Promise<InternSummary> {
    const supabase = await this.db();
    const internship = await this.getInternshipById(internshipId);
    if (!internship) throw new Error(`Internship ${internshipId} not found`);

    if (patch.fullName !== undefined || patch.email !== undefined) {
      const userPatch: Record<string, unknown> = {};
      if (patch.fullName !== undefined) userPatch.full_name = patch.fullName;
      if (patch.email !== undefined) userPatch.email = patch.email;
      await supabase
        .from("users")
        .update(userPatch)
        .eq("id", internship.userId);
    }

    const internPatch: Record<string, unknown> = {};
    if (patch.cohortId !== undefined) internPatch.cohort_id = patch.cohortId;
    if (patch.startDate !== undefined) internPatch.start_date = patch.startDate;
    if (patch.endDate !== undefined) internPatch.end_date = patch.endDate;
    if (patch.position !== undefined) internPatch.position = patch.position;
    if (patch.notes !== undefined) internPatch.notes = patch.notes;
    if (Object.keys(internPatch).length) {
      await supabase
        .from("internships")
        .update(internPatch)
        .eq("id", internshipId);
    }

    if (patch.mentorId !== undefined && patch.mentorId !== internship.mentorId) {
      if (patch.mentorId) await this.assignMentor(internshipId, patch.mentorId);
      else {
        await supabase
          .from("mentor_assignments")
          .update({ ended_at: new Date().toISOString() })
          .eq("internship_id", internshipId)
          .is("ended_at", null);
        await supabase
          .from("internships")
          .update({ mentor_id: null })
          .eq("id", internshipId);
      }
    }

    const detail = await this.getInternDetail(internshipId);
    return this.summaryFromDetail(detail);
  }

  async archiveIntern(internshipId: string): Promise<void> {
    const supabase = await this.db();
    await supabase
      .from("internships")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", internshipId);
  }

  private summaryFromDetail(detail: InternDetail | null): InternSummary {
    if (!detail) throw new Error("Intern vanished after write");
    return {
      user: detail.user,
      internship: detail.internship,
      cohort: detail.cohort,
      department: null,
      mentor: detail.mentor,
      latestReport: detail.latestReport,
      submittedCount: detail.submittedCount,
      needsReview: false,
    };
  }

  // ── mentor management ──────────────────────────────────────────────────────
  async listMentors(): Promise<MentorSummary[]> {
    const supabase = await this.db();
    const [mentorsRes, internshipsRes] = await Promise.all([
      supabase
        .from("users")
        .select("*")
        .eq("role", "mentor")
        .is("deleted_at", null),
      supabase.from("internships").select("*").is("deleted_at", null),
    ]);
    const internships = ((internshipsRes.data ?? []) as InternshipRow[]).map(
      toInternship,
    );
    return ((mentorsRes.data ?? []) as UserRow[])
      .map(toUser)
      .map((user) => {
        const theirs = internships.filter((i) => i.mentorId === user.id);
        return {
          user,
          totalInternCount: theirs.length,
          activeInternCount: theirs.filter(
            (i) => internshipStatus(i) === "active",
          ).length,
        };
      })
      .sort((a, b) => b.activeInternCount - a.activeInternCount);
  }

  async getMentorById(id: string): Promise<AppUser | null> {
    const supabase = await this.db();
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .eq("role", "mentor")
      .is("deleted_at", null)
      .maybeSingle();
    return data ? toUser(data as UserRow) : null;
  }

  async createMentor(input: MentorInput): Promise<MentorSummary> {
    const supabase = await this.db();
    const user = await this.upsertUserByEmail(
      input.email,
      input.fullName,
      "mentor",
    );
    await supabase
      .from("allowed_emails")
      .upsert({ email: input.email, role: "mentor" }, { onConflict: "email" });
    return { user, activeInternCount: 0, totalInternCount: 0 };
  }

  async updateMentor(id: string, patch: MentorUpdate): Promise<MentorSummary> {
    const supabase = await this.db();
    const userPatch: Record<string, unknown> = {};
    if (patch.fullName !== undefined) userPatch.full_name = patch.fullName;
    if (patch.email !== undefined) userPatch.email = patch.email;
    if (Object.keys(userPatch).length) {
      await supabase.from("users").update(userPatch).eq("id", id);
    }
    const { data } = await supabase
      .from("internships")
      .select("*")
      .eq("mentor_id", id)
      .is("deleted_at", null);
    const theirs = ((data ?? []) as InternshipRow[]).map(toInternship);
    const user = await this.getUserById(id);
    if (!user) throw new Error(`Mentor ${id} not found`);
    return {
      user,
      totalInternCount: theirs.length,
      activeInternCount: theirs.filter((i) => internshipStatus(i) === "active")
        .length,
    };
  }

  async archiveMentor(id: string): Promise<void> {
    const supabase = await this.db();
    await supabase
      .from("users")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
  }

  // ── mentor assignment (with history) ────────────────────────────────────────
  private async openAssignment(
    internshipId: string,
    mentorId: string,
    assignedById: string | null,
    note: string | null,
  ): Promise<void> {
    const supabase = await this.db();
    await supabase.from("mentor_assignments").insert({
      internship_id: internshipId,
      mentor_id: mentorId,
      assigned_by_id: assignedById,
      note,
    });
  }

  async assignMentor(
    internshipId: string,
    mentorId: string,
    opts: AssignMentorOptions = {},
  ): Promise<void> {
    const supabase = await this.db();
    const internship = await this.getInternshipById(internshipId);
    if (!internship) throw new Error(`Internship ${internshipId} not found`);
    if (internship.mentorId === mentorId) return;
    await supabase
      .from("mentor_assignments")
      .update({ ended_at: new Date().toISOString() })
      .eq("internship_id", internshipId)
      .is("ended_at", null);
    await this.openAssignment(
      internshipId,
      mentorId,
      opts.assignedById ?? null,
      opts.note ?? null,
    );
    await supabase
      .from("internships")
      .update({ mentor_id: mentorId })
      .eq("id", internshipId);
  }

  async listMentorAssignments(
    internshipId: string,
  ): Promise<MentorAssignmentDetail[]> {
    const supabase = await this.db();
    const { data } = await supabase
      .from("mentor_assignments")
      .select("*")
      .eq("internship_id", internshipId)
      .order("started_at", { ascending: false });
    const rows = ((data ?? []) as MentorAssignmentRow[]).map(toMentorAssignment);
    const mentorIds = [...new Set(rows.map((r) => r.mentorId))];
    const mentorsById = new Map<string, AppUser>();
    if (mentorIds.length) {
      const { data: mentors } = await supabase
        .from("users")
        .select("*")
        .in("id", mentorIds);
      for (const m of ((mentors ?? []) as UserRow[]).map(toUser))
        mentorsById.set(m.id, m);
    }
    return rows.map((a) => {
      const m = mentorsById.get(a.mentorId);
      return {
        ...a,
        mentor: m
          ? { id: m.id, fullName: m.fullName, avatarUrl: m.avatarUrl }
          : null,
      } satisfies MentorAssignmentDetail;
    });
  }

  // ── reports ────────────────────────────────────────────────────────────────
  private async resolveInternshipIds(
    query: ReportQuery,
  ): Promise<string[] | null> {
    if (!query.userId && !query.mentorId && !query.cohortId) return null;
    const supabase = await this.db();
    let q = supabase.from("internships").select("id").is("deleted_at", null);
    if (query.userId) q = q.eq("user_id", query.userId);
    if (query.mentorId) q = q.eq("mentor_id", query.mentorId);
    if (query.cohortId) q = q.eq("cohort_id", query.cohortId);
    const { data } = await q;
    return ((data ?? []) as { id: string }[]).map((r) => r.id);
  }

  private async queryReports(query: ReportQuery, select: string) {
    const supabase = await this.db();
    const ids = await this.resolveInternshipIds(query);
    let q = supabase
      .from("weekly_reports")
      .select(select)
      .is("deleted_at", null);
    if (query.internshipId) q = q.eq("internship_id", query.internshipId);
    if (ids) q = q.in("internship_id", ids.length ? ids : ["__none__"]);
    if (query.status) q = q.eq("status", query.status);
    if (query.year) q = q.eq("year", query.year);
    q = q.order("year", { ascending: false }).order("week_number", {
      ascending: false,
    });
    if (query.limit != null) q = q.limit(query.limit);
    const { data } = await q;
    return data ?? [];
  }

  async listReports(query: ReportQuery = {}): Promise<WeeklyReport[]> {
    const data = await this.queryReports(query, "*");
    return (data as unknown as WeeklyReportRow[]).map(toReport);
  }

  async listReportDetails(
    query: ReportQuery = {},
  ): Promise<WeeklyReportDetail[]> {
    const data = await this.queryReports(query, REPORT_SELECT);
    return (data as unknown as ReportRowWithChildren[]).map(hydrate);
  }

  async getReportById(id: string): Promise<WeeklyReportDetail | null> {
    const supabase = await this.db();
    const { data } = await supabase
      .from("weekly_reports")
      .select(REPORT_SELECT)
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();
    return data ? hydrate(data as ReportRowWithChildren) : null;
  }

  async getReportByWeek(
    internshipId: string,
    year: number,
    week: number,
  ): Promise<WeeklyReportDetail | null> {
    const supabase = await this.db();
    const { data } = await supabase
      .from("weekly_reports")
      .select(REPORT_SELECT)
      .eq("internship_id", internshipId)
      .eq("year", year)
      .eq("week_number", week)
      .is("deleted_at", null)
      .maybeSingle();
    return data ? hydrate(data as ReportRowWithChildren) : null;
  }

  async createReport(input: ReportInput): Promise<WeeklyReportDetail> {
    const supabase = await this.db();
    const { data, error } = await supabase
      .from("weekly_reports")
      .insert({
        internship_id: input.internshipId,
        year: input.year,
        week_number: input.weekNumber,
        start_date: input.startDate,
        end_date: input.endDate,
        mood: input.mood,
        satisfaction: input.satisfaction,
        achievement: input.achievement,
        challenge: input.challenge,
        solution: input.solution,
        mentor_help: input.mentorHelp,
        confidence: input.confidence,
        working_hours: input.workingHours,
        status: "draft",
      })
      .select("id")
      .single();
    if (error || !data)
      throw new Error(error?.message ?? "Failed to create report");
    const reportId = (data as { id: string }).id;
    await this.replaceChildren(reportId, input.learningLogs, input.skillScores);
    const detail = await this.getReportById(reportId);
    if (!detail) throw new Error("Report vanished after create");
    return detail;
  }

  async updateReport(
    id: string,
    patch: ReportUpdate,
  ): Promise<WeeklyReportDetail> {
    const supabase = await this.db();
    const scalars = reportScalars(patch);
    if (Object.keys(scalars).length) {
      await supabase.from("weekly_reports").update(scalars).eq("id", id);
    }
    if (patch.learningLogs !== undefined || patch.skillScores !== undefined) {
      await this.replaceChildren(id, patch.learningLogs, patch.skillScores);
    }
    const detail = await this.getReportById(id);
    if (!detail) throw new Error(`Report ${id} not found`);
    return detail;
  }

  async submitReport(id: string): Promise<WeeklyReportDetail> {
    const supabase = await this.db();
    await supabase
      .from("weekly_reports")
      .update({ status: "submitted", submitted_at: new Date().toISOString() })
      .eq("id", id);
    const detail = await this.getReportById(id);
    if (!detail) throw new Error(`Report ${id} not found`);
    return detail;
  }

  async markReportReviewed(id: string): Promise<WeeklyReportDetail> {
    const supabase = await this.db();
    await supabase
      .from("weekly_reports")
      .update({ reviewed_at: new Date().toISOString() })
      .eq("id", id)
      .is("reviewed_at", null);
    const detail = await this.getReportById(id);
    if (!detail) throw new Error(`Report ${id} not found`);
    return detail;
  }

  async deleteReport(id: string): Promise<void> {
    const supabase = await this.db();
    await supabase
      .from("weekly_reports")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
  }

  async saveReportIntelligence(
    reportId: string,
    intelligence: LearningIntelligence,
  ): Promise<void> {
    const supabase = await this.db();
    await supabase.from("report_intelligence").upsert(
      {
        report_id: reportId,
        summary: intelligence.summary,
        learning_direction: intelligence.learningDirection,
        recommended_topics: intelligence.recommendedTopics,
        skills: intelligence.skills,
        concepts: intelligence.concepts,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "report_id" },
    );
  }

  private async replaceChildren(
    reportId: string,
    learningLogs?: ReportInput["learningLogs"],
    skillScores?: ReportInput["skillScores"],
  ): Promise<void> {
    const supabase = await this.db();
    if (learningLogs !== undefined) {
      await supabase.from("learning_logs").delete().eq("report_id", reportId);
      if (learningLogs.length) {
        await supabase.from("learning_logs").insert(
          learningLogs.map((l) => ({
            report_id: reportId,
            learning_category_id: l.learningCategoryId,
            learning_source_id: l.learningSourceId,
            project_id: l.projectId,
            title: l.title,
            difficulty: l.difficulty,
            confidence: l.confidence,
            impact: l.impact,
            applied: l.applied,
          })),
        );
      }
    }
    if (skillScores !== undefined) {
      await supabase
        .from("weekly_skill_scores")
        .delete()
        .eq("report_id", reportId);
      if (skillScores.length) {
        await supabase.from("weekly_skill_scores").insert(
          skillScores.map((s) => ({
            report_id: reportId,
            skill_id: s.skillId,
            score: s.score,
          })),
        );
      }
    }
  }

  // ── feedback ─────────────────────────────────────────────────────────────
  async upsertFeedback(
    reportId: string,
    input: FeedbackInput,
    mentorId: string | null,
  ): Promise<MentorFeedback> {
    const supabase = await this.db();
    const { data: existing } = await supabase
      .from("mentor_feedback")
      .select("id")
      .eq("report_id", reportId)
      .is("deleted_at", null)
      .maybeSingle();

    const payload = {
      report_id: reportId,
      mentor_id: mentorId,
      feedback: input.feedback,
      next_goal: input.nextGoal,
      rating: input.rating,
    };

    if (existing) {
      const { data, error } = await supabase
        .from("mentor_feedback")
        .update(payload)
        .eq("id", (existing as { id: string }).id)
        .select("*")
        .single();
      if (error || !data)
        throw new Error(error?.message ?? "Failed to save feedback");
      return toFeedback(data as MentorFeedbackRow);
    }

    const { data, error } = await supabase
      .from("mentor_feedback")
      .insert(payload)
      .select("*")
      .single();
    if (error || !data)
      throw new Error(error?.message ?? "Failed to save feedback");
    return toFeedback(data as MentorFeedbackRow);
  }
}
