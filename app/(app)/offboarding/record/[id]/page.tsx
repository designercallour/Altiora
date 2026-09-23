import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getDataSource } from "@/services";
import { formatDate } from "@/lib/format";
import { ROUTES } from "@/lib/constants";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { LinkButton } from "@/components/shared/link-button";
import { Reveal } from "@/components/shared/motion";
import { Badge } from "@/components/ui/badge";
import { OffboardingRecordView } from "@/features/offboarding/components/offboarding-record-view";

export const metadata: Metadata = { title: "Offboarding" };

export default async function OffboardingRecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(ROUTES.login);

  const db = getDataSource();
  const ctx = await db.getOffboardingById(id);
  if (!ctx || !ctx.record) notFound();

  // Access control: admin (any), mentor (their intern), or the intern
  // themselves — and only when the record is completed.
  const isMentor = user.role === "mentor" && ctx.mentor?.id === user.id;
  const isOwnerIntern =
    user.role === "intern" &&
    ctx.intern.id === user.id &&
    ctx.record.status === "completed";
  if (!(user.role === "admin" || isMentor || isOwnerIntern)) notFound();

  return (
    <PageContainer>
      <Reveal>
        <PageHeader
          eyebrow="Exit 1-on-1"
          title={
            user.role === "intern"
              ? "Your offboarding"
              : `Offboarding · ${ctx.intern.fullName}`
          }
          description="A record of the exit 1-on-1 and handover."
          actions={
            <LinkButton href={ROUTES.offboarding} variant="ghost" size="sm">
              <ArrowLeft />
              Back
            </LinkButton>
          }
        />
      </Reveal>

      <div className="mt-8 space-y-8">
        {ctx.record.completedAt ? (
          <Badge variant="secondary" className="gap-1.5">
            <CheckCircle2 className="size-3.5" />
            Completed {formatDate(ctx.record.completedAt)}
          </Badge>
        ) : null}

        <OffboardingRecordView record={ctx.record} />
      </div>
    </PageContainer>
  );
}
