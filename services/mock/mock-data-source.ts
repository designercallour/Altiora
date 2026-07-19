/**
 * In-memory DataSource backed by the deterministic seed.
 *
 * Writes mutate the in-memory dataset so the app feels live within a session
 * (drafts persist, submits stick, feedback appears). Reads return structured
 * clones so callers can't accidentally mutate the store.
 */

import type {
  AppUser,
  Internship,
  InternSummary,
  LearningIntelligence,
  Lookups,
  MentorFeedback,
  UserRole,
  WeeklyReport,
  WeeklyReportDetail,
} from "@/types/domain";
import type {
  DataSource,
  FeedbackInput,
  InternQuery,
  ReportInput,
  ReportQuery,
  ReportUpdate,
} from "@/services/data-source";
import { generateDataset, type MockDataset } from "./generate";

const nowIso = () => new Date().toISOString();
const clone = <T>(v: T): T => structuredClone(v);

/** Sort helper: most recent ISO week first. */
function byWeekDesc(a: WeeklyReport, b: WeeklyReport): number {
  return b.year - a.year || b.weekNumber - a.weekNumber;
}

export class MockDataSource implements DataSource {
  private db: MockDataset;

  constructor(dataset: MockDataset = generateDataset()) {
    this.db = dataset;
  }

  // ── internal helpers ─────────────────────────────────────────────────────
  private activeReports(): WeeklyReport[] {
    return this.db.reports.filter((r) => r.deletedAt == null);
  }

  private internshipsFor(userId: string): Internship[] {
    return this.db.internships.filter(
      (i) => i.userId === userId && i.deletedAt == null,
    );
  }

  private hydrate(report: WeeklyReport): WeeklyReportDetail {
    return {
      ...report,
      learningLogs: this.db.learningLogs
        .filter((l) => l.reportId === report.id && l.deletedAt == null)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      skillScores: this.db.skillScores.filter((s) => s.reportId === report.id),
      feedback:
        this.db.feedback.find(
          (f) => f.reportId === report.id && f.deletedAt == null,
        ) ?? null,
      intelligence:
        this.db.intelligence.find((x) => x.reportId === report.id)?.data ??
        null,
    };
  }

