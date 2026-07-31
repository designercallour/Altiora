import { Badge } from "@/components/ui/badge";
import { ONE_ON_ONE_STATUS_LABELS } from "@/lib/one-on-one";
import { cn } from "@/lib/utils";
import type { OneOnOneStatus } from "@/types/domain";

export function OneOnOneStatusBadge({
  status,
  className,
}: {
  status: OneOnOneStatus;
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
      {ONE_ON_ONE_STATUS_LABELS[status]}
    </Badge>
  );
}
