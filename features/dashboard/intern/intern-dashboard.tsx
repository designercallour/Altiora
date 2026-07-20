import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  NotebookPen,
  Sparkles,
  UserRound,
} from "lucide-react";
import { getDataSource } from "@/services";
import { weekRange } from "@/lib/week";
import { internshipLifecycle } from "@/lib/internship";
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
import {
  metricTrend,
  reportAverages,
  skillFrequency,
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

  const [details, mentor] = await Promise.all([
    db.listReportDetails({ internshipId: internship.id }),
    internship.mentorId
      ? db.getUserById(internship.mentorId)
      : Promise.resolve(null),
  ]);
  const life = internshipLifecycle(internship, now);

  const submitted = submittedAsc(details);
  const cw = weekRange(now);
  const current = details.find(
    (r) => r.year === cw.year && r.weekNumber === cw.week,
  );
  const reflectedThisWeek = current?.status === "submitted";

  const averages = reportAverages(details);
  const learnings = totalLearnings(details);

  const moodTrend = metricTrend(details, "mood");
  const moodMeta = moodLevel(
    averages.mood != null ? Math.round(averages.mood) : null,
  );

  const bySkill = skillFrequency(details).slice(0, 6);

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
            reflectedThisWeek && current ? (
              <LinkButton href={ROUTES.report(current.id)} variant="outline">
                <NotebookPen />
                View this week
              </LinkButton>
            ) : undefined
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

      {/* Internship period */}
      <Reveal delay={0.05}>
        <Card className="mt-6">
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="bg-muted text-muted-foreground flex size-8 items-center justify-center rounded-lg">
                  <CalendarClock className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-medium">
                    {internship.position ?? "Your internship"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {formatDate(internship.startDate)} –{" "}
                    {internship.endDate
                      ? formatDate(internship.endDate)
                      : "open"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold tabular-nums">
                  {life.weeksRemaining != null
                    ? `${life.weeksRemaining} week${life.weeksRemaining === 1 ? "" : "s"}`
                    : "—"}
                </p>
                <p className="text-muted-foreground text-xs">remaining</p>
              </div>
            </div>
            <div
              className="bg-muted h-2 w-full overflow-hidden rounded-full"
              role="progressbar"
              aria-valuenow={Math.round(life.progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Internship progress"
            >
              <div
                className="bg-primary h-full rounded-full transition-all"
                style={{ width: `${Math.round(life.progress * 100)}%` }}
              />
            </div>
            {mentor ? (
              <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
                <UserRound className="size-3.5" />
                Mentored by{" "}
                <span className="text-foreground font-medium">
                  {mentor.fullName}
                </span>
              </p>
            ) : null}
          </CardContent>
        </Card>
      </Reveal>

      {/* Stats */}
      <Stagger className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
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
            label="Avg. mood"
            value={
              averages.mood != null && moodMeta
                ? `${moodMeta.emoji} ${moodMeta.label}`
                : "—"
            }
            icon={Sparkles}
            hint={
              averages.mood != null
                ? `${round1(averages.mood)} / 6 · across your weeks`
                : "Across your weeks"
            }
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
                your mood trend and the learnings you capture — a living picture
                of how you&rsquo;re growing.
              </p>
            </InsightCard>
          </div>
        </Reveal>
      ) : (
        <>
          {/* Growth charts */}
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
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
                    mood
                  />
                </CardContent>
              </Card>
            </Reveal>
            <Reveal delay={0.1}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>What you&rsquo;re learning</CardTitle>
                  <p className="text-muted-foreground text-sm">
                    Skills Altiora detected in your reflections
                  </p>
                </CardHeader>
                <CardContent>
                  <BarList
                    items={bySkill}
                    emptyLabel="Skills appear as you reflect"
                  />
                </CardContent>
              </Card>
            </Reveal>
          </div>
        </>
      )}

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
                        {r.learningLogs.length} learnings
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
