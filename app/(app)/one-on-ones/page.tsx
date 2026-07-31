import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, MessagesSquare } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getDataSource } from "@/services";
import { internshipStatus } from "@/lib/internship";
import { currentPeriod, monthLabel } from "@/lib/one-on-one";
import { formatDate } from "@/lib/format";
import { ROUTES } from "@/lib/constants";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Reveal } from "@/components/shared/motion";
import { Card, CardContent } from "@/components/ui/card";
import { ManagementList } from "@/features/one-on-one/components/management-list";
import { OneOnOneStatusBadge } from "@/features/one-on-one/components/one-on-one-status-badge";
import type { OneOnOneListItem } from "@/types/domain";
import type { DataSource } from "@/services/data-source";

export const metadata: Metadata = { title: "Monthly 1-on-1" };

/**
 * Merge existing records with a synthesized "Not started" row for the current
 * month, for every active intern in scope — so mentors see who still needs
 * this month's check-in.
 */
async function buildManagementRows(
  db: DataSource,
  scope: { mentorId?: string },
): Promise<OneOnOneListItem[]> {
  const cur = currentPeriod();
  const [existing, interns] = await Promise.all([
    db.listOneOnOnes(scope.mentorId ? { mentorId: scope.mentorId } : {}),
    db.listInterns(scope.mentorId ? { mentorId: scope.mentorId } : {}),
  ]);

  const key = (iid: string, y: number, m: number) => `${iid}:${y}:${m}`;
  const seen = new Set(existing.map((e) => key(e.internshipId, e.year, e.month)));

  const synthesized: OneOnOneListItem[] = [];
  for (const s of interns) {
    if (!s.internship) continue;
    if (internshipStatus(s.internship) !== "active") continue;
    if (seen.has(key(s.internship.id, cur.year, cur.month))) continue;
    synthesized.push({
      id: null,
      internshipId: s.internship.id,
      intern: {
        id: s.user.id,
        fullName: s.user.fullName,
        avatarUrl: s.user.avatarUrl,
      },
      mentor: s.mentor,
      month: cur.month,
      year: cur.year,
      status: "not_started",
      completedAt: null,
      updatedAt: null,
    });
  }

  return [...synthesized, ...existing].sort(
    (a, b) =>
      b.year - a.year ||
      b.month - a.month ||
      a.intern.fullName.localeCompare(b.intern.fullName),
  );
}

export default async function OneOnOnesPage() {
  const user = await getCurrentUser();
  if (!user) redirect(ROUTES.login);
  const db = getDataSource();

  // ── Intern: read-only history of their completed check-ins ─────────────────
  if (user.role === "intern") {
    const records = await db.listOneOnOnes({
      internUserId: user.id,
      status: "completed",
    });
    return (
      <PageContainer>
        <Reveal>
          <PageHeader
            title="Monthly 1-on-1"
            description="Your monthly check-ins with your mentor — revisit feedback, track your growth, and review your goals over time."
          />
        </Reveal>
        <div className="mt-8">
          {records.length === 0 ? (
            <EmptyState
              icon={MessagesSquare}
              title="No check-ins yet"
              description="Once your mentor completes a monthly 1-on-1, it will appear here for you to read."
            />
          ) : (
            <ul className="space-y-2">
              {records.map((r) => (
                <li key={r.id ?? `${r.internshipId}-${r.year}-${r.month}`}>
                  <Link
                    href={r.id ? ROUTES.oneOnOneRecord(r.id) : ROUTES.oneOnOnes}
                    className="group border-border bg-card hover:border-primary/30 focus-visible:ring-ring/50 flex items-center gap-4 rounded-xl border p-4 transition-colors outline-none focus-visible:ring-2"
                  >
                    <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
                      <MessagesSquare className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {monthLabel(r.year, r.month)}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        With {r.mentor?.fullName ?? "your mentor"}
                        {r.completedAt
                          ? ` · Completed ${formatDate(r.completedAt)}`
                          : ""}
                      </p>
                    </div>
                    <OneOnOneStatusBadge status={r.status} className="shrink-0" />
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
          title="Monthly 1-on-1"
          description={
            user.role === "admin"
              ? "Every intern's monthly mentor check-in across the program."
              : "Document your monthly check-ins with the interns you support."
          }
        />
      </Reveal>
      <div className="mt-8">
        {rows.length === 0 ? (
          <Card>
            <CardContent>
              <EmptyState
                icon={MessagesSquare}
                title="No 1-on-1s to show"
                description={
                  user.role === "mentor"
                    ? "You don't have any active interns assigned yet. Once you do, their monthly check-ins will appear here."
                    : "There are no active interns yet. Monthly check-ins will appear here once interns are onboarded."
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
