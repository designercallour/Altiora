/**
 * In-memory DataSource backed by the deterministic seed.
 *
 * Writes mutate the in-memory dataset so the app feels live within a session
 * (drafts persist, submits stick, feedback appears). Reads return structured
 * clones so callers can't accidentally mutate the store.
 */

import type {
  AppUser,
  Cohort,
  InternDetail,
  Internship,
  InternSummary,
  LearningIntelligence,
  Lookups,
  MentorAssignment,
  MentorAssignmentDetail,
  MentorFeedback,
  MentorSummary,
  MonthlyOneOnOne,
  NotificationRecord,
  OneOnOneContext,
  OneOnOneListItem,
  OneOnOneStatus,
  UserRole,
  WeeklyReport,
  WeeklyReportDetail,
} from "@/types/domain";
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
  NotificationInput,
  OneOnOneNotesInput,
  OneOnOneQuery,
  ReportInput,
  ReportQuery,
  ReportUpdate,
} from "@/services/data-source";
import { internshipStatus } from "@/lib/internship";
import {
  reflectionsInMonth,
  summarizeReflections,
} from "@/lib/one-on-one";
import { generateDataset, type MockDataset } from "./generate";

const nowIso = () => new Date().toISOString();
const clone = <T>(v: T): T => structuredClone(v);
const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Sort helper: most recent ISO week first. */
function byWeekDesc(a: WeeklyReport, b: WeeklyReport): number {
  return b.year - a.year || b.weekNumber - a.weekNumber;
}

export class MockDataSource implements DataSource {
  private db: MockDataset;
  private notifDedupe = new Set<string>();

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
    // Most-recent internship by start date. Status is computed downstream from
    // the period (ADR-0007), so we never rely on the stored `status` here.
    const internship =
      [...this.internshipsFor(intern.id)].sort((a, b) =>
        b.startDate.localeCompare(a.startDate),
      )[0] ?? null;
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
    // The user's current engagement (most recent). Activity is decided by the
    // caller via computed status, not the deprecated stored column.
    const internships = this.internshipsFor(userId).sort((a, b) =>
      b.startDate.localeCompare(a.startDate),
    );
    return clone(internships[0] ?? null);
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

