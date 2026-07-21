import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StatusChip } from "@/components/shared/status-chip";
import { moodLevel } from "@/lib/domain";
import { formatDate, getInitials } from "@/lib/format";
import { internshipWeekNumber } from "@/lib/week";
import type { InternSummary } from "@/types/domain";

/**
 * A single intern row for mentor/admin lists. Links to wherever `href` points
 * (usually the intern's profile). Shows the latest report's week + mood, and an
 * optional CTA badge.
 */
export function InternRow({
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
          {summary.user.avatarUrl ? (
            <AvatarImage src={summary.user.avatarUrl} alt="" />
          ) : null}
          <AvatarFallback>{getInitials(summary.user.fullName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {summary.user.fullName}
          </p>
          <p className="text-muted-foreground truncate text-xs">
            {summary.cohort?.name ?? "No cohort"} · {summary.submittedCount}{" "}
            reflections
          </p>
        </div>
        {!cta ? (
          <StatusChip internship={summary.internship} className="hidden sm:flex" />
        ) : null}
        {summary.latestReport ? (
          <div className="shrink-0 text-right leading-tight">
            <p className="text-sm font-medium tabular-nums">
              Week{" "}
              {summary.internship
                ? internshipWeekNumber(
                    summary.internship.startDate,
                    summary.latestReport.year,
                    summary.latestReport.weekNumber,
                  )
                : summary.latestReport.weekNumber}
            </p>
            <p className="text-muted-foreground text-xs">
              {formatDate(summary.latestReport.startDate)}
            </p>
          </div>
        ) : null}
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
