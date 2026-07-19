"use client";

import * as React from "react";
import { toast } from "sonner";
import { Check, CircleCheck, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { markReportReviewed } from "@/features/reports/actions";

interface Props {
  reportId: string;
  internName: string;
  reviewedAt: string | null;
}

export function MentorReviewPanel({ reportId, internName, reviewedAt }: Props) {
  const [reviewed, setReviewed] = React.useState(reviewedAt != null);
  const [at, setAt] = React.useState(reviewedAt);
  const [saving, setSaving] = React.useState(false);

  async function onReview() {
    setSaving(true);
    const res = await markReportReviewed(reportId);
    setSaving(false);
    if (res.ok) {
      setReviewed(true);
      setAt(new Date().toISOString());
      toast.success("Marked as reviewed", {
        description: `${internName}'s reflection is checked off.`,
      });
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Eye className="text-primary size-4" />
          Review
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          Read {internName}&rsquo;s reflection, then mark it reviewed so it
          clears from your queue.
        </p>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4">
        {reviewed ? (
          <p className="text-success flex items-center gap-2 text-sm font-medium">
            <CircleCheck className="size-4" />
            Reviewed{at ? ` · ${formatDate(at)}` : ""}
          </p>
        ) : (
          <p className="text-muted-foreground text-sm">Not reviewed yet.</p>
        )}
        <Button onClick={onReview} disabled={saving || reviewed}>
          <Check />
          {reviewed ? "Reviewed" : saving ? "Saving…" : "Mark as reviewed"}
        </Button>
      </CardContent>
    </Card>
  );
}
