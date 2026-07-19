-- ============================================================================
-- Migration 0002 — login allowlist
--
-- Only emails on `public.allowed_emails` may access Altiora. A Google account
-- that isn't listed can authenticate with Google but gets NO app account, and
-- the app (middleware) turns it away at the login screen.
--
-- Admins manage the allowlist:
--   insert into public.allowed_emails (email, role) values ('x@y.com','mentor')
--     on conflict (email) do update set role = excluded.role;
--   delete from public.allowed_emails where email = 'x@y.com';  -- revoke future logins
--
-- Idempotent — safe to re-run.
-- ============================================================================

-- 1. Allowlist table (email → role) ---------------------------------------------
create table if not exists public.allowed_emails (
  email      citext primary key,
  role       user_role not null default 'intern',
  created_at timestamptz not null default now()
);

alter table public.allowed_emails enable row level security;
drop policy if exists "allowed_emails_admin" on public.allowed_emails;
create policy "allowed_emails_admin" on public.allowed_emails for all
  using (public.is_admin()) with check (public.is_admin());

-- 2. Seed the allowlist ---------------------------------------------------------
-- Keep everyone who has already signed in with Google (don't lock them out)...
insert into public.allowed_emails (email, role)
select email, role
from public.users
where auth_id is not null and deleted_at is null
on conflict (email) do nothing;

-- ...then set the known team + their roles.
insert into public.allowed_emails (email, role) values
  ('panggih@callourstudio.com', 'admin'),
  ('alfikri@callourstudio.com', 'admin'),
  ('dicky@callourstudio.com',   'admin'),
  ('temmycallour@gmail.com',    'mentor'),
  ('abdurcallour@gmail.com',    'mentor'),
  ('nasikcallour@gmail.com',    'mentor'),
  ('firmancallour@gmail.com',   'mentor'),
  ('jehianathayata@gmail.com',  'intern'),
  ('devrizalcallour@gmail.com', 'intern'),
  ('helloachasn@gmail.com',     'intern'),
  ('ismailcallour@gmail.com',   'intern')
on conflict (email) do update set role = excluded.role;

-- Bring any already-created accounts in line with the allowlist role.
update public.users u
set role = a.role
from public.allowed_emails a
where u.email = a.email
  and u.deleted_at is null
  and u.role <> a.role;

-- 3. Provision only allowlisted emails on Google signup -------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role user_role;
begin
  select role into v_role from public.allowed_emails where email = new.email;

  if v_role is null then
    -- Not on the allowlist → no app account is created → the app blocks them.
    return new;
  end if;

  -- Link a pre-existing row (seed / prior login) or create a fresh one.
  update public.users
     set auth_id = new.id, role = v_role
   where email = new.email and deleted_at is null;

  if not found then
    insert into public.users (auth_id, email, full_name, avatar_url, role)
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data ->> 'full_name',
               new.raw_user_meta_data ->> 'name',
               split_part(new.email, '@', 1)),
      new.raw_user_meta_data ->> 'avatar_url',
      v_role
    );
  end if;

  return new;
end;
$$;
