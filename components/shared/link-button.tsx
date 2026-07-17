import * as React from "react";
import Link from "next/link";
import type { VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LinkButtonProps = React.ComponentProps<typeof Link> &
  VariantProps<typeof buttonVariants>;

/**
 * A navigation control that looks like a Button but is a real <a> (next/link).
 * Uses buttonVariants directly rather than the Base UI Button so it carries
 * correct link semantics (no button role) — the right element for navigation.
 */
export function LinkButton({
  href,
  className,
  variant,
  size,
  children,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </Link>
  );
}
