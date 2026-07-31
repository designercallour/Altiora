import { Camera, NotebookText, PlayCircle } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { internshipWeekNumber } from "@/lib/week";
import type { OneOnOneReflectionSummary } from "@/types/domain";

/**
 * Read-only rollup of an intern's Weekly Reflections for the selected month:
 * headline counts plus the individual entries a mentor reviews before writing
 * feedback.
 */
export function ReflectionSummary({
  summary,
  internshipStartDate,
}: {
  summary: OneOnOneReflectionSummary;
  internshipStartDate: string | null;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="Reflections submitted"
          value={summary.totalSubmitted}
          icon={NotebookText}
        />
        <StatCard
          label="Playback completed"
          value={summary.playbackCount}
          hint={`of ${summary.totalSubmitted} reflections`}
          icon={PlayCircle}
        />
        <StatCard
          label="Instagram Stories"
          value={summary.instagramCount}
          hint={`of ${summary.totalSubmitted} reflections`}
          icon={Camera}
        />
      </div>

      {summary.reports.length === 0 ? (
        <EmptyState
          icon={NotebookText}
          title="No reflections this month"
          description="This intern hasn't submitted any weekly reflections for the selected month yet."
        />
      ) : (
        <ul className="divide-border border-border divide-y overflow-hidden rounded-xl border">
          {summary.reports.map((r) => (
            <li
              key={r.id}
              className="flex items-center gap-3 px-4 py-3 sm:gap-4"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {internshipStartDate
                    ? `Week ${internshipWeekNumber(internshipStartDate, r.year, r.weekNumber)}`
                    : `Week ${r.weekNumber}`}
                  <span className="text-muted-foreground font-normal">
                    {" "}
                    · {formatDate(r.startDate)} – {formatDate(r.endDate)}
                  </span>
                </p>
                <p className="text-muted-foreground text-xs">
                  Confidence {r.confidence ?? "–"}/10 · Mood {r.mood ?? "–"}/6
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {r.playbackCompleted ? (
                  <Badge variant="outline" className="gap-1">
                    <PlayCircle className="size-3" />
                    Playback
                  </Badge>
                ) : null}
                {r.instagramStoryCompleted ? (
                  <Badge variant="outline" className="gap-1">
                    <Camera className="size-3" />
                    Story
                  </Badge>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
