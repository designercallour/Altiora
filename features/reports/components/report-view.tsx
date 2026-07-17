import * as React from "react";
import { BookOpen, Sparkles, MessageSquareQuote, Brain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/shared/section-header";
import { moodLevel } from "@/lib/domain";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  LearningImportance,
  Lookups,
  WeeklyReportDetail,
} from "@/types/domain";

const IMPORTANCE_TONE: Record<LearningImportance, string> = {
  High: "border-success/40 text-success",
  Medium: "border-primary/40 text-primary",
  Low: "border-border text-muted-foreground",
};

function ReflectionBlock({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  if (!value) return null;
  return (
    <div className="space-y-1.5">
      <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {label}
      </h3>
      <p className="text-sm leading-relaxed whitespace-pre-line">{value}</p>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="bg-muted text-muted-foreground flex size-8 items-center justify-center rounded-lg">
        <Icon className="size-4" />
      </span>
      <div className="leading-tight">
        <p className="text-sm font-medium tabular-nums">{value}</p>
        <p className="text-muted-foreground text-xs">{label}</p>
      </div>
    </div>
  );
}

export function ReportView({
  report,
  showFeedback = true,
}: {
  report: WeeklyReportDetail;
  lookups?: Lookups;
  showFeedback?: boolean;
}) {
  const mood = moodLevel(report.mood);

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <Card>
        <CardContent className="grid grid-cols-2 gap-4">
          <Metric
            icon={Sparkles}
            label="Mood"
            value={mood ? `${mood.emoji} ${mood.label}` : "—"}
          />
          <Metric
            icon={BookOpen}
            label="Learnings captured"
            value={`${report.learningLogs.length}`}
          />
        </CardContent>
      </Card>

      {/* Reflection */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Reflection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <ReflectionBlock
            label="Biggest achievement"
            value={report.achievement}
          />
          <ReflectionBlock label="Challenge" value={report.challenge} />
        </CardContent>
      </Card>

      {/* Learning logs */}
      <section className="space-y-3">
        <SectionHeader
          title="Learning log"
          description={`${report.learningLogs.length} ${report.learningLogs.length === 1 ? "learning" : "learnings"} captured this week`}
          icon={BookOpen}
        />
        <ul className="space-y-2.5">
          {report.learningLogs.map((log) => (
            <li
              key={log.id}
              className="border-border bg-card flex items-start gap-3 rounded-xl border p-3.5"
            >
              <span className="bg-primary/10 text-primary mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg">
                <BookOpen className="size-4" />
              </span>
              <p className="min-w-0 flex-1 text-sm leading-relaxed whitespace-pre-line">
                {log.title}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Learning intelligence (AI-extracted) */}
      {report.intelligence && report.intelligence.skills.length > 0 ? (
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Brain className="text-primary size-4" />
              Learning intelligence
            </CardTitle>
            {report.intelligence.summary ? (
              <p className="text-muted-foreground text-sm">
                {report.intelligence.summary}
              </p>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Skills */}
            <div className="space-y-2.5">
              {report.intelligence.skills.map((s) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm font-medium">
                      {s.name}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {s.learningStatus}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("shrink-0", IMPORTANCE_TONE[s.importance])}
                  >
                    {s.importance}
                  </Badge>
                </div>
              ))}
            </div>

            {/* Concepts */}
            {report.intelligence.concepts.length > 0 ? (
              <div className="space-y-2">
                <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Concepts
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {report.intelligence.concepts.map((c) => (
                    <Badge key={c.name} variant="secondary">
                      {c.name}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

          </CardContent>
        </Card>
      ) : null}

      {/* Mentor feedback (read-only) */}
      {showFeedback && report.feedback && report.feedback.feedback ? (
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <MessageSquareQuote className="text-primary size-4" />
              Mentor feedback
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed whitespace-pre-line">
              {report.feedback.feedback}
            </p>
            {report.feedback.nextGoal ? (
              <div className="bg-accent/50 rounded-lg p-3">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Next goal
                </p>
                <p className="mt-1 text-sm">{report.feedback.nextGoal}</p>
              </div>
            ) : null}
            {report.feedback.rating != null ? (
              <p className="text-muted-foreground text-xs">
                Rated {report.feedback.rating}/5 ·{" "}
                {formatDate(report.feedback.createdAt)}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
