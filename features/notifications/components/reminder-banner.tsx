"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dismissNotification } from "../actions";
import { ROUTES } from "@/lib/constants";
import type { NotificationRecord } from "@/types/domain";

/** In-app reminder banners for the signed-in intern (unread notifications). */
export function ReminderBanner({
  notifications,
}: {
  notifications: NotificationRecord[];
}) {
  const router = useRouter();
  const [dismissed, setDismissed] = React.useState<Set<string>>(new Set());
  const visible = notifications.filter((n) => !dismissed.has(n.id));
  if (visible.length === 0) return null;

  async function dismiss(id: string) {
    setDismissed((s) => new Set(s).add(id)); // optimistic hide
    await dismissNotification(id);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      {visible.map((n) => (
        <div
          key={n.id}
          className="border-primary/30 bg-primary/[0.04] flex items-start gap-3 rounded-xl border p-4"
          role="status"
        >
          <span className="bg-primary/10 text-primary mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg">
            <Bell className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{n.title}</p>
            {n.body ? (
              <p className="text-muted-foreground text-sm">{n.body}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {n.type === "reflection_overdue" ? (
              <Button
                size="sm"
                nativeButton={false}
                render={<Link href={ROUTES.newReport} />}
              >
                Start
                <ArrowRight />
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Dismiss reminder"
              onClick={() => dismiss(n.id)}
            >
              <X />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
