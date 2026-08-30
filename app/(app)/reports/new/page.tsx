import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NotebookPen } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getDataSource } from "@/services";
import {
  weekRangeOf,
  weekKey,
  formatInternshipWeekLabel,
  isWeeklyReflectionOpen,
  currentReflectionWeek,
} from "@/lib/week";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { CalendarClock } from "lucide-react";
import { ReportWizard } from "@/features/weekly-report/components/report-wizard";
import {
  defaultFormValues,
  formValuesFromReport,
} from "@/features/weekly-report/form-values";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = { title: "New Weekly Report" };

export default async function NewReportPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; week?: string }>;
}) {
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
  const current = currentReflectionWeek(now);

  // A `?year&week` override lets an intern file a past-week catch-up (e.g. the
  // one-time Week 29 reflection) — a past week within their internship. Past
  // weeks are always open; the Friday window only gates the current week.
  const y = Number((await searchParams).year);
  const w = Number((await searchParams).week);
  let range = current;
  let isCatchUp = false;
  if (Number.isInteger(y) && Number.isInteger(w) && w >= 1 && w <= 53) {
    const target = weekRangeOf(y, w);
    const isPast =
      weekKey(target.year, target.week) < weekKey(current.year, current.week);
    const withinInternship = target.endDate >= internship.startDate;
    if (isPast && withinInternship) {
      range = target;
      isCatchUp = true;
    }
  }

  // The current week's reflection is an end-of-week ritual: it only opens Friday
  // 09:00 WIB through Sunday. Before then the form is locked (also enforced
  // server-side in the save/submit actions). Catch-up (past) weeks stay open.
  if (!isCatchUp && !isWeeklyReflectionOpen(now)) {
    return (
      <PageContainer size="narrow">
        <PageHeader
          title="Weekly Report"
          description="Your weekly reflection opens at the end of the week."
        />
        <div className="mt-8">
          <EmptyState
            icon={CalendarClock}
            title="This week's reflection isn't open yet"
            description="Weekly reflections open every Friday at 09:00 WIB and stay open through Sunday. Check back then to reflect on your week."
          />
        </div>
      </PageContainer>
    );
  }

  const lookups = await db.getLookups();

  const existing = await db.getReportByWeek(
    internship.id,
    range.year,
    range.week,
  );

  // Already submitted this week → send them to the read-only view.
  if (existing && existing.status === "submitted") {
    redirect(ROUTES.report(existing.id));
  }

  const initialValues = existing
    ? formValuesFromReport(existing)
    : defaultFormValues();

  return (
    <ReportWizard
      reportId={existing?.id ?? null}
      internshipId={internship.id}
      week={{
        year: range.year,
        weekNumber: range.week,
        startDate: range.startDate,
        endDate: range.endDate,
        label: formatInternshipWeekLabel(internship.startDate, range),
      }}
      initialValues={initialValues}
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
