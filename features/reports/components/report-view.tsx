import * as React from "react";
import {
  BookOpen,
  Check,
  Gauge,
  Clock,
  Sparkles,
  Target,
  MessageSquareQuote,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/shared/section-header";
import { moodLevel } from "@/lib/domain";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Lookups, WeeklyReportDetail } from "@/types/domain";

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
  lookups,
  showFeedback = true,
}: {
  report: WeeklyReportDetail;
  lookups: Lookups;
  showFeedback?: boolean;
}) {
  const nameById = new Map<string, string>();
  [
    ...lookups.skills,
    ...lookups.learningCategories,
    ...lookups.learningSources,
    ...lookups.projects,
  ].forEach((o) => nameById.set(o.id, o.name));

  const mood = moodLevel(report.mood);
  const skillsSorted = [...report.skillScores].sort((a, b) => {
    const oa = lookups.skills.find((s) => s.id === a.skillId)?.sortOrder ?? 0;
    const ob = lookups.skills.find((s) => s.id === b.skillId)?.sortOrder ?? 0;
    return oa - ob;
  });

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <Card>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Metric
            icon={Sparkles}
            label="Mood"
            value={mood ? `${mood.emoji} ${mood.label}` : "—"}
          />
          <Metric
            icon={Gauge}
            label="Satisfaction"
            value={
              report.satisfaction != null ? `${report.satisfaction}/10` : "—"
            }
          />
          <Metric
            icon={Target}
            label="Confidence"
            value={report.confidence != null ? `${report.confidence}/10` : "—"}
          />
          <Metric
            icon={Clock}
            label="Working hours"
            value={
              report.workingHours != null ? `${report.workingHours}h` : "—"
            }
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
          <ReflectionBlock
            label="How they approached it"
            value={report.solution}
          />
          <ReflectionBlock
            label="Mentor support needed"
            value={report.mentorHelp}
          />
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
              <div className="min-w-0 flex-1 space-y-1.5">
                <p className="text-sm font-medium">{log.title}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {log.learningCategoryId ? (
                    <Badge variant="secondary">
                      {nameById.get(log.learningCategoryId)}
                    </Badge>
                  ) : null}
                  {log.learningSourceId ? (
                    <Badge variant="outline">
                      {nameById.get(log.learningSourceId)}
                    </Badge>
                  ) : null}
                  {log.projectId ? (
                    <Badge variant="ghost">{nameById.get(log.projectId)}</Badge>
                  ) : null}
                  {log.applied ? (
                    <Badge variant="outline" className="gap-1">
                      <Check className="size-3" />
                      Applied
                    </Badge>
                  ) : null}
                  <span className="text-muted-foreground text-xs">
                    Impact {log.impact ?? "–"}/5 · Difficulty{" "}
                    {log.difficulty ?? "–"}/5
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Skills */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Skill self-assessment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {skillsSorted.map((s) => (
            <div key={s.skillId} className="flex items-center gap-4">
              <span className="w-36 shrink-0 text-sm">
                {nameById.get(s.skillId)}
              </span>
              <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                <div
                  className={cn("bg-primary h-full rounded-full")}
                  style={{ width: `${(s.score / 5) * 100}%` }}
                />
              </div>
              <span className="text-muted-foreground w-8 text-right text-sm tabular-nums">
                {s.score}/5
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

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
