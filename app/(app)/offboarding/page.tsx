import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, DoorOpen } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getDataSource } from "@/services";
import { isOffboardingAvailable } from "@/lib/offboarding";
import { formatDate } from "@/lib/format";
import { ROUTES } from "@/lib/constants";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Reveal } from "@/components/shared/motion";
import { Card, CardContent } from "@/components/ui/card";
import { ManagementList } from "@/features/offboarding/components/management-list";
import { OffboardingStatusBadge } from "@/features/offboarding/components/offboarding-status-badge";
import type { OffboardingListItem } from "@/types/domain";
import type { DataSource } from "@/services/data-source";

export const metadata: Metadata = { title: "Offboarding" };

/**
 * Merge existing records with a synthesized "Not started" row for every intern
 * whose internship is wrapping up (final stretch or completed) and has no record
 * yet — so supervisors see who still needs their exit 1-on-1.
 */
async function buildManagementRows(
  db: DataSource,
  scope: { mentorId?: string },
): Promise<OffboardingListItem[]> {
  const [existing, interns] = await Promise.all([
    db.listOffboardings(scope.mentorId ? { mentorId: scope.mentorId } : {}),
    db.listInterns(scope.mentorId ? { mentorId: scope.mentorId } : {}),
  ]);

  const seen = new Set(existing.map((e) => e.internshipId));
  const synthesized: OffboardingListItem[] = [];
  for (const s of interns) {
    if (!s.internship) continue;
    if (seen.has(s.internship.id)) continue;
    if (!isOffboardingAvailable(s.internship)) continue;
    synthesized.push({
      id: null,
      internshipId: s.internship.id,
      intern: {
        id: s.user.id,
        fullName: s.user.fullName,
        avatarUrl: s.user.avatarUrl,
      },
      mentor: s.mentor,
      lastDay: s.internship.endDate,
      status: "not_started",
      completedAt: null,
      updatedAt: null,
    });
  }

  return [...existing, ...synthesized].sort((a, b) =>
    (a.lastDay ?? "").localeCompare(b.lastDay ?? ""),
  );
}

export default async function OffboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect(ROUTES.login);
  const db = getDataSource();

  // ── Intern: read-only history of their completed offboarding ───────────────
  if (user.role === "intern") {
    const records = await db.listOffboardings({
      internUserId: user.id,
      status: "completed",
    });
    return (
      <PageContainer>
        <Reveal>
          <PageHeader
            title="Offboarding"
            description="Your exit 1-on-1 — reflections, feedback, and next steps captured on your way out."
          />
        </Reveal>
        <div className="mt-8">
          {records.length === 0 ? (
            <EmptyState
              icon={DoorOpen}
              title="Nothing here yet"
              description="Once your supervisor completes your exit 1-on-1, it will appear here for you to read."
            />
          ) : (
            <ul className="space-y-2">
              {records.map((r) => (
                <li key={r.id ?? r.internshipId}>
                  <Link
                    href={r.id ? ROUTES.offboardingRecord(r.id) : ROUTES.offboarding}
                    className="group border-border bg-card hover:border-primary/30 focus-visible:ring-ring/50 flex items-center gap-4 rounded-xl border p-4 transition-colors outline-none focus-visible:ring-2"
                  >
                    <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
                      <DoorOpen className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">Exit 1-on-1</p>
                      <p className="text-muted-foreground text-xs">
                        With {r.mentor?.fullName ?? "your supervisor"}
                        {r.completedAt
                          ? ` · Completed ${formatDate(r.completedAt)}`
                          : ""}
                      </p>
                    </div>
                    <OffboardingStatusBadge
                      status={r.status}
                      className="shrink-0"
                    />
                    <ArrowRight className="text-muted-foreground size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PageContainer>
    );
  }

  // ── Admin + Mentor: management table ───────────────────────────────────────
  const rows = await buildManagementRows(
    db,
    user.role === "mentor" ? { mentorId: user.id } : {},
  );

  return (
    <PageContainer>
      <Reveal>
        <PageHeader
          title="Offboarding"
          description={
            user.role === "admin"
              ? "Every intern's exit 1-on-1 and handover across the program."
              : "Run and document the exit 1-on-1 for interns wrapping up."
          }
        />
      </Reveal>
      <div className="mt-8">
        {rows.length === 0 ? (
          <Card>
            <CardContent>
              <EmptyState
                icon={DoorOpen}
                title="No offboardings yet"
                description={
                  user.role === "mentor"
                    ? "None of your interns are wrapping up right now. When one nears their last day, they'll appear here."
                    : "No interns are wrapping up right now. Exit 1-on-1s appear here as internships near their end."
                }
                variant="plain"
              />
            </CardContent>
          </Card>
        ) : (
          <ManagementList rows={rows} />
        )}
      </div>
    </PageContainer>
  );
}
