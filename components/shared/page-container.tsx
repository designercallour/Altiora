import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Constrains page content to a comfortable measure with responsive gutters.
 * Every authenticated page wraps its content in this.
 */
export function PageContainer({
  children,
  className,
  size = "default",
}: {
  children: React.ReactNode;
  className?: string;
  size?: "default" | "narrow" | "wide";
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 py-6 sm:px-6 lg:px-10 lg:py-10",
        size === "narrow" && "max-w-3xl",
        size === "default" && "max-w-[80rem]",
        size === "wide" && "max-w-[96rem]",
        className,
      )}
    >
      {children}
    </div>
  );
}
