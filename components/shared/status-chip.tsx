import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  internshipLifecycle,
  PHASE_LABELS,
  type InternshipPhase,
} from "@/lib/internship";
import type { Internship } from "@/types/domain";

const DOT: Record<InternshipPhase, string> = {
  active: "bg-success",
  upcoming: "bg-chart-3",
  completed: "bg-muted-foreground",
  unscheduled: "bg-muted-foreground",
};

/**
 * The single visual representation of internship status. Status is computed
 * from the period (never stored) — see lib/internship.ts. Shows Active/Inactive
 * with a phase-aware label ("Active", "Starts soon", "Completed").
 */
export function StatusChip({
  internship,
  className,
}: {
  internship: Pick<Internship, "startDate" | "endDate"> | null | undefined;
  className?: string;
}) {
  if (!internship) {
    return (
      <Badge variant="outline" className={cn("gap-1.5", className)}>
        <span className="size-1.5 rounded-full bg-muted-foreground" />
        No internship
      </Badge>
    );
  }
  const life = internshipLifecycle(internship);
  const isActive = life.status === "active";
  return (
    <Badge
      variant={isActive ? "secondary" : "outline"}
      className={cn("gap-1.5", className)}
    >
      <span className={cn("size-1.5 rounded-full", DOT[life.phase])} />
      {PHASE_LABELS[life.phase]}
    </Badge>
  );
}
