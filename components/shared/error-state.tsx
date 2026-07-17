import * as React from "react";
import { TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this section. Please try again.",
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "border-destructive/30 bg-destructive/5 flex flex-col items-center justify-center rounded-xl border px-6 py-12 text-center",
        className,
      )}
    >
      <span className="bg-destructive/10 text-destructive mb-4 flex size-11 items-center justify-center rounded-xl">
        <TriangleAlert className="size-5" aria-hidden />
      </span>
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="text-muted-foreground mx-auto mt-1.5 max-w-sm text-sm leading-relaxed">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
