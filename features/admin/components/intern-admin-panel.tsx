import {
  CalendarDays,
  Clock,
  History,
  Pencil,
  Trash2,
  UserCog,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/shared/status-chip";
import { InternFormDialog } from "./intern-form-dialog";
import { AssignMentorDialog } from "./assign-mentor-dialog";
import { ArchiveButton } from "./archive-button";
import { archiveInternAction } from "@/features/admin/actions";
import { formatDate } from "@/lib/format";
import { internshipLifecycle } from "@/lib/internship";
import { ROUTES } from "@/lib/constants";
import type { Cohort, InternDetail, MentorSummary } from "@/types/domain";

/** Admin-only management surface on an intern's detail page. */
export function InternAdminPanel({
  detail,
  cohorts,
  mentors,
}: {
  detail: InternDetail;
  cohorts: Cohort[];
  mentors: MentorSummary[];
}) {
  const { internship, user } = detail;
  if (!internship) return null;
  const life = internshipLifecycle(internship);
  const firstName = user.fullName.split(" ")[0];

  const rows: { label: string; value: React.ReactNode }[] = [
    {
      label: "Period",
      value: `${formatDate(internship.startDate)} – ${
        internship.endDate ? formatDate(internship.endDate) : "open"
      }`,
    },
    { label: "Cohort", value: detail.cohort?.name ?? "—" },
    { label: "Role", value: internship.position ?? "—" },
    { label: "Mentor", value: detail.mentor?.fullName ?? "Unassigned" },
    {
      label: "Time left",
      value:
        life.status === "active" && life.weeksRemaining != null
          ? `${life.weeksRemaining} week${life.weeksRemaining === 1 ? "" : "s"}`
          : "—",
    },
  ];

  return (
    <Card className="border-primary/15">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <UserCog className="text-primary size-4" />
            Manage intern
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <StatusChip internship={internship} />
            <InternFormDialog
              cohorts={cohorts}
              mentors={mentors}
              detail={detail}
              trigger={
                <Button variant="outline" size="sm">
                  <Pencil />
                  Edit
                </Button>
              }
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
          {rows.map((r) => (
            <div key={r.label}>
              <dt className="text-muted-foreground text-xs">{r.label}</dt>
              <dd className="mt-0.5 truncate text-sm font-medium">{r.value}</dd>
            </div>
          ))}
        </dl>

        {internship.notes ? (
          <div className="bg-muted/40 rounded-lg p-3">
            <p className="text-muted-foreground mb-1 flex items-center gap-1.5 text-xs">
              <CalendarDays className="size-3.5" />
              Notes
            </p>
            <p className="text-sm whitespace-pre-wrap">{internship.notes}</p>
          </div>
        ) : null}

        {/* Mentor assignment */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <div>
            <p className="text-sm font-medium">Mentor</p>
            <p className="text-muted-foreground text-sm">
              {detail.mentor
                ? `${detail.mentor.fullName} currently mentors ${firstName}.`
                : `${firstName} has no mentor yet.`}
            </p>
          </div>
          <AssignMentorDialog
            internshipId={internship.id}
            internName={firstName}
            mentors={mentors}
            currentMentorId={internship.mentorId}
            trigger={
              <Button size="sm" variant={detail.mentor ? "outline" : "default"}>
                <UserCog />
                {detail.mentor ? "Reassign" : "Assign mentor"}
              </Button>
            }
          />
        </div>

        {/* Mentor history */}
        {detail.assignments.length > 0 ? (
          <div className="border-t pt-4">
            <p className="mb-3 flex items-center gap-1.5 text-sm font-medium">
              <History className="text-muted-foreground size-4" />
              Mentor history
            </p>
            <ol className="space-y-2.5">
              {detail.assignments.map((a) => (
                <li key={a.id} className="flex items-start gap-3 text-sm">
                  <Clock className="text-muted-foreground mt-0.5 size-3.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium">
                      {a.mentor?.fullName ?? "Unknown mentor"}
                      {a.endedAt == null ? (
                        <span className="text-success ml-2 text-xs font-normal">
                          current
                        </span>
                      ) : null}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatDate(a.startedAt)} –{" "}
                      {a.endedAt ? formatDate(a.endedAt) : "now"}
                      {a.note ? ` · ${a.note}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        {/* Danger zone */}
        <div className="border-t pt-4">
          <ArchiveButton
            title={`Remove ${user.fullName}?`}
            description="The intern is archived and can no longer sign in. Their reports and history are preserved."
            successMessage="Intern removed"
            redirectTo={ROUTES.adminInterns}
            action={archiveInternAction.bind(null, internship.id)}
            trigger={
              <Button variant="destructive" size="sm">
                <Trash2 />
                Remove intern
              </Button>
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
