-- ============================================================================
-- Migration 0005 — Weekly Reflection: Weekly Playback + Instagram Story
--
-- Adds two optional weekly confirmations and a proof-image reference to
-- weekly_reports, plus a Supabase Storage bucket for the Instagram Story
-- screenshots. Safe + idempotent; run in the Supabase SQL editor.
-- ============================================================================

-- 1. New columns ---------------------------------------------------------------
-- Both confirmations are optional (never block submission), so they default
-- false. instagram_story_url is null when no proof image was uploaded.
alter table public.weekly_reports
  add column if not exists playback_completed        boolean not null default false,
  add column if not exists instagram_story_completed boolean not null default false,
  add column if not exists instagram_story_url       text;

-- 2. Storage bucket for Instagram Story proof screenshots ----------------------
-- Public bucket: images are served by unguessable UUID paths and shown as an
-- in-form preview. Only PNG/JPG are accepted (enforced client + server-side).
insert into storage.buckets (id, name, public)
values ('weekly-report-proofs', 'weekly-report-proofs', true)
on conflict (id) do nothing;

-- Anyone may read (public bucket → preview works via the public URL).
drop policy if exists "wrp_read" on storage.objects;
create policy "wrp_read" on storage.objects for select
  using (bucket_id = 'weekly-report-proofs');

-- Authenticated users (interns) may upload / replace / remove their proofs.
drop policy if exists "wrp_insert" on storage.objects;
create policy "wrp_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'weekly-report-proofs');

drop policy if exists "wrp_update" on storage.objects;
create policy "wrp_update" on storage.objects for update to authenticated
  using (bucket_id = 'weekly-report-proofs')
  with check (bucket_id = 'weekly-report-proofs');

drop policy if exists "wrp_delete" on storage.objects;
create policy "wrp_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'weekly-report-proofs');
