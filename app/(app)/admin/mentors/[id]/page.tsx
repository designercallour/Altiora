import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, UserPlus, Users } from "lucide-react";
import { getDataSource } from "@/services";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { SectionHeader } from "@/components/shared/section-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusChip } from "@/components/shared/status-chip";
import { LinkButton } from "@/components/shared/link-button";
import { Reveal, Stagger, StaggerItem } from "@/components/shared/motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MentorFormDialog } from "@/features/admin/components/mentor-form-dialog";
import { AssignInternToMentorDialog } from "@/features/admin/components/assign-intern-to-mentor-dialog";
import { getInitials } from "@/lib/format";
import { internshipStatus } from "@/lib/internship";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = { title: "Mentor" };

export default async function AdminMentorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = getDataSource();
  const mentor = await db.getMentorById(id);
  if (!mentor) notFound();

  const [theirInterns, allInterns] = await Promise.all([
    db.listInterns({ mentorId: id }),
    db.listInterns(),
  ]);
  const activeCount = theirInterns.filter(
    (s) => s.internship && internshipStatus(s.internship) === "active",
  ).length;

  return (
    <PageContainer>
      <Reveal>
        <PageHeader
          eyebrow="Mentor"
          title={mentor.fullName}
          description={mentor.email}
          actions={
            <div className="flex items-center gap-2">
              <LinkButton
                href={ROUTES.adminMentors}
                variant="ghost"
                size="sm"
              >
                <ArrowLeft />
                Back
              </LinkButton>
              <MentorFormDialog
                mentor={mentor}
                trigger={<Button size="sm">Edit</Button>}
              />
            </div>
          }
        />
      </Reveal>

      <Stagger className="mt-8 grid grid-cols-2 gap-4">
        <StaggerItem>
          <StatCard
            label="Active interns"
            value={activeCount}
            icon={Users}
            hint="Being mentored right now"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="All-time interns"
            value={theirInterns.length}
            icon={Users}
            hint="Across the program"
          />
        </StaggerItem>
      </Stagger>

      <section className="mt-10 space-y-4">
        <SectionHeader
          title="Interns"
          description="Everyone this mentor supervises"
          icon={Users}
          action={
            <AssignInternToMentorDialog
              mentorId={mentor.id}
              mentorName={mentor.fullName}
              interns={allInterns}
              trigger={
                <Button size="sm" variant="outline">
                  <UserPlus />
                  Assign intern
                </Button>
              }
            />
          }
        />
        {theirInterns.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No interns yet"
            description={`Assign an intern to ${mentor.fullName.split(" ")[0]} to get started.`}
          />
        ) : (
          <ul className="divide-border border-border divide-y overflow-hidden rounded-xl border">
            {theirInterns.map((s) => (
              <li key={s.user.id}>
                <Link
                  href={
                    s.internship
                      ? ROUTES.intern(s.internship.id)
                      : ROUTES.adminInterns
                  }
                  className="hover:bg-muted/40 flex items-center gap-3 p-3 transition-colors sm:gap-4 sm:px-4"
                >
                  <Avatar className="size-9 shrink-0">
                    {s.user.avatarUrl ? (
                      <AvatarImage src={s.user.avatarUrl} alt="" />
                    ) : null}
                    <AvatarFallback>
                      {getInitials(s.user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {s.user.fullName}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {s.cohort?.name ?? "No cohort"}
                    </p>
                  </div>
                  <StatusChip internship={s.internship} className="shrink-0" />
                  <ArrowRight className="text-muted-foreground size-4 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageContainer>
  );
}
