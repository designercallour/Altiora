import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getDataSource } from "@/services";
import { formatWeekLabel } from "@/lib/week";
import { ReportWizard } from "@/features/weekly-report/components/report-wizard";
import { formValuesFromReport } from "@/features/weekly-report/form-values";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = { title: "Edit Weekly Report" };

export default async function EditReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = getDataSource();
  const [user, report] = await Promise.all([
    getCurrentUser(),
    db.getReportById(id),
  ]);
  if (!report) notFound();

  const internship = await db.getInternshipById(report.internshipId);
  if (!internship || !user || internship.userId !== user.id) notFound();

  // Only drafts are editable; submitted reports are read-only.
  if (report.status === "submitted") redirect(ROUTES.report(id));

  const lookups = await db.getLookups();
  const skillIds = lookups.skills.map((s) => s.id);

  return (
    <ReportWizard
      reportId={report.id}
      internshipId={internship.id}
      week={{
        year: report.year,
        weekNumber: report.weekNumber,
        startDate: report.startDate,
        endDate: report.endDate,
        label: formatWeekLabel({
          year: report.year,
          week: report.weekNumber,
          startDate: report.startDate,
          endDate: report.endDate,
        }),
      }}
      initialValues={formValuesFromReport(report, skillIds)}
      skills={lookups.skills.map((s) => ({ id: s.id, name: s.name }))}
      categories={lookups.learningCategories.map((c) => ({
        id: c.id,
        name: c.name,
      }))}
      sources={lookups.learningSources.map((s) => ({ id: s.id, name: s.name }))}
      projects={lookups.projects.map((p) => ({ id: p.id, name: p.name }))}
    />
  );
}
