"use client";

import * as React from "react";
import { toast } from "sonner";
import { MessageSquareQuote, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RatingScale } from "@/features/weekly-report/components/rating-scale";
import { submitFeedback } from "@/features/reports/actions";

interface Props {
  reportId: string;
  internName: string;
  initial: {
    feedback: string;
    nextGoal: string;
    rating: number | null;
  };
}

export function MentorFeedbackForm({ reportId, internName, initial }: Props) {
  const [feedback, setFeedback] = React.useState(initial.feedback);
  const [nextGoal, setNextGoal] = React.useState(initial.nextGoal);
  const [rating, setRating] = React.useState<number | null>(initial.rating);
  const [saving, setSaving] = React.useState(false);

  async function onSubmit() {
    setSaving(true);
    const res = await submitFeedback(reportId, { feedback, nextGoal, rating });
    setSaving(false);
    if (res.ok)
      toast.success("Feedback shared", {
        description: `${internName} will see it.`,
      });
    else toast.error(res.error);
  }

  const hasExisting = initial.feedback.trim().length > 0;

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <MessageSquareQuote className="text-primary size-4" />
          {hasExisting ? "Your feedback" : "Give feedback"}
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          Coaching notes for {internName} — what they did well and where to grow
          next.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="fb">Feedback</Label>
          <Textarea
            id="fb"
            rows={4}
            placeholder="What stood out? What could go further?"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="goal">Next goal</Label>
          <Textarea
            id="goal"
            rows={2}
            placeholder="One focus for next week…"
            value={nextGoal}
            onChange={(e) => setNextGoal(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Rating</Label>
          <RatingScale
            ariaLabel="Rating out of 5"
            value={rating}
            onChange={setRating}
            minLabel="Needs support"
            maxLabel="Excellent"
            className="max-w-xs"
          />
        </div>
        <div className="flex justify-end">
          <Button
            onClick={onSubmit}
            disabled={saving || feedback.trim().length < 3}
          >
            <Send />
            {saving
              ? "Saving…"
              : hasExisting
                ? "Update feedback"
                : "Share feedback"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
