import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, formatRelative } from "@/lib/format";
import { monthLabel } from "@/lib/one-on-one";
import { ROUTES } from "@/lib/constants";
import type { OneOnOneListItem } from "@/types/domain";
import { OneOnOneStatusBadge } from "./one-on-one-status-badge";

/** The Monthly 1-on-1 management table (admin + mentor). */
export function ManagementList({ rows }: { rows: OneOnOneListItem[] }) {
  return (
    <div className="border-border overflow-hidden rounded-xl border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-border text-muted-foreground border-b text-left text-xs">
              <th className="px-4 py-2.5 font-medium">Intern</th>
              <th className="hidden px-4 py-2.5 font-medium sm:table-cell">
                Mentor
              </th>
              <th className="px-4 py-2.5 font-medium">Month</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="hidden px-4 py-2.5 font-medium md:table-cell">
                Last updated
              </th>
              <th className="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {rows.map((row) => {
              const href = ROUTES.oneOnOne(row.internshipId, row.year, row.month);
              return (
                <tr
                  key={`${row.internshipId}-${row.year}-${row.month}`}
                  className="hover:bg-muted/40 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8 shrink-0">
                        {row.intern.avatarUrl ? (
                          <AvatarImage src={row.intern.avatarUrl} alt="" />
                        ) : null}
                        <AvatarFallback>
                          {getInitials(row.intern.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{row.intern.fullName}</span>
                    </div>
                  </td>
                  <td className="text-muted-foreground hidden px-4 py-3 sm:table-cell">
                    {row.mentor?.fullName ?? "Unassigned"}
                  </td>
                  <td className="px-4 py-3">{monthLabel(row.year, row.month)}</td>
                  <td className="px-4 py-3">
                    <OneOnOneStatusBadge status={row.status} />
                  </td>
                  <td className="text-muted-foreground hidden px-4 py-3 md:table-cell">
                    {row.updatedAt ? formatRelative(row.updatedAt) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={href}
                      className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
                    >
                      {row.status === "completed"
                        ? "Edit"
                        : row.id
                          ? "Continue"
                          : "Start"}
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
