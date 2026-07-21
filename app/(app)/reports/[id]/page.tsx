import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Pencil, NotebookText } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getDataSource } from "@/services";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/shared/link-button";
import { Reveal } from "@/components/shared/motion";
import { ReportView } from "@/features/reports/components/report-view";
import { MentorReviewPanel } from "@/features/reports/components/mentor-review-panel";
import { ReportSuccess } from "@/features/weekly-report/components/report-success";
import { REPORT_STATUS_LABELS } from "@/lib/domain";
import { formatDate } from "@/lib/format";
import { formatInternshipWeekLabel, internshipWeekNumber } from "@/lib/week";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = { title: "Weekly Report" };

export default async function ReportDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ celebrate?: string }>;
}) {
  const { id } = await params;
  const { celebrate } = await searchParams;
  const db = getDataSource();
  const [user, report] = await Promise.all([
    getCurrentUser(),
    db.getReportById(id),
  ]);
  if (!report) notFound();

  const internship = await db.getInternshipById(report.internshipId);
  if (!internship || !user) notFound();

  const isOwner = internship.userId === user.id;
  const isMentor = internship.mentorId === user.id;
  const allowed = user.role === "admin" || isOwner || isMentor;
  if (!allowed) notFound();

  const canReview =
    !isOwner &&
    (isMentor || user.role === "admin") &&
    report.status === "submitted";

  // One-time celebration right after submitting.
  if (celebrate === "1" && isOwner) {
    return (
      <ReportSuccess
        reportId={report.id}
        weekLabel={formatInternshipWeekLabel(internship.startDate, {
          year: report.year,
          week: report.weekNumber,
          startDate: report.startDate,
          endDate: report.endDate,
        })}
      />
    );
  }

  const [lookups, intern] = await Promise.all([
    db.getLookups(),
    db.getUserById(internship.userId),
  ]);

  const isDraft = report.status === "draft";

  return (
    <PageContainer size="narrow">
      <Reveal>
        <PageHeader
          eyebrow={
            isOwner ? "Your reflection" : `${intern?.fullName}'s reflection`
          }
          title={`Week ${internshipWeekNumber(internship.startDate, report.year, report.weekNumber)} · ${report.year}`}
          description={`${formatDate(report.startDate)} – ${formatDate(report.endDate)}`}
          actions={
            <div className="flex items-center gap-2">
              <Badge variant={isDraft ? "outline" : "secondary"}>
                {REPORT_STATUS_LABELS[report.status]}
              </Badge>
              {!isOwner ? (
                <LinkButton
                  href={ROUTES.intern(internship.id)}
                  variant="outline"
                  size="sm"
                >
                  <NotebookText />
                  All weeks
                </LinkButton>
              ) : null}
              {isDraft && isOwner ? (
                <LinkButton href={ROUTES.editReport(report.id)} size="sm">
                  <Pencil />
                  Continue editing
                </LinkButton>
              ) : null}
            </div>
          }
        />
      </Reveal>
      <Reveal delay={0.05}>
        <div className="mt-8 space-y-6">
          <ReportView report={report} lookups={lookups} showFeedback />
          {canReview ? (
            <MentorReviewPanel
              reportId={report.id}
              internName={intern?.fullName ?? "your intern"}
              reviewedAt={report.reviewedAt}
            />
          ) : null}
        </div>
      </Reveal>
    </PageContainer>
  );
}
