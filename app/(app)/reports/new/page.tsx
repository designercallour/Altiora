import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NotebookPen } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getDataSource } from "@/services";
import { weekRange, formatWeekLabel } from "@/lib/week";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ReportWizard } from "@/features/weekly-report/components/report-wizard";
import {
  defaultFormValues,
  formValuesFromReport,
} from "@/features/weekly-report/form-values";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = { title: "New Weekly Report" };

export default async function NewReportPage() {
  const db = getDataSource();
  const user = await getCurrentUser();
  const internship = user ? await db.getActiveInternshipForUser(user.id) : null;

  if (!internship) {
    return (
      <PageContainer size="narrow">
        <PageHeader
          title="Weekly Report"
          description="Weekly reflections are written by interns."
        />
        <div className="mt-8">
          <EmptyState
            icon={NotebookPen}
            title="No active internship"
            description="Weekly reports belong to an active internship. Mentors and admins review reflections from the dashboard instead."
          />
        </div>
      </PageContainer>
    );
  }

  const now = new Date();
  const range = weekRange(now);
  const lookups = await db.getLookups();
  const skillIds = lookups.skills.map((s) => s.id);

  const existing = await db.getReportByWeek(
    internship.id,
    range.year,
    range.week,
  );

  // Already submitted this week → send them to the read-only view.
  if (existing && existing.status === "submitted") {
    redirect(ROUTES.report(existing.id));
  }

  // Seed a brand-new report's skill ratings from last week for continuity.
  let priorScores: Map<string, number> | undefined;
  if (!existing) {
    const [previous] = await db.listReportDetails({
      internshipId: internship.id,
      status: "submitted",
      limit: 1,
    });
    if (previous) {
      priorScores = new Map(
        previous.skillScores.map((s) => [s.skillId, s.score]),
      );
    }
  }

  const initialValues = existing
    ? formValuesFromReport(existing, skillIds)
    : defaultFormValues(skillIds, priorScores);

  return (
    <ReportWizard
      reportId={existing?.id ?? null}
      internshipId={internship.id}
      week={{
        year: range.year,
        weekNumber: range.week,
        startDate: range.startDate,
        endDate: range.endDate,
        label: formatWeekLabel(range),
      }}
      initialValues={initialValues}
      skills={lookups.skills.map((s) => ({ id: s.id, name: s.name }))}
      categories={lookups.learningCategories.map((c) => ({
        id: c.id,
        name: c.name,
      }))}
      sources={lookups.learningSources.map((s) => ({
        id: s.id,
        name: s.name,
      }))}
      projects={lookups.projects.map((p) => ({ id: p.id, name: p.name }))}
    />
  );
}
