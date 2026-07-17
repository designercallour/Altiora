import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowRight,
  BookOpen,
  Flame,
  NotebookPen,
  Sparkles,
  MessageSquareQuote,
  TrendingUp,
} from "lucide-react";
import { getDataSource } from "@/services";
import { weekRange } from "@/lib/week";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { SectionHeader } from "@/components/shared/section-header";
import { StatCard } from "@/components/shared/stat-card";
import { InsightCard } from "@/components/shared/insight-card";
import { EmptyState } from "@/components/shared/empty-state";
import { BarList } from "@/components/shared/bar-list";
import { LinkButton } from "@/components/shared/link-button";
import { Reveal, Stagger, StaggerItem } from "@/components/shared/motion";
import { TrendChart } from "@/components/charts/trend-chart";
import { SkillRadar } from "@/components/charts/skill-radar";
import {
  computeStreak,
  countBy,
  latestSkillScores,
  metricTrend,
  reportAverages,
  submittedAsc,
  totalLearnings,
} from "@/lib/insights";
import { moodLevel } from "@/lib/domain";
import { formatDate, round1 } from "@/lib/format";
import { ROUTES } from "@/lib/constants";
import type { AppUser } from "@/types/domain";

function greeting(d: Date): string {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export async function InternDashboard({ user }: { user: AppUser }) {
  const db = getDataSource();
  const now = new Date();
  const firstName = user.fullName.split(" ")[0] ?? "there";
  const internship = await db.getActiveInternshipForUser(user.id);

  if (!internship) {
    return (
      <PageContainer>
        <PageHeader
          eyebrow={format(now, "EEEE, MMMM d")}
          title={`${greeting(now)}, ${firstName}`}
        />
        <div className="mt-8">
          <EmptyState
            icon={Sparkles}
            title="No active internship yet"
            description="Your growth workspace will come alive here once your internship begins."
          />
        </div>
      </PageContainer>
    );
  }

  const [details, lookups] = await Promise.all([
    db.listReportDetails({ internshipId: internship.id }),
    db.getLookups(),
  ]);

  const submitted = submittedAsc(details);
  const cw = weekRange(now);
  const current = details.find(
    (r) => r.year === cw.year && r.weekNumber === cw.week,
  );
  const reflectedThisWeek = current?.status === "submitted";

  const streak = computeStreak(details);
  const averages = reportAverages(details);
  const learnings = totalLearnings(details);

  const confidenceTrend = metricTrend(details, "confidence");
  const moodTrend = metricTrend(details, "mood");
  const latest = latestSkillScores(details);
  const radar = lookups.skills
    .filter((s) => latest.has(s.id))
    .map((s) => ({ skill: s.name, value: latest.get(s.id) ?? 0 }));

  const catNameById = new Map(
    lookups.learningCategories.map((c) => [c.id, c.name]),
  );
  const allLogs = submitted.flatMap((d) => d.learningLogs);
  const byCategory = [...countBy(allLogs, (l) => l.learningCategoryId)]
    .map(([id, value]) => ({ label: catNameById.get(id) ?? "Other", value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const feedbackReport = [...submitted]
    .reverse()
    .find((d) => d.feedback?.feedback);
  const recent = [...submitted].reverse().slice(0, 4);

  return (
    <PageContainer>
      <Reveal>
        <PageHeader
          eyebrow={format(now, "EEEE, MMMM d")}
          title={`${greeting(now)}, ${firstName}`}
          description={
            reflectedThisWeek
              ? "You've reflected this week. Here's how your growth is shaping up."
              : "A calm space to reflect on your week and watch your growth take shape."
          }
          actions={
            <LinkButton
              href={
                reflectedThisWeek && current
                  ? ROUTES.report(current.id)
                  : ROUTES.newReport
              }
              variant={reflectedThisWeek ? "outline" : "default"}
            >
              <NotebookPen />
              {reflectedThisWeek ? "View this week" : "Start weekly report"}
            </LinkButton>
          }
        />
      </Reveal>

      {/* This-week nudge */}
      {!reflectedThisWeek ? (
        <Reveal delay={0.04}>
          <Card className="border-primary/30 bg-primary/[0.03] mt-8">
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                  <NotebookPen className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-medium">
                    {current
                      ? "Your reflection is in progress"
                      : "Time for this week's reflection"}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Week {cw.week} · a few quiet minutes is all it takes.
                  </p>
                </div>
              </div>
              <LinkButton href={ROUTES.newReport} className="sm:shrink-0">
                {current ? "Continue" : "Start"}
                <ArrowRight />
              </LinkButton>
            </CardContent>
          </Card>
        </Reveal>
      ) : null}

      {/* Stats */}
      <Stagger className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StaggerItem>
          <StatCard
            label="Current streak"
            value={streak > 0 ? `${streak} wk` : "—"}
            icon={Flame}
            hint={streak > 0 ? "Consecutive weeks" : "Reflect to begin"}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Reflections"
            value={submitted.length}
            icon={NotebookPen}
            hint="Submitted this internship"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Learnings"
            value={learnings}
            icon={BookOpen}
            hint="Captured across weeks"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Avg. confidence"
            value={
              averages.confidence != null ? round1(averages.confidence) : "—"
            }
            icon={TrendingUp}
            hint="Out of 10"
          />
        </StaggerItem>
      </Stagger>

      {submitted.length === 0 ? (
        <Reveal delay={0.05}>
          <div className="mt-6">
            <InsightCard
              title="Your growth story starts here"
              description="Your internship intelligence platform"
              icon={Sparkles}
              tone="primary"
            >
              <p className="text-muted-foreground">
                Once you submit your first weekly report, this space fills with
                your confidence trend, skill growth, and the learnings you
                capture — a living picture of how you&rsquo;re growing.
              </p>
            </InsightCard>
          </div>
        </Reveal>
      ) : (
        <>
          {/* Growth charts */}
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
            <Reveal delay={0.05} className="lg:col-span-3">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Confidence over time</CardTitle>
                </CardHeader>
                <CardContent>
                  <TrendChart
                    data={confidenceTrend}
                    yDomain={[0, 10]}
                    color="var(--chart-1)"
                  />
                </CardContent>
              </Card>
            </Reveal>
            <Reveal delay={0.1} className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Skill self-assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  <SkillRadar data={radar} />
                </CardContent>
              </Card>
            </Reveal>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Reveal delay={0.05}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Mood through the weeks</CardTitle>
                </CardHeader>
                <CardContent>
                  <TrendChart
                    data={moodTrend}
                    yDomain={[1, 6]}
                    color="var(--chart-3)"
                  />
                </CardContent>
              </Card>
            </Reveal>
            <Reveal delay={0.1}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>What you&rsquo;re learning</CardTitle>
                </CardHeader>
                <CardContent>
                  <BarList items={byCategory} emptyLabel="No learnings yet" />
                </CardContent>
              </Card>
            </Reveal>
          </div>
        </>
      )}

      {/* Mentor feedback */}
      <section className="mt-10 space-y-4">
        <SectionHeader
          title="Latest mentor feedback"
          icon={MessageSquareQuote}
        />
        {feedbackReport?.feedback ? (
          <InsightCard
            title="From your mentor"
            description={`On Week ${feedbackReport.weekNumber}`}
            icon={MessageSquareQuote}
            tone="primary"
            footer={
              <Link
                href={ROUTES.report(feedbackReport.id)}
                className="text-primary hover:underline"
              >
                View the full reflection →
              </Link>
            }
          >
            <p className="text-muted-foreground">
              {feedbackReport.feedback.feedback}
            </p>
            {feedbackReport.feedback.nextGoal ? (
              <p className="mt-3">
                <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Next goal
                </span>
                <br />
                {feedbackReport.feedback.nextGoal}
              </p>
            ) : null}
          </InsightCard>
        ) : (
          <EmptyState
            icon={MessageSquareQuote}
            title="No feedback yet"
            description="When your mentor reviews a report, their guidance and next goal appear here."
          />
        )}
      </section>

      {/* Recent reports */}
      {recent.length > 0 ? (
        <section className="mt-10 space-y-4">
          <SectionHeader
            title="Recent reflections"
            icon={NotebookPen}
            action={
              <Link
                href={ROUTES.reports}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                View all
              </Link>
            }
          />
          <ul className="space-y-2">
            {recent.map((r) => {
              const mood = moodLevel(r.mood);
              return (
                <li key={r.id}>
                  <Link
                    href={ROUTES.report(r.id)}
                    className="group border-border bg-card hover:border-primary/30 flex items-center gap-4 rounded-xl border p-4 transition-colors"
                  >
                    <span className="text-2xl">{mood?.emoji ?? "•"}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        Week {r.weekNumber}
                        <span className="text-muted-foreground font-normal">
                          {" "}
                          · {formatDate(r.startDate)}
                        </span>
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {r.learningLogs.length} learnings · confidence{" "}
                        {r.confidence ?? "–"}/10
                      </p>
                    </div>
                    <ArrowRight className="text-muted-foreground size-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </PageContainer>
  );
}
