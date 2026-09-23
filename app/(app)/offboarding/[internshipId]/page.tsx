import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarClock, DoorOpen } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getDataSource } from "@/services";
import { isOffboardingAvailable } from "@/lib/offboarding";
import { ROUTES } from "@/lib/constants";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { LinkButton } from "@/components/shared/link-button";
import { Reveal } from "@/components/shared/motion";
import { Card, CardContent } from "@/components/ui/card";
import { OffboardingEditor } from "@/features/offboarding/components/offboarding-editor";
import { offboardingFormValues } from "@/features/offboarding/form-values";

export const metadata: Metadata = { title: "Offboarding" };

export default async function OffboardingEditorPage({
  params,
}: {
  params: Promise<{ internshipId: string }>;
}) {
  const { internshipId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(ROUTES.login);
  // Interns never reach the editor — they use the read-only record view.
  if (user.role === "intern") notFound();

  const db = getDataSource();
  const internship = await db.getInternshipById(internshipId);
  if (!internship) notFound();

  // Access control (defense in depth alongside RLS): admin, or the mentor.
  const allowed =
    user.role === "admin" ||
    (user.role === "mentor" && internship.mentorId === user.id);
  if (!allowed) notFound();

  // Offboarding only opens near the end of the internship (or after it ends).
  if (!isOffboardingAvailable(internship)) {
    return (
      <PageContainer>
        <PageHeader
          title="Offboarding"
          description="Offboarding opens as the internship nears its end."
          actions={
            <LinkButton href={ROUTES.offboarding} variant="ghost" size="sm">
              <ArrowLeft />
              Back
            </LinkButton>
          }
        />
        <div className="mt-8">
          <EmptyState
            icon={CalendarClock}
            title="Not time to offboard yet"
            description="The exit 1-on-1 opens in the final stretch of the internship. Check back closer to the intern's last day."
          />
        </div>
      </PageContainer>
    );
  }

  const ctx = await db.getOffboardingContext(internshipId);
  if (!ctx) notFound();

  const initialValues = offboardingFormValues(ctx);

  return (
    <PageContainer>
      <Reveal>
        <PageHeader
          eyebrow="Exit 1-on-1"
          title={`Offboarding · ${ctx.intern.fullName}`}
          description="Run the final 1-on-1, capture two-way feedback, and complete the handover. Mark it completed to share it with the intern."
          actions={
            <LinkButton href={ROUTES.offboarding} variant="ghost" size="sm">
              <ArrowLeft />
              Back
            </LinkButton>
          }
        />
      </Reveal>

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
        <span className="text-muted-foreground">
          {ctx.position ?? "Intern"}
        </span>
        {ctx.cohort ? (
          <span className="text-muted-foreground">{ctx.cohort.name}</span>
        ) : null}
        <span className="text-muted-foreground">
          Supervisor: {ctx.mentor?.fullName ?? "Unassigned"}
        </span>
      </div>

      <Card className="mt-8">
        <CardContent>
          <div className="text-muted-foreground mb-6 flex items-center gap-2 text-sm">
            <DoorOpen className="size-4" />
            <span>
              Semua feedback ditulis lengkap oleh supervisor, bukan hanya
              dicentang.
            </span>
          </div>
          <OffboardingEditor
            internshipId={ctx.internshipId}
            initialValues={initialValues}
            initialStatus={ctx.record?.status ?? "not_started"}
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
