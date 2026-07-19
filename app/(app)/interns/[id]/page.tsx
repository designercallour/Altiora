import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CircleCheck,
  Clock,
  NotebookPen,
  Sparkles,
} from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getDataSource } from "@/services";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { SectionHeader } from "@/components/shared/section-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/shared/link-button";
import { BarList } from "@/components/shared/bar-list";
import { TrendChart } from "@/components/charts/trend-chart";
import { Reveal, Stagger, StaggerItem } from "@/components/shared/motion";
import { moodLevel } from "@/lib/domain";
import { formatDate, round1 } from "@/lib/format";
import { ROUTES } from "@/lib/constants";
import {
  metricTrend,
  reportAverages,
  skillFrequency,
  submittedAsc,
  totalLearnings,
} from "@/lib/insights";

export const metadata: Metadata = { title: "Intern overview" };

export default async function InternProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = getDataSource();
  const [user, internship] = await Promise.all([
    getCurrentUser(),
    db.getInternshipById(id),
  ]);
  if (!internship || !user) notFound();

  // Only the intern themself, their mentor, or an admin may view this.
  const allowed =
    user.role === "admin" ||
    internship.mentorId === user.id ||
    internship.userId === user.id;
  if (!allowed) notFound();

  const [intern, details, lookups] = await Promise.all([
    db.getUserById(internship.userId),
    db.listReportDetails({ internshipId: id }),
    db.getLookups(),
  ]);

  const cohort = lookups.cohorts.find((c) => c.id === internship.cohortId);
  const department = lookups.departments.find(
    (d) => d.id === internship.departmentId,
  );

  const submitted = submittedAsc(details);
  const timeline = [...submitted].reverse(); // newest week first
  const averages = reportAverages(details);
  const moodTrend = metricTrend(details, "mood");
  const bySkill = skillFrequency(details).slice(0, 8);
  const moodMeta = moodLevel(
    averages.mood != null ? Math.round(averages.mood) : null,
  );

  const name = intern?.fullName ?? "Intern";

  return (
    <PageContainer>
      <Reveal>
        <PageHeader
          eyebrow={
            [cohort?.name, department?.name].filter(Boolean).join(" · ") ||
            "Intern"
          }
          title={name}
          description={`${submitted.length} weekly ${submitted.length === 1 ? "reflection" : "reflections"} across the internship.`}
          actions={
            <LinkButton href={ROUTES.dashboard} variant="ghost" size="sm">
              <ArrowLeft />
              Back
            </LinkButton>
          }
        />
      </Reveal>

      {submitted.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={NotebookPen}
            title="No reflections yet"
            description={`${name} hasn't submitted a weekly report yet. Their growth story will appear here once they do.`}
          />
        </div>
      ) : (
        <>
          {/* Overview */}
          <Stagger className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
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
                label="Avg. mood"
                value={
                  averages.mood != null && moodMeta
                    ? `${moodMeta.emoji} ${moodMeta.label}`
                    : "—"
                }
                icon={Sparkles}
                hint={
                  averages.mood != null
                    ? `${round1(averages.mood)} / 6 · across weeks`
                    : "Across weeks"
                }
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label="Learnings"
                value={totalLearnings(details)}
                icon={BookOpen}
                hint="Captured across weeks"
              />
            </StaggerItem>
          </Stagger>

          {/* Trends */}
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
                  <CardTitle>Skills detected</CardTitle>
                  <p className="text-muted-foreground text-sm">
                    Across all of {name.split(" ")[0]}&rsquo;s reflections
                  </p>
                </CardHeader>
                <CardContent>
                  <BarList items={bySkill} emptyLabel="No skills detected yet" />
                </CardContent>
              </Card>
            </Reveal>
          </div>

          {/* All weeks */}
          <section className="mt-10 space-y-4">
            <SectionHeader
              title="Every week"
              description="All submitted reflections, most recent first"
              icon={NotebookPen}
            />
            <ul className="space-y-2">
              {timeline.map((r) => {
                const mood = moodLevel(r.mood);
                const reviewed = r.reviewedAt != null;
                return (
                  <li key={r.id}>
                    <Link
                      href={ROUTES.report(r.id)}
                      className="group border-border bg-card hover:border-primary/30 focus-visible:ring-ring/50 flex items-center gap-4 rounded-xl border p-4 transition-colors outline-none focus-visible:ring-2"
                    >
                      <div className="w-16 shrink-0">
                        <p className="text-sm font-semibold tabular-nums">
                          Week {r.weekNumber}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {formatDate(r.startDate)}
                        </p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-muted-foreground truncate text-xs">
                          {r.learningLogs.length}{" "}
                          {r.learningLogs.length === 1
                            ? "learning"
                            : "learnings"}
                          {r.intelligence?.skills.length
                            ? ` · ${r.intelligence.skills
                                .slice(0, 3)
                                .map((s) => s.name)
                                .join(", ")}`
                            : ""}
                        </p>
                      </div>
                      {mood ? (
                        <span className="text-xl" title={mood.label}>
                          {mood.emoji}
                        </span>
                      ) : null}
                      <Badge
                        variant={reviewed ? "secondary" : "default"}
                        className="gap-1"
                      >
                        {reviewed ? (
                          <>
                            <CircleCheck className="size-3" />
                            Reviewed
                          </>
                        ) : (
                          <>
                            <Clock className="size-3" />
                            Awaiting review
                          </>
                        )}
                      </Badge>
                      <ArrowRight className="text-muted-foreground size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}
    </PageContainer>
  );
}
