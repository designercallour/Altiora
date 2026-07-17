import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, NotebookPen, PenLine } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getDataSource } from "@/services";
import { weekRange } from "@/lib/week";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { SectionHeader } from "@/components/shared/section-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Reveal } from "@/components/shared/motion";
import { LinkButton } from "@/components/shared/link-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { moodLevel, REPORT_STATUS_LABELS } from "@/lib/domain";
import { formatDate } from "@/lib/format";
import { ROUTES } from "@/lib/constants";
import type { WeeklyReport } from "@/types/domain";

export const metadata: Metadata = { title: "Weekly Reports" };

export default async function ReportsPage() {
  const db = getDataSource();
  const user = await getCurrentUser();
  const internship = user ? await db.getActiveInternshipForUser(user.id) : null;

  if (!internship) {
    return (
      <PageContainer>
        <PageHeader
          title="Weekly Reports"
          description="Reflections are written by interns. Mentors and admins review them from the dashboard."
        />
        <div className="mt-8">
          <EmptyState
            icon={NotebookPen}
            title="No reflections to show"
            description="You don't have an active internship. Head to your dashboard to see the interns you're supporting."
            action={
              <LinkButton href={ROUTES.dashboard}>Go to dashboard</LinkButton>
            }
          />
        </div>
      </PageContainer>
    );
  }

  const reports = await db.listReports({ internshipId: internship.id });
  const cw = weekRange(new Date());
  const current = reports.find(
    (r) => r.year === cw.year && r.weekNumber === cw.week,
  );
  const history = reports.filter(
    (r) => !(r.year === cw.year && r.weekNumber === cw.week),
  );

  return (
    <PageContainer>
      <Reveal>
        <PageHeader
          title="Weekly Reports"
          description="One reflection each week — your record of growth across the internship."
          actions={
            <LinkButton href={ROUTES.newReport}>
              <NotebookPen />
              {current ? "This week's report" : "New report"}
            </LinkButton>
          }
        />
      </Reveal>

      {/* This week */}
      <Reveal delay={0.04}>
        <Card className="mt-8">
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                <PenLine className="size-5" />
              </span>
              <div>
                <p className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
                  This week · Week {cw.week}
                </p>
                <p className="mt-0.5 text-sm font-medium">
                  {current?.status === "submitted"
                    ? "You've reflected this week"
                    : current?.status === "draft"
                      ? "You have a draft in progress"
                      : "You haven't reflected yet this week"}
                </p>
              </div>
            </div>
            <LinkButton
              href={
                current?.status === "submitted"
                  ? ROUTES.report(current.id)
                  : ROUTES.newReport
              }
              variant={current?.status === "submitted" ? "outline" : "default"}
              className="sm:shrink-0"
            >
              {current?.status === "submitted"
                ? "View reflection"
                : current?.status === "draft"
                  ? "Continue draft"
                  : "Start reflection"}
              <ArrowRight />
            </LinkButton>
          </CardContent>
        </Card>
      </Reveal>

      {/* History */}
      <section className="mt-10 space-y-4">
        <SectionHeader
          title="History"
          description="Your submitted reflections, most recent first"
          icon={NotebookPen}
        />
        {history.length === 0 ? (
          <EmptyState
            icon={NotebookPen}
            title="No past reports yet"
            description="Once you submit reflections, they'll collect here as a timeline of your growth."
          />
        ) : (
          <ul className="space-y-2">
            {history.map((r) => (
              <ReportRow key={r.id} report={r} />
            ))}
          </ul>
        )}
      </section>
    </PageContainer>
  );
}

function ReportRow({ report }: { report: WeeklyReport }) {
  const mood = moodLevel(report.mood);
  return (
    <li>
      <Link
        href={ROUTES.report(report.id)}
        className="group border-border bg-card hover:border-primary/30 focus-visible:ring-ring/50 flex items-center gap-4 rounded-xl border p-4 transition-colors outline-none focus-visible:ring-2"
      >
        <span className="flex size-10 items-center justify-center text-2xl">
          {mood?.emoji ?? "•"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">
            Week {report.weekNumber}
            <span className="text-muted-foreground font-normal">
              {" "}
              · {formatDate(report.startDate)}
            </span>
          </p>
          <p className="text-muted-foreground text-xs">
            Satisfaction {report.satisfaction ?? "–"}/10 · Confidence{" "}
            {report.confidence ?? "–"}/10
          </p>
        </div>
        <Badge variant={report.status === "draft" ? "outline" : "secondary"}>
          {REPORT_STATUS_LABELS[report.status]}
        </Badge>
        <ArrowRight className="text-muted-foreground size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </li>
  );
}
