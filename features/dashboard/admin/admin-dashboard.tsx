import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Hourglass,
  Sparkles,
  TriangleAlert,
  UserPlus,
  Users,
  UsersRound,
} from "lucide-react";
import { getDataSource } from "@/services";
import { weekRangeFrom } from "@/lib/week";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { SectionHeader } from "@/components/shared/section-header";
import { StatCard } from "@/components/shared/stat-card";
import { BarList } from "@/components/shared/bar-list";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusChip } from "@/components/shared/status-chip";
import { Reveal, Stagger, StaggerItem } from "@/components/shared/motion";
import { TrendChart } from "@/components/charts/trend-chart";
import { InternRow } from "../intern-row";
import {
  average,
  conceptFrequency,
  skillFrequency,
  submittedAsc,
  totalLearnings,
} from "@/lib/insights";
import { moodLevel } from "@/lib/domain";
import { round1, formatRelative } from "@/lib/format";
import { internshipStatus, endsWithinDays } from "@/lib/internship";
import { ROUTES } from "@/lib/constants";
import type { AppUser, InternSummary } from "@/types/domain";

export async function AdminDashboard({ user: _user }: { user: AppUser }) {
  const db = getDataSource();
  const [interns, details, mentors] = await Promise.all([
    db.listInterns(),
    db.listReportDetails({}),
    db.listMentors(),
  ]);

  const submitted = submittedAsc(details);

  // ── Operational metrics (computed status is the source of truth) ──────────
  const activeInterns = interns.filter(
    (s) => s.internship && internshipStatus(s.internship) === "active",
  );
  const inactiveCount = interns.length - activeInterns.length;
  const activeMentors = mentors.filter((m) => m.activeInternCount > 0);
  const avgPerMentor =
    activeMentors.length > 0
      ? round1(activeInterns.length / activeMentors.length)
      : 0;

  const endingSoon = activeInterns.filter(
    (s) => s.internship && endsWithinDays(s.internship, 7),
  );

  const now = new Date();
  const nowMs = now.getTime();
  const recentlyAdded = [...interns]
    .filter((s) => s.internship)
    .sort((a, b) =>
      (b.internship!.createdAt ?? "").localeCompare(
        a.internship!.createdAt ?? "",
      ),
    )
    .slice(0, 5)
    .filter(
      (s) =>
        nowMs - new Date(s.internship!.createdAt).getTime() < 21 * 86_400_000,
    );

  // Reflection rate for the last *completed* week among active internships.
  const lastWeek = weekRangeFrom(now, -1);
  const activeInternshipIds = new Set(
    activeInterns.map((s) => s.internship!.id),
  );
  const reflectedLastWeek = new Set(
    submitted
      .filter(
        (d) =>
          d.year === lastWeek.year &&
          d.weekNumber === lastWeek.week &&
          activeInternshipIds.has(d.internshipId),
      )
      .map((d) => d.internshipId),
  );
  const completion = activeInternshipIds.size
    ? Math.round((reflectedLastWeek.size / activeInternshipIds.size) * 100)
    : 0;

  // Low engagement: active interns who missed last week's reflection.
  const lowEngagement: InternSummary[] = activeInterns.filter(
    (s) => !reflectedLastWeek.has(s.internship!.id),
  );

  const avgMood = average(submitted.map((d) => d.mood));
  const moodMeta = moodLevel(avgMood != null ? Math.round(avgMood) : null);

  // Mentor workload, biggest first.
  const workload = mentors
    .map((m) => ({ label: m.user.fullName, value: m.activeInternCount }))
    .filter((w) => w.value > 0)
    .sort((a, b) => b.value - a.value);

  // AI-extracted skills + concepts across the program.
  const topSkills = skillFrequency(details).slice(0, 8);
  const topConcepts = conceptFrequency(details).slice(0, 8);

  // Org mood trend (avg by ISO week number).
  const byWeek = new Map<number, number[]>();
  for (const d of submitted)
    if (d.mood != null) {
      const arr = byWeek.get(d.weekNumber) ?? [];
      arr.push(d.mood);
      byWeek.set(d.weekNumber, arr);
    }
  const moodTrend = [...byWeek]
    .sort((a, b) => a[0] - b[0])
    .map(([w, vals]) => ({
      label: `W${w}`,
      value: round1(average(vals) ?? 0),
    }));

  return (
    <PageContainer size="wide">
      <Reveal>
        <PageHeader
          eyebrow="Organization"
          title="Program overview"
          description="How the internship program is running — who's active, where mentors are stretched, and how interns are growing."
        />
      </Reveal>

      {/* Operational health */}
      <Stagger className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StaggerItem>
          <StatCard
            label="Active interns"
            value={activeInterns.length}
            icon={Users}
            hint={`${inactiveCount} inactive`}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Active mentors"
            value={activeMentors.length}
            icon={UsersRound}
            hint={`of ${mentors.length} total`}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Interns / mentor"
            value={avgPerMentor || "—"}
            icon={UsersRound}
            hint="Average active load"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Ending in 7 days"
            value={endingSoon.length}
            icon={Hourglass}
            hint="Wrapping up soon"
          />
        </StaggerItem>
      </Stagger>

      <Stagger className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StaggerItem>
          <StatCard
            label="Reflection rate"
            value={`${completion}%`}
            icon={CheckCircle2}
            hint={`Active interns · week ${lastWeek.week}`}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Needs attention"
            value={lowEngagement.length}
            icon={TriangleAlert}
            hint="Missed last week"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Avg. mood"
            value={
              avgMood != null && moodMeta
                ? `${moodMeta.emoji} ${moodMeta.label}`
                : "—"
            }
            icon={Sparkles}
            hint={
              avgMood != null ? `${round1(avgMood)} / 6` : "Across reflections"
            }
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Learnings"
            value={totalLearnings(details)}
            icon={BookOpen}
            hint="Captured program-wide"
          />
        </StaggerItem>
      </Stagger>

      {/* Attention + workload */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Reveal delay={0.05}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TriangleAlert className="text-muted-foreground size-4" />
                Needs attention
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                Active interns who didn&rsquo;t reflect last week
              </p>
            </CardHeader>
            <CardContent>
              {lowEngagement.length === 0 ? (
                <EmptyState
                  variant="plain"
                  icon={CheckCircle2}
                  title="Everyone's on track"
                  description="Every active intern reflected last week."
                />
              ) : (
                <ul className="space-y-2">
                  {lowEngagement.slice(0, 6).map((s) => (
                    <InternRow
                      key={s.user.id}
                      summary={s}
                      href={
                        s.internship
                          ? ROUTES.intern(s.internship.id)
                          : ROUTES.dashboard
                      }
                    />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </Reveal>
        <Reveal delay={0.1}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UsersRound className="text-muted-foreground size-4" />
                Mentor workload
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                Active interns per mentor
              </p>
            </CardHeader>
            <CardContent>
              <BarList items={workload} emptyLabel="No active assignments" />
            </CardContent>
          </Card>
        </Reveal>
      </div>

      {/* Ending soon + recently added */}
      {endingSoon.length > 0 || recentlyAdded.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {endingSoon.length > 0 ? (
            <Reveal delay={0.05}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Hourglass className="text-muted-foreground size-4" />
                    Wrapping up soon
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {endingSoon.map((s) => (
                      <InternRow
                        key={s.user.id}
                        summary={s}
                        href={
                          s.internship
                            ? ROUTES.intern(s.internship.id)
                            : ROUTES.dashboard
                        }
                      />
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </Reveal>
          ) : null}
          {recentlyAdded.length > 0 ? (
            <Reveal delay={0.1}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="text-muted-foreground size-4" />
                    Recently added
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {recentlyAdded.map((s) => (
                      <li key={s.user.id}>
                        <Link
                          href={
                            s.internship
                              ? ROUTES.intern(s.internship.id)
                              : ROUTES.adminInterns
                          }
                          className="group hover:bg-muted/40 flex items-center gap-3 rounded-lg p-2 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {s.user.fullName}
                            </p>
                            <p className="text-muted-foreground truncate text-xs">
                              Added {formatRelative(s.internship!.createdAt)}
                            </p>
                          </div>
                          <StatusChip internship={s.internship} />
                          <ArrowRight className="text-muted-foreground size-4 shrink-0" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </Reveal>
          ) : null}
        </div>
      ) : null}

      {/* Learning intelligence */}
      <section className="mt-10 space-y-4">
        <SectionHeader
          title="Learning intelligence"
          description="What Altiora detects across every reflection"
          icon={Sparkles}
        />
        <Reveal delay={0.05}>
          <Card>
            <CardHeader>
              <CardTitle>Mood across the program</CardTitle>
            </CardHeader>
            <CardContent>
              <TrendChart data={moodTrend} yDomain={[1, 6]} mood />
            </CardContent>
          </Card>
        </Reveal>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Reveal delay={0.05}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Top skills</CardTitle>
              </CardHeader>
              <CardContent>
                <BarList items={topSkills} emptyLabel="No skills detected yet" />
              </CardContent>
            </Card>
          </Reveal>
          <Reveal delay={0.1}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Emerging concepts</CardTitle>
              </CardHeader>
              <CardContent>
                <BarList
                  items={topConcepts}
                  emptyLabel="No concepts detected yet"
                />
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* Roster */}
      <section className="mt-10 space-y-4">
        <SectionHeader
          title="All interns"
          description="Open anyone to manage them or see their history"
          icon={Users}
          action={
            <Link
              href={ROUTES.adminInterns}
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              Manage
            </Link>
          }
        />
        <ul className="space-y-2">
          {interns.map((s) => (
            <InternRow
              key={s.user.id}
              summary={s}
              href={
                s.internship ? ROUTES.intern(s.internship.id) : ROUTES.dashboard
              }
            />
          ))}
        </ul>
      </section>
    </PageContainer>
  );
}
