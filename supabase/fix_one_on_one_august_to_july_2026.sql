-- ============================================================================
-- Data fix — reattribute the first 1-on-1 cycle from August 2026 → July 2026.
--
-- The Monthly 1-on-1 feature launched for the JULY cycle, but several mentors
-- only ran the meeting in early August, so the record was stamped "August 2026"
-- (the fill-date month) instead of the cycle it belongs to. Every existing
-- 1-on-1 record is really the July check-in. This moves them back to July.
--
-- Safe + idempotent. Run in the Supabase SQL editor. The UPDATE skips any row
-- whose internship already has a July 2026 record (unique index guard) — none
-- are expected; any skipped rows are printed by the final SELECT so you can
-- reconcile them by hand.
-- ============================================================================

-- 1) Preview: what will move.
select id, internship_id, mentor_id, year, month, status, updated_at
from public.monthly_one_on_ones
where year = 2026 and month = 8
order by updated_at;

-- 2) Reattribute Aug 2026 → Jul 2026, but never collide with an existing
--    July 2026 record for the same internship.
update public.monthly_one_on_ones aug
set month = 7
where aug.year = 2026
  and aug.month = 8
  and not exists (
    select 1
    from public.monthly_one_on_ones jul
    where jul.internship_id = aug.internship_id
      and jul.year = 2026
      and jul.month = 7
  );

-- 3) Leftovers: any Aug 2026 rows that could NOT be moved because a July 2026
--    record already existed for that internship. Expected: 0 rows.
select id, internship_id, mentor_id, year, month, status
from public.monthly_one_on_ones
where year = 2026 and month = 8
order by updated_at;
