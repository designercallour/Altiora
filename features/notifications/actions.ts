"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { getDataSource } from "@/services";
import { ROUTES } from "@/lib/constants";

/** Mark one of the current user's notifications as read (dismiss). */
export async function dismissNotification(
  id: string,
): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  // RLS restricts updates to the caller's own notifications in Supabase mode.
  await getDataSource().markNotificationRead(id);
  revalidatePath(ROUTES.dashboard);
  return { ok: true };
}
