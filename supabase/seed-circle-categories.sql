-- Run this in your Supabase SQL editor.
-- 1. Adds "Cultural" and "Foodie" categories
-- 2. Renames "Bookworms" → "Book Club"
-- 3. Re-assigns circle categories

-- ── Add new categories ──────────────────────────────────────────────────────

INSERT INTO categories (id, name, color, slug)
VALUES
  ('55555555-5555-5555-5555-555555555555', 'Cultural',  '#a78bfa', 'cultural'),
  ('66666666-6666-6666-6666-666666666666', 'Foodie',    '#f59e0b', 'foodie')
ON CONFLICT (id) DO NOTHING;

-- ── Rename Bookworms → Book Club ────────────────────────────────────────────

UPDATE circles
SET name = 'Book Club 📚'
WHERE lower(name) LIKE '%bookworm%';

-- ── Assign categories ────────────────────────────────────────────────────────

-- Book Club → Cultural
UPDATE circles
SET category_id = '55555555-5555-5555-5555-555555555555'
WHERE lower(name) LIKE '%book club%' OR lower(name) LIKE '%bookworm%';

-- Yogis → Wellness (33333333)
UPDATE circles
SET category_id = '33333333-3333-3333-3333-333333333333'
WHERE lower(name) LIKE '%yogi%';

-- Wine Explorers → Foodie
UPDATE circles
SET category_id = '66666666-6666-6666-6666-666666666666'
WHERE lower(name) LIKE '%wine%';

-- Sunday Brunch Crew → Foodie
UPDATE circles
SET category_id = '66666666-6666-6666-6666-666666666666'
WHERE lower(name) LIKE '%brunch%';
