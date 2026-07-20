import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GraduationCap, Sparkles, LogOut, Award } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getDataSource } from "@/services";
import { signOut } from "@/features/auth/actions";
import { BrandMark } from "@/components/layout/brand";
import { internshipLifecycle } from "@/lib/internship";
import { formatDate } from "@/lib/format";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = { title: "Internship complete" };

export default async function InternshipCompletePage() {
  const user = await getCurrentUser();
  if (!user) redirect(ROUTES.login);

  // Admins/mentors don't belong here; and an intern whose internship is active
  // should be in the app, not on this page.
  const internship =
    user.role === "intern"
      ? await getDataSource().getActiveInternshipForUser(user.id)
      : null;
  const life = internship ? internshipLifecycle(internship) : null;
  if (user.role !== "intern" || life?.status === "active") {
    redirect(ROUTES.dashboard);
  }

  const firstName = user.fullName.split(" ")[0] ?? "there";
  const notStarted = life?.phase === "upcoming";

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 py-16">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="from-primary/10 pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b to-transparent blur-2xl"
      />

      <div className="relative w-full max-w-lg text-center">
        <div className="flex justify-center">
          <span className="bg-primary/10 text-primary ring-primary/20 flex size-16 items-center justify-center rounded-2xl ring-1">
            {notStarted ? (
              <Sparkles className="size-7" />
            ) : (
              <GraduationCap className="size-8" />
            )}
          </span>
        </div>

        <p className="text-muted-foreground mt-8 text-xs font-medium tracking-widest uppercase">
          {notStarted ? "Not quite yet" : "Internship complete"}
        </p>
        <h1 className="font-heading mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {notStarted
            ? `Almost there, ${firstName}`
            : `Congratulations, ${firstName}`}
        </h1>

        <p className="text-muted-foreground mx-auto mt-4 max-w-md leading-relaxed text-balance">
          {notStarted
            ? "Your internship hasn't started yet, so the workspace isn't open. We'll see you here the moment it begins."
            : "You've completed your internship at Callour Studio. Thank you for the reflection, the growth, and the care you brought each week — it genuinely mattered."}
        </p>

        {/* Period card */}
        {internship?.startDate ? (
          <div className="border-border bg-card mx-auto mt-8 max-w-sm rounded-2xl border p-5 text-left">
            <div className="flex items-center gap-2.5">
              <Award className="text-primary size-4" />
              <span className="text-sm font-medium">Your internship</span>
            </div>
            <p className="text-muted-foreground mt-2 text-sm">
              {formatDate(internship.startDate)}
              {internship.endDate ? ` – ${formatDate(internship.endDate)}` : ""}
            </p>
            {life?.totalDays ? (
              <p className="text-muted-foreground mt-1 text-xs">
                {Math.round(life.totalDays / 7)} weeks of reflection
              </p>
            ) : null}
          </div>
        ) : null}

        {!notStarted ? (
          <p className="text-muted-foreground mx-auto mt-8 max-w-md text-sm leading-relaxed text-balance">
            Keep reflecting, keep building. The habit of noticing how you grow is
            yours to keep — long after the internship ends.
          </p>
        ) : null}

        {/* Alumni placeholder */}
        {!notStarted ? (
          <div className="border-border/70 text-muted-foreground mx-auto mt-8 max-w-sm rounded-xl border border-dashed px-4 py-3 text-xs">
            🎓 An Alumni space — your growth story, past reflections, and the
            community — is coming soon.
          </div>
        ) : null}

        <form action={signOut} className="mt-10">
          <button
            type="submit"
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors outline-none focus-visible:ring-2"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </form>

        <div className="mt-10 flex items-center justify-center gap-2 opacity-60">
          <BrandMark className="size-5 rounded-md" />
          <span className="text-muted-foreground text-xs font-medium">
            Altiora · Callour Studio
          </span>
        </div>
      </div>
    </main>
  );
}
