/**
 * Deterministic mock dataset builder.
 *
 * Produces the full relational graph in memory:
 *   1 admin · 2 mentors · 10 interns · 2 cohorts · 4 departments · 6 projects
 *   · 10 internships · 100 weekly reports · 800 skill scores · 500 learning logs
 *   · 90 mentor feedback entries.
 *
 * All values flow from a single seeded PRNG, so the dataset (and every chart)
 * is stable across reloads. Growth trends are modelled so confidence,
 * satisfaction, mood, and skills rise over the weeks — the dashboards should
 * look like real internships progressing.
 */

import { weekRangeFrom } from "@/lib/week";
import type {
  AppUser,
  Cohort,
  Department,
  Internship,
  LearningCategory,
  LearningLog,
  LearningSource,
  MentorAssignment,
  MentorFeedback,
  Project,
  Skill,
  SkillCategory,
  Team,
  WeeklyReport,
  WeeklySkillScore,
  LearningIntelligence,
} from "@/types/domain";
import { Prng } from "./prng";
import { stubExtract } from "@/services/ai/stub";
import {
  ACHIEVEMENTS,
  ADMIN,
  CHALLENGES,
  COHORTS,
  DEPARTMENTS,
  INTERNS,
  LEARNING_CATEGORIES,
  LEARNING_SOURCES,
  LEARNING_TITLES,
  MENTORS,
  MENTOR_HELP,
  POSITIONS,
  PROJECTS,
  SKILLS,
  SKILL_CATEGORIES,
  SOLUTIONS,
  TEAMS,
} from "./reference-data";

const SEED = 20260713;
const SEEDED_AT = "2026-01-15T00:00:00.000Z";
const WEEKS_PER_INTERNSHIP = 10;
const LOGS_PER_REPORT = 5;

export interface MockDataset {
  users: AppUser[];
  departments: Department[];
  teams: Team[];
  cohorts: Cohort[];
  projects: Project[];
  skillCategories: SkillCategory[];
  skills: Skill[];
  learningCategories: LearningCategory[];
  learningSources: LearningSource[];
  internships: Internship[];
  reports: WeeklyReport[];
  skillScores: WeeklySkillScore[];
  learningLogs: LearningLog[];
  feedback: MentorFeedback[];
  intelligence: ReportIntelligence[];
  mentorAssignments: MentorAssignment[];
  currentUserId: string;
}

/** AI-extracted learning signal, keyed to a report. */
export interface ReportIntelligence {
  reportId: string;
  data: LearningIntelligence;
}

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

