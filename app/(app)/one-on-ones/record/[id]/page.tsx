import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, MessagesSquare, NotebookText } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getDataSource } from "@/services";
import { monthLabel } from "@/lib/one-on-one";
import { formatDate } from "@/lib/format";
import { ROUTES } from "@/lib/constants";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { SectionHeader } from "@/components/shared/section-header";
import { LinkButton } from "@/components/shared/link-button";
import { Reveal } from "@/components/shared/motion";
import { Badge } from "@/components/ui/badge";
import { InternInfoCard } from "@/features/one-on-one/components/intern-info-card";
import { ReflectionSummary } from "@/features/one-on-one/components/reflection-summary";
import { MentorNotes } from "@/features/one-on-one/components/mentor-notes";

export const metadata: Metadata = { title: "Monthly 1-on-1" };

export default async function OneOnOneRecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(ROUTES.login);

  const db = getDataSource();
  const ctx = await db.getOneOnOneById(id);
  if (!ctx || !ctx.record) notFound();

  const internship = await db.getInternshipById(ctx.internshipId);

  // Access control: admin (any), mentor (their intern), or the intern
  // themselves — and only when the record is completed.
  const isMentor =
    user.role === "mentor" && internship?.mentorId === user.id;
  const isOwnerIntern =
    user.role === "intern" &&
    ctx.intern.id === user.id &&
    ctx.record.status === "completed";
  if (!(user.role === "admin" || isMentor || isOwnerIntern)) notFound();

  return (
    <PageContainer>
      <Reveal>
        <PageHeader
          eyebrow={monthLabel(ctx.year, ctx.month)}
          title={
            user.role === "intern"
              ? `Your 1-on-1 · ${monthLabel(ctx.year, ctx.month)}`
              : `1-on-1 · ${ctx.intern.fullName}`
          }
          description="A record of this month's mentor check-in."
          actions={
            <LinkButton href={ROUTES.oneOnOnes} variant="ghost" size="sm">
              <ArrowLeft />
              Back
            </LinkButton>
          }
        />
      </Reveal>

      <div className="mt-8 space-y-10">
        <InternInfoCard
          intern={ctx.intern}
          position={ctx.position}
          cohort={ctx.cohort}
          mentor={ctx.mentor}
          period={monthLabel(ctx.year, ctx.month)}
        />

        {ctx.record.completedAt ? (
          <Badge variant="secondary" className="gap-1.5">
            <CheckCircle2 className="size-3.5" />
            Completed {formatDate(ctx.record.completedAt)}
          </Badge>
        ) : null}

        {/* Mentor notes */}
        <section className="space-y-4">
          <SectionHeader title="Mentor notes" icon={MessagesSquare} />
          <MentorNotes record={ctx.record} />
        </section>

        {/* Weekly Reflection summary — the month's context */}
        <section className="space-y-4">
          <SectionHeader
            title="Weekly Reflection summary"
            description={`Your reflections for ${monthLabel(ctx.year, ctx.month)}`}
            icon={NotebookText}
          />
          <ReflectionSummary
            summary={ctx.reflectionSummary}
            internshipStartDate={internship?.startDate ?? null}
          />
        </section>
      </div>
    </PageContainer>
  );
}
