import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  MessageSquareQuote,
  Users,
} from "lucide-react";
import { getDataSource } from "@/services";
import { weekRangeFrom } from "@/lib/week";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { SectionHeader } from "@/components/shared/section-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Reveal, Stagger, StaggerItem } from "@/components/shared/motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { moodLevel } from "@/lib/domain";
import { getInitials } from "@/lib/format";
import { ROUTES } from "@/lib/constants";
import type { AppUser, InternSummary } from "@/types/domain";

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
          title={`Coaching ${interns.length} ${interns.length === 1 ? "intern" : "interns"}`}
          description="Where your interns need you this week — feedback to give, reflections to read, growth to notice."
        />
      </Reveal>

      <Stagger className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StaggerItem>
          <StatCard label="Your interns" value={interns.length} icon={Users} />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Needs feedback"
            value={needsFeedback.length}
            icon={MessageSquareQuote}
            hint="Submitted, awaiting your notes"
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
          title="Needs your feedback"
          description="Reflections your interns have submitted and are waiting to hear back on"
          icon={MessageSquareQuote}
        />
        {needsFeedback.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="You're all caught up"
            description="Every submitted reflection has your feedback. Beautifully done."
          />
        ) : (
          <ul className="space-y-2">
            {needsFeedback.map((s) => (
              <InternRow
                key={s.user.id}
                summary={s}
                href={
                  s.latestReport
                    ? ROUTES.report(s.latestReport.id)
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
                  s.latestReport
                    ? ROUTES.report(s.latestReport.id)
                    : ROUTES.dashboard
                }
              />
            ))}
          </ul>
        </section>
      ) : null}

      {/* Roster */}
      <section className="mt-10 space-y-4">
        <SectionHeader
          title="Your interns"
          description="Everyone you're supporting"
          icon={Users}
        />
        <ul className="space-y-2">
          {interns.map((s) => (
            <InternRow
              key={s.user.id}
              summary={s}
              href={
                s.latestReport
                  ? ROUTES.report(s.latestReport.id)
                  : ROUTES.dashboard
              }
            />
          ))}
        </ul>
      </section>
    </PageContainer>
  );
}

function InternRow({
  summary,
  href,
  cta,
  accent,
}: {
  summary: InternSummary;
  href: string;
  cta?: string;
  accent?: boolean;
}) {
  const mood = moodLevel(summary.latestReport?.mood ?? null);
  return (
    <li>
      <Link
        href={href}
        className={
          "group border-border bg-card hover:border-primary/30 focus-visible:ring-ring/50 flex items-center gap-3 rounded-xl border p-3.5 transition-colors outline-none focus-visible:ring-2 " +
          (accent ? "border-primary/25" : "")
        }
      >
        <Avatar>
          <AvatarFallback>{getInitials(summary.user.fullName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {summary.user.fullName}
          </p>
          <p className="text-muted-foreground truncate text-xs">
            {summary.cohort?.name ?? "—"} · {summary.department?.name ?? "—"} ·{" "}
            {summary.submittedCount} reflections
          </p>
        </div>
        {mood ? (
          <span className="text-xl" title={mood.label}>
            {mood.emoji}
          </span>
        ) : null}
        {cta ? (
          <Badge variant="default" className="gap-1">
            {cta}
            <ArrowRight className="size-3" />
          </Badge>
        ) : (
          <ArrowRight className="text-muted-foreground size-4 transition-transform group-hover:translate-x-0.5" />
        )}
      </Link>
    </li>
  );
}