  // ── cohorts ──────────────────────────────────────────────────────────────
  async listCohorts(): Promise<Cohort[]> {
    return clone(
      this.db.cohorts
        .filter((c) => c.deletedAt == null)
        .sort((a, b) => b.startDate.localeCompare(a.startDate)),
    );
  }
  async getCohortById(id: string): Promise<Cohort | null> {
    return clone(
      this.db.cohorts.find((c) => c.id === id && c.deletedAt == null) ?? null,
    );
  }
  async createCohort(input: CohortInput): Promise<Cohort> {
    const now = nowIso();
    const cohort: Cohort = {
      id: crypto.randomUUID(),
      name: input.name,
      slug: slugify(input.name),
      description: input.description,
      startDate: input.startDate,
      endDate: input.endDate,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    this.db.cohorts.push(cohort);
    return clone(cohort);
  }
  async updateCohort(id: string, patch: CohortUpdate): Promise<Cohort> {
    const c = this.db.cohorts.find((x) => x.id === id);
    if (!c) throw new Error(`Cohort ${id} not found`);
    if (patch.name !== undefined) {
      c.name = patch.name;
      c.slug = slugify(patch.name);
    }
    if (patch.description !== undefined) c.description = patch.description;
    if (patch.startDate !== undefined) c.startDate = patch.startDate;
    if (patch.endDate !== undefined) c.endDate = patch.endDate;
    c.updatedAt = nowIso();
    return clone(c);
  }
  async archiveCohort(id: string): Promise<void> {
    const c = this.db.cohorts.find((x) => x.id === id);
    if (c) c.deletedAt = nowIso();
  }

  // ── intern management ──────────────────────────────────────────────────────
  async getInternDetail(internshipId: string): Promise<InternDetail | null> {
    const internship = this.db.internships.find(
      (i) => i.id === internshipId && i.deletedAt == null,
    );
    if (!internship) return null;
    const user = this.db.users.find((u) => u.id === internship.userId);
    if (!user) return null;
    const cohort = internship.cohortId
      ? (this.db.cohorts.find((c) => c.id === internship.cohortId) ?? null)
      : null;
    const m = internship.mentorId
      ? (this.db.users.find((u) => u.id === internship.mentorId) ?? null)
      : null;
    const reports = this.activeReports()
      .filter((r) => r.internshipId === internship.id)
      .sort(byWeekDesc);
    return clone({
      user,
      internship,
      cohort,
      mentor: m
        ? { id: m.id, fullName: m.fullName, avatarUrl: m.avatarUrl }
        : null,
      assignments: await this.listMentorAssignments(internship.id),
      submittedCount: reports.filter((r) => r.status === "submitted").length,
      latestReport: reports[0] ?? null,
    });
  }
  async createIntern(input: InternInput): Promise<InternSummary> {
    const now = nowIso();
    let user = this.db.users.find(
      (u) =>
        u.email.toLowerCase() === input.email.toLowerCase() &&
        u.deletedAt == null,
    );
    if (!user) {
      user = {
        id: crypto.randomUUID(),
        authId: null,
        email: input.email,
        fullName: input.fullName,
        avatarUrl: null,
        role: "intern",
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
      this.db.users.push(user);
    } else {
      user.fullName = input.fullName;
      user.role = "intern";
      user.updatedAt = now;
    }
    const internship: Internship = {
      id: crypto.randomUUID(),
      userId: user.id,
      mentorId: input.mentorId,
      cohortId: input.cohortId,
      departmentId: null,
      teamId: null,
      projectId: null,
      position: input.position,
      startDate: input.startDate,
      endDate: input.endDate,
      status: "active",
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    this.db.internships.push(internship);
    if (input.mentorId)
      this.openAssignment(internship.id, input.mentorId, now, null, null);
    return clone(this.summarize(user));
  }
  async updateIntern(
    internshipId: string,
    patch: InternUpdate,
  ): Promise<InternSummary> {
    const internship = this.db.internships.find((i) => i.id === internshipId);
    if (!internship) throw new Error(`Internship ${internshipId} not found`);
    const user = this.db.users.find((u) => u.id === internship.userId);
    if (!user) throw new Error("intern user not found");
    const now = nowIso();
    if (patch.fullName !== undefined) user.fullName = patch.fullName;
    if (patch.email !== undefined) user.email = patch.email;
    user.updatedAt = now;
    if (patch.cohortId !== undefined) internship.cohortId = patch.cohortId;
    if (patch.startDate !== undefined) internship.startDate = patch.startDate;
    if (patch.endDate !== undefined) internship.endDate = patch.endDate;
    if (patch.position !== undefined) internship.position = patch.position;
    if (patch.notes !== undefined) internship.notes = patch.notes;
    if (patch.mentorId !== undefined && patch.mentorId !== internship.mentorId) {
      if (patch.mentorId) await this.assignMentor(internshipId, patch.mentorId);
      else internship.mentorId = null;
    }
    internship.updatedAt = now;
    return clone(this.summarize(user));
  }
  async archiveIntern(internshipId: string): Promise<void> {
    const internship = this.db.internships.find((i) => i.id === internshipId);
    if (internship) internship.deletedAt = nowIso();
  }

  // ── mentor management ──────────────────────────────────────────────────────
  async listMentors(): Promise<MentorSummary[]> {
    const mentors = this.db.users.filter(
      (u) => u.role === "mentor" && u.deletedAt == null,
    );
    const active = this.db.internships.filter((i) => i.deletedAt == null);
    return clone(
      mentors
        .map((user) => {
          const theirs = active.filter((i) => i.mentorId === user.id);
          return {
            user,
            totalInternCount: theirs.length,
            activeInternCount: theirs.filter(
              (i) => internshipStatus(i) === "active",
            ).length,
          };
        })
        .sort((a, b) => b.activeInternCount - a.activeInternCount),
    );
  }
  async getMentorById(id: string): Promise<AppUser | null> {
    return clone(
      this.db.users.find(
        (u) => u.id === id && u.role === "mentor" && u.deletedAt == null,
      ) ?? null,
    );
  }
  async createMentor(input: MentorInput): Promise<MentorSummary> {
    const now = nowIso();
    let user = this.db.users.find(
      (u) =>
        u.email.toLowerCase() === input.email.toLowerCase() &&
        u.deletedAt == null,
    );
    if (!user) {
      user = {
        id: crypto.randomUUID(),
        authId: null,
        email: input.email,
        fullName: input.fullName,
        avatarUrl: null,
        role: "mentor",
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
      this.db.users.push(user);
    } else {
      user.fullName = input.fullName;
      user.role = "mentor";
      user.updatedAt = now;
    }
    return clone({ user, activeInternCount: 0, totalInternCount: 0 });
  }
  async updateMentor(id: string, patch: MentorUpdate): Promise<MentorSummary> {
    const user = this.db.users.find((u) => u.id === id);
    if (!user) throw new Error(`Mentor ${id} not found`);
    if (patch.fullName !== undefined) user.fullName = patch.fullName;
    if (patch.email !== undefined) user.email = patch.email;
    user.updatedAt = nowIso();
    const theirs = this.db.internships.filter(
      (i) => i.mentorId === id && i.deletedAt == null,
    );
    return clone({
      user,
      totalInternCount: theirs.length,
      activeInternCount: theirs.filter((i) => internshipStatus(i) === "active")
        .length,
    });
  }
  async archiveMentor(id: string): Promise<void> {
    const user = this.db.users.find((u) => u.id === id);
    if (user) user.deletedAt = nowIso();
  }

  // ── mentor assignment (with history) ────────────────────────────────────────
  private openAssignment(
    internshipId: string,
    mentorId: string,
    at: string,
    assignedById: string | null,
    note: string | null,
  ) {
    const a: MentorAssignment = {
      id: crypto.randomUUID(),
      internshipId,
      mentorId,
      assignedById,
      note,
      startedAt: at,
      endedAt: null,
      createdAt: at,
      updatedAt: at,
    };
    this.db.mentorAssignments.push(a);
  }
  async assignMentor(
    internshipId: string,
    mentorId: string,
    opts: AssignMentorOptions = {},
  ): Promise<void> {
    const internship = this.db.internships.find((i) => i.id === internshipId);
    if (!internship) throw new Error(`Internship ${internshipId} not found`);
    if (internship.mentorId === mentorId) return;
    const now = nowIso();
    this.db.mentorAssignments
      .filter((a) => a.internshipId === internshipId && a.endedAt == null)
      .forEach((a) => {
        a.endedAt = now;
        a.updatedAt = now;
      });
    this.openAssignment(
      internshipId,
      mentorId,
      now,
      opts.assignedById ?? null,
      opts.note ?? null,
    );
    internship.mentorId = mentorId;
    internship.updatedAt = now;
  }
  async listMentorAssignments(
    internshipId: string,
  ): Promise<MentorAssignmentDetail[]> {
    return clone(
      this.db.mentorAssignments
        .filter((a) => a.internshipId === internshipId)
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
        .map((a) => {
          const m = this.db.users.find((u) => u.id === a.mentorId);
          return {
            ...a,
            mentor: m
              ? { id: m.id, fullName: m.fullName, avatarUrl: m.avatarUrl }
              : null,
          };
        }),
    );
  }

  // ── notifications ────────────────────────────────────────────────────────
  async createNotification(
    input: NotificationInput,
  ): Promise<NotificationRecord | null> {
    if (input.dedupeKey) {
      const key = `${input.recipientId}::${input.dedupeKey}`;
      if (this.notifDedupe.has(key)) return null;
      this.notifDedupe.add(key);
    }
    const rec: NotificationRecord = {
      id: crypto.randomUUID(),
      recipientId: input.recipientId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      payload: input.payload ?? {},
      readAt: null,
      createdAt: nowIso(),
    };
    this.db.notifications.push(rec);
    return clone(rec);
  }

  async listNotifications(
    userId: string,
    opts: { unreadOnly?: boolean; limit?: number } = {},
  ): Promise<NotificationRecord[]> {
    let items = this.db.notifications.filter((n) => n.recipientId === userId);
    if (opts.unreadOnly) items = items.filter((n) => n.readAt == null);
    items = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (opts.limit != null) items = items.slice(0, opts.limit);
    return clone(items);
  }

  async markNotificationRead(id: string): Promise<void> {
    const n = this.db.notifications.find((x) => x.id === id);
    if (n && n.readAt == null) n.readAt = nowIso();
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
      playbackCompleted: input.playbackCompleted,
      instagramStoryCompleted: input.instagramStoryCompleted,
      instagramStoryUrl: input.instagramStoryUrl,
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
      "playbackCompleted",
      "instagramStoryCompleted",
      "instagramStoryUrl",
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

  // ── monthly 1-on-1 ────────────────────────────────────────────────────────
  private internshipById(id: string): Internship | null {
    return (
      this.db.internships.find((i) => i.id === id && i.deletedAt == null) ??
      null
    );
  }

  private userLite(
    id: string | null,
  ): { id: string; fullName: string; avatarUrl: string | null } | null {
    const u = id ? this.db.users.find((x) => x.id === id) : null;
    return u ? { id: u.id, fullName: u.fullName, avatarUrl: u.avatarUrl } : null;
  }

  private oneOnOneListItem(rec: MonthlyOneOnOne): OneOnOneListItem | null {
    const internship = this.internshipById(rec.internshipId);
    if (!internship) return null;
    const intern = this.userLite(internship.userId);
    if (!intern) return null;
    return {
      id: rec.id,
      internshipId: rec.internshipId,
      intern,
      mentor: this.userLite(internship.mentorId),
      month: rec.month,
      year: rec.year,
      status: rec.status,
      completedAt: rec.completedAt,
      updatedAt: rec.updatedAt,
    };
  }

  private buildOneOnOneContext(
    internship: Internship,
    year: number,
    month: number,
    record: MonthlyOneOnOne | null,
  ): OneOnOneContext {
    const intern = this.userLite(internship.userId)!;
    const cohort =
      (internship.cohortId &&
        this.db.cohorts.find((c) => c.id === internship.cohortId)) ||
      null;
    const monthReports = reflectionsInMonth(
      this.activeReports().filter((r) => r.internshipId === internship.id),
      year,
      month,
    );
    return {
      internshipId: internship.id,
      intern,
      position: internship.position,
      cohort,
      mentor: this.userLite(internship.mentorId),
      month,
      year,
      record,
      reflectionSummary: summarizeReflections(monthReports),
    };
  }

  async listOneOnOnes(query: OneOnOneQuery = {}): Promise<OneOnOneListItem[]> {
    const items = this.db.oneOnOnes
      .filter((rec) => {
        const internship = this.internshipById(rec.internshipId);
        if (!internship) return false;
        if (query.internshipId && rec.internshipId !== query.internshipId)
          return false;
        if (query.mentorId && internship.mentorId !== query.mentorId)
          return false;
        if (query.internUserId && internship.userId !== query.internUserId)
          return false;
        if (query.year != null && rec.year !== query.year) return false;
        if (query.month != null && rec.month !== query.month) return false;
        if (query.status && rec.status !== query.status) return false;
        return true;
      })
      .map((rec) => this.oneOnOneListItem(rec))
      .filter((x): x is OneOnOneListItem => x !== null)
      .sort((a, b) => b.year - a.year || b.month - a.month);
    return clone(items);
  }

  async getOneOnOneById(id: string): Promise<OneOnOneContext | null> {
    const record = this.db.oneOnOnes.find((r) => r.id === id) ?? null;
    if (!record) return null;
    const internship = this.internshipById(record.internshipId);
    if (!internship) return null;
    return clone(
      this.buildOneOnOneContext(internship, record.year, record.month, record),
    );
  }

  async getOneOnOneContext(
    internshipId: string,
    year: number,
    month: number,
  ): Promise<OneOnOneContext | null> {
    const internship = this.internshipById(internshipId);
    if (!internship) return null;
    const record =
      this.db.oneOnOnes.find(
        (r) =>
          r.internshipId === internshipId &&
          r.year === year &&
          r.month === month,
      ) ?? null;
    return clone(this.buildOneOnOneContext(internship, year, month, record));
  }

  async upsertOneOnOne(
    internshipId: string,
    year: number,
    month: number,
    notes: OneOnOneNotesInput,
    mentorId: string | null,
  ): Promise<MonthlyOneOnOne> {
    const internship = this.internshipById(internshipId);
    if (!internship) throw new Error(`Internship ${internshipId} not found.`);
    const now = nowIso();
    const existing = this.db.oneOnOnes.find(
      (r) =>
        r.internshipId === internshipId &&
        r.year === year &&
        r.month === month,
    );
    if (existing) {
      existing.strengths = notes.strengths;
      existing.concerns = notes.concerns;
      existing.goalsNextMonth = notes.goalsNextMonth;
      if (mentorId) existing.mentorId = mentorId;
      existing.updatedAt = now;
      return clone(existing);
    }
    const created: MonthlyOneOnOne = {
      id: crypto.randomUUID(),
      internshipId,
      mentorId: mentorId ?? internship.mentorId,
      month,
      year,
      strengths: notes.strengths,
      concerns: notes.concerns,
      goalsNextMonth: notes.goalsNextMonth,
      status: "not_started",
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.db.oneOnOnes.push(created);
    return clone(created);
  }

  async setOneOnOneStatus(
    id: string,
    status: OneOnOneStatus,
  ): Promise<MonthlyOneOnOne> {
    const record = this.db.oneOnOnes.find((r) => r.id === id);
    if (!record) throw new Error(`One-on-one ${id} not found.`);
    const now = nowIso();
    record.status = status;
    record.completedAt =
      status === "completed" ? (record.completedAt ?? now) : null;
    record.updatedAt = now;
    return clone(record);
  }
}
