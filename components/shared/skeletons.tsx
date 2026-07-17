import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** A few lines of placeholder text; last line shorter. */
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-3.5", i === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}

/** Mirrors StatCard's resting layout to avoid layout shift on load. */
export function SkeletonStatCard({ className }: { className?: string }) {
  return (
    <Card size="sm" className={cn("gap-0", className)}>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="size-7 rounded-lg" />
        </div>
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-3 w-28" />
      </CardContent>
    </Card>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <div className="flex items-start gap-3">
          <Skeleton className="size-8 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <SkeletonText lines={3} />
      </CardContent>
    </Card>
  );
}

/** Rows of list items (e.g. an intern or report list). */
export function SkeletonList({
  rows = 5,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("divide-border divide-y", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-3.5">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}
