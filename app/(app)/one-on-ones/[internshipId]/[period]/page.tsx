import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  MessagesSquare,
  NotebookText,
} from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getDataSource } from "@/services";
import { parsePeriod, monthLabel, isOneOnOneOpen } from "@/lib/one-on-one";
import { ROUTES } from "@/lib/constants";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionHeader } from "@/components/shared/section-header";
import { LinkButton } from "@/components/shared/link-button";
import { Reveal } from "@/components/shared/motion";
import { Card, CardContent } from "@/components/ui/card";
import { OneOnOneEditor } from "@/features/one-on-one/components/one-on-one-editor";
import { ReflectionSummary } from "@/features/one-on-one/components/reflection-summary";
import { InternInfoCard } from "@/features/one-on-one/components/intern-info-card";

export const metadata: Metadata = { title: "Monthly 1-on-1" };

export default async function OneOnOneEditorPage({
  params,
}: {
  params: Promise<{ internshipId: string; period: string }>;
}) {
  const { internshipId, period } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(ROUTES.login);
  // Interns never reach the editor — they use the read-only record view.
  if (user.role === "intern") notFound();

  const parsed = parsePeriod(period);
  if (!parsed) notFound();

  const db = getDataSource();
  const internship = await db.getInternshipById(internshipId);
  if (!internship) notFound();

  // Access control (defense in depth alongside RLS): admin, or the mentor.
  const allowed =
    user.role === "admin" ||
    (user.role === "mentor" && internship.mentorId === user.id);
  if (!allowed) notFound();

  // The month's 1-on-1 only opens in its final week (past months stay open for
  // catch-up; future months are locked). Mirrors the server-action guard.
  if (!isOneOnOneOpen(parsed.year, parsed.month)) {
    return (
      <PageContainer>
        <PageHeader
          eyebrow={monthLabel(parsed.year, parsed.month)}
          title="Monthly 1-on-1"
          description="This month's check-in opens in the final week of the month."
          actions={
            <LinkButton href={ROUTES.oneOnOnes} variant="ghost" size="sm">
              <ArrowLeft />
              Back
            </LinkButton>
          }
        />
        <div className="mt-8">
          <EmptyState
            icon={CalendarClock}
            title="This 1-on-1 isn't open yet"
            description="Monthly 1-on-1s can only be filled in the last week of the month. Check back then to capture this check-in."
          />
        </div>
      </PageContainer>
    );
  }

  const ctx = await db.getOneOnOneContext(
    internshipId,
    parsed.year,
    parsed.month,
  );
  if (!ctx) notFound();

  const initialValues = {
    strengths: ctx.record?.strengths ?? "",
    concerns: ctx.record?.concerns ?? "",
    goalsNextMonth: ctx.record?.goalsNextMonth ?? "",
  };

  return (
    <PageContainer>
      <Reveal>
        <PageHeader
          eyebrow={monthLabel(ctx.year, ctx.month)}
          title={`1-on-1 · ${ctx.intern.fullName}`}
          description="Review this month's reflections, then capture your notes. Mark it completed to share it with the intern."
          actions={
            <LinkButton href={ROUTES.oneOnOnes} variant="ghost" size="sm">
              <ArrowLeft />
              Back
            </LinkButton>
          }
        />
      </Reveal>

      <div className="mt-8 space-y-10">
        {/* Intern information */}
        <InternInfoCard
          intern={ctx.intern}
          position={ctx.position}
          cohort={ctx.cohort}
          mentor={ctx.mentor}
          period={monthLabel(ctx.year, ctx.month)}
        />

        {/* Weekly Reflection summary (read-only) */}
        <section className="space-y-4">
          <SectionHeader
            title="Weekly Reflection summary"
            description={`This intern's reflections for ${monthLabel(ctx.year, ctx.month)}`}
            icon={NotebookText}
          />
          <ReflectionSummary
            summary={ctx.reflectionSummary}
            internshipStartDate={internship.startDate}
          />
        </section>

        {/* Mentor notes */}
        <section className="space-y-4">
          <SectionHeader
            title="Mentor notes"
            description="Your reflection on the intern's month"
            icon={MessagesSquare}
          />
          <Card>
            <CardContent>
              <OneOnOneEditor
                internshipId={ctx.internshipId}
                year={ctx.year}
                month={ctx.month}
                initialValues={initialValues}
                initialStatus={ctx.record?.status ?? "not_started"}
              />
            </CardContent>
          </Card>
        </section>
      </div>
    </PageContainer>
  );
}
