-- Phase 1: add Spanish columns to events, and pull current content so the
-- actual Spanish translations can be written to match your real copy
-- (rather than guessing/inventing text for live event listings).
--
-- Run this whole thing in the Supabase Dashboard SQL Editor, then paste
-- back BOTH result sets (the events list and the view definition).

-- 1. Add the new columns (safe to run even if they already exist)
alter table public.events add column if not exists title_es text;
alter table public.events add column if not exists description_es text;

-- 2. Pull every event's current English content so it can be translated
--    accurately
select id, title, description
from public.events
order by date;

-- 3. Check whether the events_with_spots view needs updating to expose the
--    new columns (only needed if it lists columns explicitly rather than
--    using select *)
select pg_get_viewdef('public.events_with_spots'::regclass, true) as view_definition;