export function generateDataset(): MockDataset {
  const rng = new Prng(SEED);
  const ts = { createdAt: SEEDED_AT, updatedAt: SEEDED_AT, deletedAt: null };

  // ── Lookups ─────────────────────────────────────────────────────────────
  const departments: Department[] = DEPARTMENTS.map((d) => ({
    id: rng.uuid(),
    name: d.name,
    slug: d.slug,
    description: null,
    ...ts,
  }));
  const deptBySlug = new Map(departments.map((d) => [d.slug, d]));

  const teams: Team[] = TEAMS.map((t) => ({
    id: rng.uuid(),
    departmentId: deptBySlug.get(t.departmentSlug)!.id,
    name: t.name,
    slug: t.slug,
    description: null,
    ...ts,
  }));

  const cohorts: Cohort[] = COHORTS.map((c) => ({
    id: rng.uuid(),
    name: c.name,
    slug: c.slug,
    startDate: c.startDate,
    endDate: c.endDate,
    description: null,
    ...ts,
  }));

  const projects: Project[] = PROJECTS.map((p) => ({
    id: rng.uuid(),
    name: p.name,
    slug: p.slug,
    departmentId: deptBySlug.get(p.departmentSlug)?.id ?? null,
    description: null,
    ...ts,
  }));

  const skillCategories: SkillCategory[] = SKILL_CATEGORIES.map((c) => ({
    id: rng.uuid(),
    name: c.name,
    slug: c.slug,
    sortOrder: c.sortOrder,
    ...ts,
  }));
  const skillCatBySlug = new Map(skillCategories.map((c) => [c.slug, c]));

  const skills: Skill[] = SKILLS.map((s) => ({
    id: rng.uuid(),
    skillCategoryId: skillCatBySlug.get(s.categorySlug)?.id ?? null,
    name: s.name,
    slug: s.slug,
    description: null,
    sortOrder: s.sortOrder,
    ...ts,
  }));

  const learningCategories: LearningCategory[] = LEARNING_CATEGORIES.map(
    (c) => ({
      id: rng.uuid(),
      name: c.name,
      slug: c.slug,
      sortOrder: c.sortOrder,
      ...ts,
    }),
  );

  const learningSources: LearningSource[] = LEARNING_SOURCES.map((s) => ({
    id: rng.uuid(),
    name: s.name,
    slug: s.slug,
    sortOrder: s.sortOrder,
    ...ts,
  }));

  // ── People ──────────────────────────────────────────────────────────────
  const admin: AppUser = {
    id: rng.uuid(),
    authId: null,
    email: ADMIN.email,
    fullName: ADMIN.fullName,
    avatarUrl: null,
    role: "admin",
    ...ts,
  };

  const mentors: AppUser[] = MENTORS.map((m) => ({
    id: rng.uuid(),
    authId: null,
    email: m.email,
    fullName: m.fullName,
    avatarUrl: null,
    role: "mentor" as const,
    ...ts,
  }));

  const interns: AppUser[] = INTERNS.map((m) => ({
    id: rng.uuid(),
    authId: null,
    email: m.email,
    fullName: m.fullName,
    avatarUrl: null,
    role: "intern" as const,
    ...ts,
  }));

  const users = [admin, ...mentors, ...interns];

  // ── Internships ───────────────────────────────────────────────────────────
  const internships: Internship[] = interns.map((intern, i) => {
    const cohort = i < 5 ? cohorts[0]! : cohorts[1]!;
    const mentor = mentors[i % mentors.length]!;
    const department = rng.pick(departments);
    const deptTeams = teams.filter((t) => t.departmentId === department.id);
    const team = deptTeams.length ? rng.pick(deptTeams) : null;
    const project = rng.pick(projects);
    const completed = cohort.slug === "spring-2026";
    return {
      id: rng.uuid(),
      userId: intern.id,
      mentorId: mentor.id,
      cohortId: cohort.id,
      departmentId: department.id,
      teamId: team?.id ?? null,
      projectId: project.id,
      position: rng.pick(POSITIONS),
      startDate: cohort.startDate,
      endDate: cohort.endDate,
      status: completed ? "completed" : "active",
      notes: null,
      ...ts,
    };
  });

  // Mentor assignment history — one open span per internship's current mentor.
  const mentorAssignments: MentorAssignment[] = internships
    .filter((i) => i.mentorId)
    .map((i) => ({
      id: rng.uuid(),
      internshipId: i.id,
      mentorId: i.mentorId!,
      assignedById: admin.id,
      note: null,
      startedAt: `${i.startDate}T00:00:00.000Z`,
      endedAt: null,
      createdAt: `${i.startDate}T00:00:00.000Z`,
      updatedAt: `${i.startDate}T00:00:00.000Z`,
    }));

  // Source weighting: mentor/project/self-learning are most common.
  const sourceWeights = learningSources.map((s) =>
    s.slug === "mentor" || s.slug === "project"
      ? 4
      : s.slug === "self-learning"
        ? 3
        : s.slug === "client" || s.slug === "course"
          ? 2
          : 1,
  );

  // ── Reports + children ──────────────────────────────────────────────────
  const reports: WeeklyReport[] = [];
  const skillScores: WeeklySkillScore[] = [];
  const learningLogs: LearningLog[] = [];
  const feedback: MentorFeedback[] = [];
  const intelligence: ReportIntelligence[] = [];

  for (const internship of internships) {
    const cohort = cohorts.find((c) => c.id === internship.cohortId)!;
    const completed = internship.status === "completed";
    const mentorId = internship.mentorId;

    // Per-intern skill bias so each profile is distinct.
    const skillBias = new Map(
      skills.map((s) => [s.id, rng.float(-0.7, 0.7, 2)]),
    );

    // Anchor: completed → last 10 weeks of cohort; active → previous 10 weeks
    // relative to today (leaving the current week open to submit).
    const anchor = completed
      ? new Date(`${cohort.endDate}T00:00:00Z`)
      : new Date();
    const offsets = completed
      ? Array.from(
          { length: WEEKS_PER_INTERNSHIP },
          (_, k) => k - (WEEKS_PER_INTERNSHIP - 1),
        )
      : Array.from(
          { length: WEEKS_PER_INTERNSHIP },
          (_, k) => k - WEEKS_PER_INTERNSHIP,
        );

    const internReports: WeeklyReport[] = [];

    offsets.forEach((offset, w) => {
      const range = weekRangeFrom(anchor, offset);
      const g = w / (WEEKS_PER_INTERNSHIP - 1); // 0 → 1 growth
      const endTs = `${range.endDate}T17:00:00.000Z`;

      const confidence = clamp(Math.round(4 + g * 4 + rng.int(-1, 1)), 1, 10);
      const satisfaction = clamp(Math.round(5 + g * 3 + rng.int(-1, 1)), 1, 10);
      const mood = clamp(Math.round(3 + g * 2 + rng.int(-1, 1)), 1, 6);

      const report: WeeklyReport = {
        id: rng.uuid(),
        internshipId: internship.id,
        year: range.year,
        weekNumber: range.week,
        startDate: range.startDate,
        endDate: range.endDate,
        mood,
        satisfaction,
        achievement: rng.pick(ACHIEVEMENTS),
        challenge: rng.pick(CHALLENGES),
        solution: rng.pick(SOLUTIONS),
        mentorHelp: rng.pick(MENTOR_HELP) || null,
        confidence,
        workingHours: rng.bool(0.85) ? rng.float(34, 46, 1) : null,
        status: "submitted",
        submittedAt: endTs,
        reviewedAt: null,
        createdAt: endTs,
        updatedAt: endTs,
        deletedAt: null,
      };
      reports.push(report);
      internReports.push(report);

      // Skill scores (all 8 skills, trending up).
      for (const skill of skills) {
        const bias = skillBias.get(skill.id) ?? 0;
        const score = clamp(
          Math.round(2.4 + g * 2 + bias + rng.float(-0.4, 0.4, 2)),
          1,
          5,
        );
        skillScores.push({
          id: rng.uuid(),
          reportId: report.id,
          skillId: skill.id,
          score,
        });
      }

      // Learning logs.
      const logTitles: string[] = [];
      for (let l = 0; l < LOGS_PER_REPORT; l++) {
        const source = rng.pickWeighted(learningSources, sourceWeights);
        const attributed = rng.bool(0.5);
        const title = rng.pick(LEARNING_TITLES);
        logTitles.push(title);
        learningLogs.push({
          id: rng.uuid(),
          reportId: report.id,
          learningCategoryId: rng.pick(learningCategories).id,
          learningSourceId: source.id,
          projectId: attributed ? internship.projectId : null,
          title,
          difficulty: rng.int(1, 5),
          confidence: clamp(Math.round(2.5 + g * 2 + rng.int(-1, 1)), 1, 5),
          impact: clamp(Math.round(3 + g + rng.int(-1, 1)), 1, 5),
          applied: rng.bool(0.45 + g * 0.3),
          createdAt: endTs,
          updatedAt: endTs,
          deletedAt: null,
        });
      }

      // AI-extracted learning signal (deterministic stub for the seed).
      const corpus = [report.achievement, report.challenge, ...logTitles]
        .filter((s): s is string => Boolean(s))
        .join("\n\n");
      intelligence.push({
        reportId: report.id,
        data: stubExtract(corpus),
      });
    });

    // Every report except the most recent is marked reviewed (leaves the
    // latest "needs review"). Older reports also carry legacy mentor feedback.
    internReports.slice(0, -1).forEach((report, idx) => {
      const g = idx / Math.max(1, internReports.length - 2);
      report.reviewedAt = `${report.endDate}T20:00:00.000Z`;
      feedback.push({
        id: rng.uuid(),
        reportId: report.id,
        mentorId,
        feedback:
          "Strong progress this week — your reflections are getting sharper. Keep documenting the why behind your decisions.",
        nextGoal: rng.pick([
          "Lead a section of the next design review.",
          "Ship one improvement end-to-end without a checkpoint.",
          "Run a short usability test and share findings.",
          "Tighten your handoff specs.",
        ]),
        rating: clamp(Math.round(3 + g * 2 + rng.int(-1, 0)), 1, 5),
        createdAt: `${report.endDate}T20:00:00.000Z`,
        updatedAt: `${report.endDate}T20:00:00.000Z`,
        deletedAt: null,
      });
    });
  }

  return {
    users,
    departments,
    teams,
    cohorts,
    projects,
    skillCategories,
    skills,
    learningCategories,
    learningSources,
    internships,
    reports,
    skillScores,
    learningLogs,
    feedback,
    intelligence,
    mentorAssignments,
    currentUserId: interns[0]!.id,
  };
}