  private summarize(intern: AppUser): InternSummary {
    const internships = this.internshipsFor(intern.id);
    const internship =
      internships.find((i) => i.status === "active") ?? internships[0] ?? null;
    const cohort =
      (internship &&
        this.db.cohorts.find((c) => c.id === internship.cohortId)) ??
      null;
    const department =
      (internship &&
        this.db.departments.find((d) => d.id === internship.departmentId)) ??
      null;
    const mentorUser =
      (internship?.mentorId &&
        this.db.users.find((u) => u.id === internship.mentorId)) ||
      null;

    const reports = internship
      ? this.activeReports()
          .filter((r) => r.internshipId === internship.id)
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
    };
  }

  // ── session ──────────────────────────────────────────────────────────────
  async getCurrentUser(): Promise<AppUser | null> {
    return clone(
      this.db.users.find((u) => u.id === this.db.currentUserId) ?? null,
    );
  }

  // ── lookups ────────────────────────────────────────────────────────────────
  async getLookups(): Promise<Lookups> {
    return clone({
      departments: this.db.departments,
      teams: this.db.teams,
      cohorts: this.db.cohorts,
      projects: this.db.projects,
      skillCategories: this.db.skillCategories,
      skills: [...this.db.skills].sort((a, b) => a.sortOrder - b.sortOrder),
      learningCategories: [...this.db.learningCategories].sort(
        (a, b) => a.sortOrder - b.sortOrder,
      ),
      learningSources: [...this.db.learningSources].sort(
        (a, b) => a.sortOrder - b.sortOrder,
      ),
    });
  }

  // ── people ─────────────────────────────────────────────────────────────────
  async getUserById(id: string): Promise<AppUser | null> {
    return clone(
      this.db.users.find((u) => u.id === id && u.deletedAt == null) ?? null,
    );
  }

  async listUsers(role?: UserRole): Promise<AppUser[]> {
    return clone(
      this.db.users.filter(
        (u) => u.deletedAt == null && (!role || u.role === role),
      ),
    );
  }

  async listInterns(query: InternQuery = {}): Promise<InternSummary[]> {
    const interns = this.db.users.filter(
      (u) => u.role === "intern" && u.deletedAt == null,
    );
    let summaries = interns.map((i) => this.summarize(i));
    if (query.mentorId)
      summaries = summaries.filter(
        (s) => s.internship?.mentorId === query.mentorId,
      );
    if (query.cohortId)
      summaries = summaries.filter(
        (s) => s.internship?.cohortId === query.cohortId,
      );
    if (query.departmentId)
      summaries = summaries.filter(
        (s) => s.internship?.departmentId === query.departmentId,
      );
    summaries.sort((a, b) => a.user.fullName.localeCompare(b.user.fullName));
    return clone(summaries);
  }

  // ── internships ──────────────────────────────────────────────────────────
  async getInternshipById(id: string): Promise<Internship | null> {
    return clone(
      this.db.internships.find((i) => i.id === id && i.deletedAt == null) ??
        null,
    );
  }

  async getActiveInternshipForUser(userId: string): Promise<Internship | null> {
    const internships = this.internshipsFor(userId);
    return clone(
      internships.find((i) => i.status === "active") ?? internships[0] ?? null,
    );
  }

  async listInternships(query: InternQuery = {}): Promise<Internship[]> {
    let items = this.db.internships.filter((i) => i.deletedAt == null);
    if (query.mentorId)
      items = items.filter((i) => i.mentorId === query.mentorId);
    if (query.cohortId)
      items = items.filter((i) => i.cohortId === query.cohortId);
    if (query.departmentId)
      items = items.filter((i) => i.departmentId === query.departmentId);
    return clone(items);
  }

  // ── reports ────────────────────────────────────────────────────────────────
  async listReports(query: ReportQuery = {}): Promise<WeeklyReport[]> {
    let items = this.activeReports();

    if (query.internshipId)
      items = items.filter((r) => r.internshipId === query.internshipId);

    if (query.userId || query.mentorId || query.cohortId) {
      const internshipIds = new Set(
        this.db.internships
          .filter(
            (i) =>
              i.deletedAt == null &&
              (!query.userId || i.userId === query.userId) &&
              (!query.mentorId || i.mentorId === query.mentorId) &&
              (!query.cohortId || i.cohortId === query.cohortId),
          )
          .map((i) => i.id),
      );
      items = items.filter((r) => internshipIds.has(r.internshipId));
    }

    if (query.status) items = items.filter((r) => r.status === query.status);
    if (query.year) items = items.filter((r) => r.year === query.year);

    items = [...items].sort(byWeekDesc);
    if (query.limit != null) items = items.slice(0, query.limit);
    return clone(items);
  }

  async listReportDetails(
    query: ReportQuery = {},
  ): Promise<WeeklyReportDetail[]> {
    const reports = await this.listReports(query);
    return clone(reports.map((r) => this.hydrate(r)));
  }

  async getReportById(id: string): Promise<WeeklyReportDetail | null> {
    const report = this.activeReports().find((r) => r.id === id);
    return report ? clone(this.hydrate(report)) : null;
  }

  async getReportByWeek(
    internshipId: string,
    year: number,
    week: number,
  ): Promise<WeeklyReportDetail | null> {
    const report = this.activeReports().find(
      (r) =>
        r.internshipId === internshipId &&
        r.year === year &&
        r.weekNumber === week,
    );
    return report ? clone(this.hydrate(report)) : null;
  }

  async createReport(input: ReportInput): Promise<WeeklyReportDetail> {
    const exists = this.activeReports().some(
      (r) =>
        r.internshipId === input.internshipId &&
        r.year === input.year &&
        r.weekNumber === input.weekNumber,
    );
    if (exists) {
      throw new Error(
        `A report already exists for this internship in ${input.year}-W${input.weekNumber}.`,
      );
    }

    const id = crypto.randomUUID();
    const now = nowIso();
    const report: WeeklyReport = {
      id,
      internshipId: input.internshipId,
      year: input.year,
      weekNumber: input.weekNumber,
      startDate: input.startDate,
      endDate: input.endDate,
      mood: input.mood,
      satisfaction: input.satisfaction,
      achievement: input.achievement,
      challenge: input.challenge,
      solution: input.solution,
      mentorHelp: input.mentorHelp,
      confidence: input.confidence,
      workingHours: input.workingHours,
      status: "draft",
      submittedAt: null,
      reviewedAt: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    this.db.reports.push(report);
    this.replaceChildren(id, input);
    return clone(this.hydrate(report));
  }

  async updateReport(
    id: string,
    patch: ReportUpdate,
  ): Promise<WeeklyReportDetail> {
    const report = this.activeReports().find((r) => r.id === id);
    if (!report) throw new Error(`Report ${id} not found.`);

    const scalarKeys = [
      "year",
      "weekNumber",
      "startDate",
      "endDate",
      "mood",
      "satisfaction",
      "achievement",
      "challenge",
      "solution",
      "mentorHelp",
      "confidence",
      "workingHours",
    ] as const;
    const src = patch as Record<string, unknown>;
    const dst = report as unknown as Record<string, unknown>;
    for (const key of scalarKeys) {
      if (src[key] !== undefined) dst[key] = src[key];
    }
    report.updatedAt = nowIso();

    if (patch.learningLogs !== undefined || patch.skillScores !== undefined) {
      this.replaceChildren(id, {
        learningLogs: patch.learningLogs ?? this.currentLogInputs(id),
        skillScores: patch.skillScores ?? this.currentScoreInputs(id),
      });
    }
    return clone(this.hydrate(report));
  }

  async submitReport(id: string): Promise<WeeklyReportDetail> {
    const report = this.activeReports().find((r) => r.id === id);
    if (!report) throw new Error(`Report ${id} not found.`);
    report.status = "submitted";
    report.submittedAt = nowIso();
    report.updatedAt = report.submittedAt;
    return clone(this.hydrate(report));
  }

  async markReportReviewed(id: string): Promise<WeeklyReportDetail> {
    const report = this.activeReports().find((r) => r.id === id);
    if (!report) throw new Error(`Report ${id} not found.`);
    if (report.reviewedAt == null) {
      report.reviewedAt = nowIso();
      report.updatedAt = report.reviewedAt;
    }
    return clone(this.hydrate(report));
  }

  async saveReportIntelligence(
    reportId: string,
    intelligence: LearningIntelligence,
  ): Promise<void> {
    const existing = this.db.intelligence.find(
      (x) => x.reportId === reportId,
    );
    if (existing) existing.data = intelligence;
    else this.db.intelligence.push({ reportId, data: intelligence });
  }

  async deleteReport(id: string): Promise<void> {
    const report = this.db.reports.find((r) => r.id === id);
    if (report) report.deletedAt = nowIso();
  }

  // ── feedback ─────────────────────────────────────────────────────────────
  async upsertFeedback(
    reportId: string,
    input: FeedbackInput,
    mentorId: string | null,
  ): Promise<MentorFeedback> {
    const existing = this.db.feedback.find(
      (f) => f.reportId === reportId && f.deletedAt == null,
    );
    const now = nowIso();
    if (existing) {
      existing.feedback = input.feedback;
      existing.nextGoal = input.nextGoal;
      existing.rating = input.rating;
      existing.mentorId = mentorId ?? existing.mentorId;
      existing.updatedAt = now;
      return clone(existing);
    }
    const created: MentorFeedback = {
      id: crypto.randomUUID(),
      reportId,
      mentorId,
      feedback: input.feedback,
      nextGoal: input.nextGoal,
      rating: input.rating,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    this.db.feedback.push(created);
    return clone(created);
  }

  // ── child-collection helpers ─────────────────────────────────────────────
  private currentLogInputs(reportId: string) {
    return this.db.learningLogs
      .filter((l) => l.reportId === reportId && l.deletedAt == null)
      .map((l) => ({
        id: l.id,
        learningCategoryId: l.learningCategoryId,
        learningSourceId: l.learningSourceId,
        projectId: l.projectId,
        title: l.title,
        difficulty: l.difficulty,
        confidence: l.confidence,
        impact: l.impact,
        applied: l.applied,
      }));
  }

  private currentScoreInputs(reportId: string) {
    return this.db.skillScores
      .filter((s) => s.reportId === reportId)
      .map((s) => ({ skillId: s.skillId, score: s.score }));
  }

  private replaceChildren(
    reportId: string,
    input: Pick<ReportInput, "learningLogs" | "skillScores">,
  ): void {
    const now = nowIso();
    this.db.learningLogs = this.db.learningLogs.filter(
      (l) => l.reportId !== reportId,
    );
    this.db.skillScores = this.db.skillScores.filter(
      (s) => s.reportId !== reportId,
    );

    for (const log of input.learningLogs) {
      this.db.learningLogs.push({
        id: log.id ?? crypto.randomUUID(),
        reportId,
        learningCategoryId: log.learningCategoryId,
        learningSourceId: log.learningSourceId,
        projectId: log.projectId,
        title: log.title,
        difficulty: log.difficulty,
        confidence: log.confidence,
        impact: log.impact,
        applied: log.applied,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });
    }
    for (const score of input.skillScores) {
      this.db.skillScores.push({
        id: crypto.randomUUID(),
        reportId,
        skillId: score.skillId,
        score: score.score,
      });
    }
  }
}
