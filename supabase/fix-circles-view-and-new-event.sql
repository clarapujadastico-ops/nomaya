-- ============================================================
-- Run this in the Supabase SQL Editor (Dashboard → SQL editor)
-- ============================================================

-- ── 1. Fix circles_with_members view to include event_id ─────
-- (Without event_id, the app query .is('event_id', null) fails
--  and returns nothing, causing circles to not appear)

CREATE OR REPLACE VIEW public.circles_with_members AS
SELECT
  c.id,
  c.name,
  c.description,
  c.category_id,
  c.cover_url,
  c.city,
  c.is_private,
  c.event_policy,
  c.event_id,
  c.created_by,
  c.created_at,
  COALESCE(COUNT(cm.id), 0)::int AS member_count,
  cat.name  AS category_name,
  cat.slug  AS category_slug,
  cat.color AS category_color
FROM public.circles c
LEFT JOIN public.circle_memberships cm ON cm.circle_id = c.id
LEFT JOIN public.categories cat ON cat.id = c.category_id
GROUP BY
  c.id, c.name, c.description, c.category_id, c.cover_url,
  c.city, c.is_private, c.event_policy, c.event_id,
  c.created_by, c.created_at,
  cat.name, cat.slug, cat.color;


-- ── 2. Insert new event: Holistic Vinyasa + Light Brunch ──────
-- Fitness category (find it by name dynamically)

INSERT INTO public.events (
  title, description, date, time, city,
  total_spots, price_cents, currency,
  category_id, is_tbc, is_featured
)
SELECT
  'Holistic Vinyasa + Light Brunch',
  'A mindful vinyasa flow followed by a nourishing light brunch. Move, breathe, and connect with like-minded women in a beautiful Madrid space.',
  '2026-03-08',
  '10:00',
  'Madrid',
  12,
  2000,
  'EUR',
  id,
  false,
  false
FROM public.categories
WHERE name = 'Fitness'
LIMIT 1;
