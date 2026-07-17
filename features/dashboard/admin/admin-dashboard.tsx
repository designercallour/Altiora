import { BookOpen, CheckCircle2, Sparkles, Users } from "lucide-react";
import { getDataSource } from "@/services";
import { weekRangeFrom } from "@/lib/week";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { BarList } from "@/components/shared/bar-list";
import { Reveal, Stagger, StaggerItem } from "@/components/shared/motion";
import { TrendChart } from "@/components/charts/trend-chart";
import {
  average,
  countBy,
  sourceEffectiveness,
  submittedAsc,
  totalLearnings,
} from "@/lib/insights";
import { moodLevel } from "@/lib/domain";
import { round1 } from "@/lib/format";
import type { AppUser } from "@/types/domain";

export async function AdminDashboard({ user: _user }: { user: AppUser }) {
  const db = getDataSource();
  const [interns, details, internships, lookups] = await Promise.all([
    db.listInterns(),
    db.listReportDetails({}),
    db.listInternships(),
    db.getLookups(),
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
  const avgSat = average(submitted.map((d) => d.satisfaction));

  // Top skills (avg score across all reflections).
  const skillVals = new Map<string, number[]>();
  for (const d of submitted)
    for (const s of d.skillScores) {
      const arr = skillVals.get(s.skillId) ?? [];
      arr.push(s.score);
      skillVals.set(s.skillId, arr);
    }
  const topSkills = lookups.skills
    .map((s) => {
      const avg = average(skillVals.get(s.id) ?? []) ?? 0;
      return { label: s.name, value: round1(avg), display: `${round1(avg)}/5` };
    })
    .sort((a, b) => b.value - a.value);

  // Learning by category.
  const catName = new Map(
    lookups.learningCategories.map((c) => [c.id, c.name]),
  );
  const allLogs = submitted.flatMap((d) => d.learningLogs);
  const byCategory = [...countBy(allLogs, (l) => l.learningCategoryId)]
    .map(([id, value]) => ({ label: catName.get(id) ?? "Other", value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Source effectiveness (avg impact).
  const srcName = new Map(lookups.learningSources.map((s) => [s.id, s.name]));
  const sources = [...sourceEffectiveness(details)]
    .map(([id, { count, avgImpact }]) => ({
      label: srcName.get(id) ?? "Other",
      value: round1(avgImpact),
      display: `${round1(avgImpact)}/5 · ${count}`,
    }))
    .sort((a, b) => b.value - a.value);

  // Cohort comparison (avg confidence).
  const cohortOfInternship = new Map(
    internships.map((i) => [i.id, i.cohortId]),
  );
  const cohortConf = new Map<string, number[]>();
  for (const d of submitted) {
    const cohortId = cohortOfInternship.get(d.internshipId);
    if (!cohortId || d.confidence == null) continue;
    const arr = cohortConf.get(cohortId) ?? [];
    arr.push(d.confidence);
    cohortConf.set(cohortId, arr);
  }
  const cohortName = new Map(lookups.cohorts.map((c) => [c.id, c.name]));
  const cohorts = [...cohortConf]
    .map(([id, vals]) => {
      const avg = average(vals) ?? 0;
      return {
        label: cohortName.get(id) ?? "Cohort",
        value: round1(avg),
        display: `${round1(avg)}/10`,
      };
    })
    .sort((a, b) => b.value - a.value);

  // Org confidence trend (avg by ISO week number).
  const byWeek = new Map<number, number[]>();
  for (const d of submitted)
    if (d.confidence != null) {
      const arr = byWeek.get(d.weekNumber) ?? [];
      arr.push(d.confidence);
      byWeek.set(d.weekNumber, arr);
    }
  const confTrend = [...byWeek]
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
          description="How the program is doing — where interns are growing, what's driving learning, and how cohorts compare."
        />
      </Reveal>

      <Stagger className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StaggerItem>
          <StatCard label="Interns" value={interns.length} icon={Users} />
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
              avgMood != null
                ? `${moodMeta?.emoji ?? ""} ${round1(avgMood)}`
                : "—"
            }
            icon={Sparkles}
            hint="Across all reflections"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Learnings captured"
            value={totalLearnings(details)}
            icon={BookOpen}
            hint={`Avg satisfaction ${avgSat != null ? round1(avgSat) : "—"}/10`}
          />
        </StaggerItem>
      </Stagger>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Reveal delay={0.05} className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Confidence across the program</CardTitle>
            </CardHeader>
            <CardContent>
              <TrendChart data={confTrend} yDomain={[0, 10]} />
            </CardContent>
          </Card>
        </Reveal>
        <Reveal delay={0.1} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Cohort comparison</CardTitle>
              <p className="text-muted-foreground text-sm">
                Average confidence by batch
              </p>
            </CardHeader>
            <CardContent>
              <BarList items={cohorts} />
            </CardContent>
          </Card>
        </Reveal>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Reveal delay={0.05}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Strongest skills</CardTitle>
              <p className="text-muted-foreground text-sm">
                Average self-assessment across interns
              </p>
            </CardHeader>
            <CardContent>
              <BarList items={topSkills} />
            </CardContent>
          </Card>
        </Reveal>
        <Reveal delay={0.1}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Most effective sources</CardTitle>
              <p className="text-muted-foreground text-sm">
                By average learning impact
              </p>
            </CardHeader>
            <CardContent>
              <BarList items={sources} />
            </CardContent>
          </Card>
        </Reveal>
        <Reveal delay={0.15}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Where learning happens</CardTitle>
              <p className="text-muted-foreground text-sm">
                Learnings by category
              </p>
            </CardHeader>
            <CardContent>
              <BarList items={byCategory} />
            </CardContent>
          </Card>
        </Reveal>
      </div>
    </PageContainer>
  );
}
