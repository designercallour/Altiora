import { Badge } from "@/components/ui/badge";
import { OFFBOARDING_STATUS_LABELS } from "@/lib/offboarding";
import { cn } from "@/lib/utils";
import type { OffboardingStatus } from "@/types/domain";

export function OffboardingStatusBadge({
  status,
  className,
}: {
  status: OffboardingStatus;
  className?: string;
}) {
  const completed = status === "completed";
  return (
    <Badge
      variant={completed ? "secondary" : "outline"}
      className={cn("gap-1.5", className)}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          completed ? "bg-success" : "bg-muted-foreground",
        )}
      />
      {OFFBOARDING_STATUS_LABELS[status]}
    </Badge>
  );
}
