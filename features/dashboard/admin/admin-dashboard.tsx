import { BookOpen, CheckCircle2, Sparkles, Users } from "lucide-react";
import { getDataSource } from "@/services";
import { weekRangeFrom } from "@/lib/week";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { SectionHeader } from "@/components/shared/section-header";
import { StatCard } from "@/components/shared/stat-card";
import { BarList } from "@/components/shared/bar-list";
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
import { round1 } from "@/lib/format";
import { ROUTES } from "@/lib/constants";
import type { AppUser } from "@/types/domain";

export async function AdminDashboard({ user: _user }: { user: AppUser }) {
  const db = getDataSource();
  const [interns, details, internships] = await Promise.all([
    db.listInterns(),
    db.listReportDetails({}),
    db.listInternships(),
  ]);

  const submitted = submittedAsc(details);

  // Reflection rate for the last *completed* week among active internships.
  // (The current week is deliberately excluded — it's still in progress, so
  // counting it would understate a healthy program.)
  const lastWeek = weekRangeFrom(new Date(), -1);
  const activeInternshipIds = new Set(
    internships.filter((i) => i.status === "active").map((i) => i.id),
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

  const avgMood = average(submitted.map((d) => d.mood));

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

  const moodMeta = moodLevel(avgMood != null ? Math.round(avgMood) : null);

  return (
    <PageContainer size="wide">
      <Reveal>
        <PageHeader
          eyebrow="Organization"
          title="Internship intelligence"
          description="How the program is doing — where interns are growing and what's driving learning."
        />
      </Reveal>

      <Stagger className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StaggerItem>
          <StatCard
            label="Interns"
            value={interns.length}
            icon={Users}
            hint="Across the program"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Reflection rate"
            value={`${completion}%`}
            icon={CheckCircle2}
            hint="Active interns, last week"
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
              avgMood != null
                ? `${round1(avgMood)} / 6 · all reflections`
                : "Across all reflections"
            }
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Learnings captured"
            value={totalLearnings(details)}
            icon={BookOpen}
            hint="Across all reflections"
          />
        </StaggerItem>
      </Stagger>

      <div className="mt-6">
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
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Reveal delay={0.05}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Top skills</CardTitle>
              <p className="text-muted-foreground text-sm">
                Detected by Altiora across all reflections
              </p>
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
              <p className="text-muted-foreground text-sm">
                Specific tools & techniques interns are picking up
              </p>
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

      {/* Interns roster */}
      <section className="mt-10 space-y-4">
        <SectionHeader
          title="Interns"
          description="Open anyone to see their full week-by-week history"
          icon={Users}
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
