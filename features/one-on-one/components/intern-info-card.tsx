import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { getInitials } from "@/lib/format";
import type { AppUser, Cohort } from "@/types/domain";

/** Intern context header for the 1-on-1 editor + read-only record views. */
export function InternInfoCard({
  intern,
  position,
  cohort,
  mentor,
  period,
}: {
  intern: Pick<AppUser, "id" | "fullName" | "avatarUrl">;
  position: string | null;
  cohort: Cohort | null;
  mentor: Pick<AppUser, "id" | "fullName" | "avatarUrl"> | null;
  period: string;
}) {
  const items = [
    { label: "Role", value: position ?? "—" },
    { label: "Cohort", value: cohort?.name ?? "—" },
    { label: "Mentor", value: mentor?.fullName ?? "Unassigned" },
    { label: "Month", value: period },
  ];
  return (
    <Card>
      <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Avatar className="size-12 shrink-0">
            {intern.avatarUrl ? (
              <AvatarImage src={intern.avatarUrl} alt="" />
            ) : null}
            <AvatarFallback>{getInitials(intern.fullName)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
              Intern
            </p>
            <p className="text-lg font-semibold">{intern.fullName}</p>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:ml-auto sm:grid-cols-4 sm:text-right">
          {items.map((i) => (
            <div key={i.label}>
              <dt className="text-muted-foreground text-xs">{i.label}</dt>
              <dd className="mt-0.5 text-sm font-medium">{i.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
