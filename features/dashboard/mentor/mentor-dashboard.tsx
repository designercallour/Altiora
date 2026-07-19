import { CheckCircle2, Clock, MessageSquareQuote, Users } from "lucide-react";
import { getDataSource } from "@/services";
import { weekRangeFrom } from "@/lib/week";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { SectionHeader } from "@/components/shared/section-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Reveal, Stagger, StaggerItem } from "@/components/shared/motion";
import { ROUTES } from "@/lib/constants";
import type { AppUser, InternSummary } from "@/types/domain";
import { InternRow } from "../intern-row";

function reflectedInWeek(
  s: InternSummary,
  w: { year: number; week: number },
): boolean {
  const r = s.latestReport;
  return !!(
    r &&
    r.status === "submitted" &&
    r.year === w.year &&
    r.weekNumber === w.week
  );
}

export async function MentorDashboard({ user }: { user: AppUser }) {
  const db = getDataSource();
  const interns = await db.listInterns({ mentorId: user.id });

  // Coaching signals key off the last *completed* week — the current week is
  // still open, so an intern who hasn't submitted yet isn't behind.
  const lastWeek = weekRangeFrom(new Date(), -1);

  const needsFeedback = interns.filter((i) => i.needsReview);
  const active = interns.filter((i) => i.internship?.status === "active");
  const behind = active.filter((i) => !reflectedInWeek(i, lastWeek));
  const reflected = active.length - behind.length;

  return (
    <PageContainer>
      <Reveal>
        <PageHeader
          eyebrow="Mentor"
          title={`Mentoring ${interns.length} ${interns.length === 1 ? "intern" : "interns"}`}
          description="Where your interns need you this week — reflections to review and growth to notice."
        />
      </Reveal>

      <Stagger className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StaggerItem>
          <StatCard
            label="Your interns"
            value={interns.length}
            icon={Users}
            hint="Assigned to you"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="To review"
            value={needsFeedback.length}
            icon={MessageSquareQuote}
            hint="Submitted, awaiting your review"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Reflected last week"
            value={`${reflected}/${active.length}`}
            icon={CheckCircle2}
            hint={`Week ${lastWeek.week}`}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Behind"
            value={behind.length}
            icon={Clock}
            hint="Missed last week"
          />
        </StaggerItem>
      </Stagger>

      {/* Feedback queue */}
      <section className="mt-10 space-y-4">
        <SectionHeader
          title="To review"
          description="Reflections your interns have submitted and are waiting for you to read"
          icon={MessageSquareQuote}
        />
        {needsFeedback.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="You're all caught up"
            description="Every submitted reflection has been reviewed. Beautifully done."
          />
        ) : (
          <ul className="space-y-2">
            {needsFeedback.map((s) => (
              <InternRow
                key={s.user.id}
                summary={s}
                href={
                  s.internship
                    ? ROUTES.intern(s.internship.id)
                    : ROUTES.dashboard
                }
                cta="Review"
                accent
              />
            ))}
          </ul>
        )}
      </section>

      {/* Behind last week */}
      {behind.length > 0 ? (
        <section className="mt-10 space-y-4">
          <SectionHeader
            title="Behind last week"
            description="Didn't submit last week's reflection — a gentle nudge might help"
            icon={Clock}
          />
          <ul className="space-y-2">
            {behind.map((s) => (
              <InternRow
                key={s.user.id}
                summary={s}
                href={
                  s.internship
                    ? ROUTES.intern(s.internship.id)
                    : ROUTES.dashboard
                }
              />
            ))}
          </ul>
        </section>
      ) : null}

      {/* Roster */}
      {interns.length > 0 ? (
        <section className="mt-10 space-y-4">
          <SectionHeader
            title="Your interns"
            description="Open anyone to see their full week-by-week history"
            icon={Users}
          />
          <ul className="space-y-2">
            {interns.map((s) => (
              <InternRow
                key={s.user.id}
                summary={s}
                href={
                  s.internship
                    ? ROUTES.intern(s.internship.id)
                    : ROUTES.dashboard
                }
              />
            ))}
          </ul>
        </section>
      ) : null}
    </PageContainer>
  );
}
