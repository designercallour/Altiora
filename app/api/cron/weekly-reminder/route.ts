import { NextResponse } from "next/server";
import { getDataSource, resolveDataSourceMode } from "@/services";
import { SupabaseDataSource } from "@/services/supabase-data-source";
import { remindInternsForWeek } from "@/features/notifications/reminders";
import { weekRangeFrom } from "@/lib/week";

export const dynamic = "force-dynamic";

/**
 * Weekly-report reminder job. Scheduled every Friday via vercel.json; can also
 * be invoked manually (e.g. a one-off catch-up) with the same auth.
 *
 * Reminds every ACTIVE intern who hasn't submitted LAST week's report. Runs with
 * a service-role client in Supabase mode so it can write for all interns.
 *
 * Auth: Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`. When CRON_SECRET
 * is set, the header must match; when unset (local dev) the route is open.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  // Which week to remind about. Default 0 = the current (ending) week — the
  // Friday run prompts interns to reflect on the week that's wrapping up.
  // `?offset=-1` targets last week (manual catch-up). Clamped.
  const raw = Number(new URL(req.url).searchParams.get("offset") ?? "0");
  const offset = Number.isFinite(raw) ? Math.min(0, Math.max(-8, raw)) : 0;
  const target = weekRangeFrom(now, offset);

  const db =
    resolveDataSourceMode() === "supabase"
      ? new SupabaseDataSource({ admin: true })
      : getDataSource();

  try {
    const result = await remindInternsForWeek(
      db,
      target.year,
      target.week,
      now,
    );
    return NextResponse.json({ ok: true, week: target, ...result });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 },
    );
  }
}
