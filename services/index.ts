/**
 * The one entry point features use for data.
 *
 *   import { getDataSource } from "@/services";
 *   const db = getDataSource();
 *   const reports = await db.listReports({ userId });
 *
 * Never import `@/supabase/*` or `./mock/*` from a feature — go through here.
 * The active implementation is chosen by NEXT_PUBLIC_DATA_SOURCE.
 */

import type { DataSource } from "./data-source";
import { MockDataSource } from "./mock/mock-data-source";
import { SupabaseDataSource } from "./supabase-data-source";

export type DataSourceMode = "mock" | "supabase";

export function resolveDataSourceMode(): DataSourceMode {
  return process.env.NEXT_PUBLIC_DATA_SOURCE === "supabase"
    ? "supabase"
    : "mock";
}

let instance: DataSource | null = null;

export function getDataSource(): DataSource {
  if (instance) return instance;
  instance =
    resolveDataSourceMode() === "supabase"
      ? new SupabaseDataSource()
      : new MockDataSource();
  return instance;
}

/** Test/util seam — reset the memoized singleton. */
export function __resetDataSource(): void {
  instance = null;
}

export type * from "./data-source";
