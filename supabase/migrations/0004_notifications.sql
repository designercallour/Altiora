-- ============================================================================
-- Migration 0004 — In-app notifications (weekly-report reminders, etc.)
-- ============================================================================
-- Additive and idempotent. Backs the in-app reminder inbox. Rows are written
-- by the system (admin session or the service-role cron client) and read by the
-- recipient. See ADR-0008 (notification architecture) — this is the first real
-- delivery channel: in-app.
-- ============================================================================

create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.users (id) on delete cascade,
  type         text not null,
  title        text not null,
  body         text,
  payload      jsonb not null default '{}',
  -- Optional idempotency key (e.g. 'reflection_overdue:2026:29'); a recipient
  -- never gets the same keyed notification twice.
  dedupe_key   text,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists notifications_recipient_unread_idx
  on public.notifications (recipient_id, created_at desc)
  where read_at is null;

create unique index if not exists notifications_dedupe_key
  on public.notifications (recipient_id, dedupe_key)
  where dedupe_key is not null;

-- RLS -------------------------------------------------------------------------
alter table public.notifications enable row level security;

drop policy if exists "notifications_admin_all"   on public.notifications;
drop policy if exists "notifications_own_select"  on public.notifications;
drop policy if exists "notifications_own_update"  on public.notifications;

-- Admins manage all.
create policy "notifications_admin_all" on public.notifications for all
  using (public.is_admin()) with check (public.is_admin());

-- A user reads their own notifications.
create policy "notifications_own_select" on public.notifications for select
  using (recipient_id = public.current_app_user_id());

-- A user may update their own (only to mark read).
create policy "notifications_own_update" on public.notifications for update
  using (recipient_id = public.current_app_user_id())
  with check (recipient_id = public.current_app_user_id());

-- Inserts come from an admin session or the service-role cron client (both
-- bypass/satisfy the policies above); no self-insert policy is granted.
