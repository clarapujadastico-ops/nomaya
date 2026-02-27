-- ============================================================
-- Nomaya Database Schema
-- Run this in the Supabase SQL editor (once, top to bottom)
-- ============================================================

-- ── Tables ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.categories (
  id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name  text NOT NULL,
  slug  text NOT NULL UNIQUE,
  color text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text        NOT NULL DEFAULT '',
  city       text        NOT NULL DEFAULT '',
  bio        text,
  avatar_url text,
  language   text        NOT NULL DEFAULT 'en',
  interests  text[]      NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text        NOT NULL,
  description text        NOT NULL DEFAULT '',
  date        date        NOT NULL,
  time        time        NOT NULL,
  city        text        NOT NULL,
  total_spots int         NOT NULL DEFAULT 10,
  price_cents int         NOT NULL DEFAULT 0,
  currency    text        NOT NULL DEFAULT 'EUR',
  category_id uuid        REFERENCES public.categories(id),
  image_url   text,
  is_featured boolean     NOT NULL DEFAULT false,
  latitude    float8,
  longitude   float8,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bookings (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id   uuid        NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  status     text        NOT NULL DEFAULT 'confirmed'
               CHECK (status IN ('confirmed', 'cancelled', 'waitlisted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_id)
);

-- ── View: events with spots left + category info ─────────────

CREATE OR REPLACE VIEW public.events_with_spots AS
SELECT
  e.*,
  c.name  AS category_name,
  c.slug  AS category_slug,
  c.color AS category_color,
  (e.total_spots - COUNT(b.id) FILTER (WHERE b.status = 'confirmed'))::int AS spots_left
FROM public.events e
LEFT JOIN public.categories c ON c.id = e.category_id
LEFT JOIN public.bookings   b ON b.event_id = e.id
GROUP BY e.id, c.id;

-- ── Row Level Security ───────────────────────────────────────

ALTER TABLE public.profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Authenticated users can read all profiles"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- events (read-only for authenticated users)
CREATE POLICY "Authenticated users can read events"
  ON public.events FOR SELECT TO authenticated USING (true);

-- categories (public read)
CREATE POLICY "Anyone can read categories"
  ON public.categories FOR SELECT USING (true);

-- bookings
CREATE POLICY "Users can read their own bookings"
  ON public.bookings FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings"
  ON public.bookings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings"
  ON public.bookings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- ── Seed: Categories ─────────────────────────────────────────

INSERT INTO public.categories (id, name, slug, color) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Food & Dining',    'food',            'hsl(15 60% 55%)'),
  ('22222222-2222-2222-2222-222222222222', 'Arts & Crafts',    'arts',            'hsl(280 38% 55%)'),
  ('33333333-3333-3333-3333-333333333333', 'Wellness',         'wellness',        'hsl(140 35% 45%)'),
  ('44444444-4444-4444-4444-444444444444', 'Entrepreneurship', 'entrepreneurship','hsl(200 50% 45%)'),
  ('55555555-5555-5555-5555-555555555555', 'Culture',          'culture',         'hsl(340 50% 55%)')
ON CONFLICT (id) DO NOTHING;

-- ── Seed: Events ─────────────────────────────────────────────

INSERT INTO public.events
  (title, description, date, time, city, total_spots, price_cents, currency, category_id, is_featured, latitude, longitude)
VALUES
  (
    'Sunday Brunch & Conversation',
    'A carefully curated Sunday brunch for women who love meaningful conversation. Small group, beautiful setting. Come as you are.',
    '2026-03-02', '11:00', 'Barcelona', 10, 2800, 'EUR',
    '11111111-1111-1111-1111-111111111111', true, 41.3851, 2.1734
  ),
  (
    'Ceramics Circle',
    'Get your hands dirty in a beautiful ceramics studio. No experience needed — just curiosity and a willingness to play.',
    '2026-03-08', '16:00', 'Madrid', 12, 4500, 'EUR',
    '22222222-2222-2222-2222-222222222222', true, 40.4168, -3.7038
  ),
  (
    'Sunrise Yoga in the Garden',
    'Start your weekend with an outdoor sunrise yoga session in a private garden. All levels welcome.',
    '2026-03-15', '08:00', 'Barcelona', 8, 1800, 'EUR',
    '33333333-3333-3333-3333-333333333333', false, 41.3851, 2.1734
  ),
  (
    'Founders Coffee Circle',
    'An informal gathering for women building companies. Share challenges, celebrate wins, make real friends.',
    '2026-03-20', '09:30', 'Madrid', 8, 0, 'EUR',
    '44444444-4444-4444-4444-444444444444', false, 40.4168, -3.7038
  ),
  (
    'Watercolour Afternoon',
    'A gentle afternoon of watercolour painting guided by a local artist. Materials provided. Wine included.',
    '2026-03-22', '15:00', 'Seville', 10, 3500, 'EUR',
    '22222222-2222-2222-2222-222222222222', false, 37.3891, -5.9845
  )
ON CONFLICT DO NOTHING;

-- ── Circle spots & votes ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.circle_spots (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id     uuid REFERENCES public.circles(id) ON DELETE CASCADE,
  added_by      uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  name          text NOT NULL,
  note          text,
  google_maps_url text,
  vote_count    integer NOT NULL DEFAULT 0,
  is_confirmed  boolean NOT NULL DEFAULT false,
  proposed_date date,
  created_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.circle_spots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "circle members can manage spots" ON public.circle_spots FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.circle_spot_votes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id    uuid REFERENCES public.circle_spots(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (spot_id, user_id)
);
ALTER TABLE public.circle_spot_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own spot votes" ON public.circle_spot_votes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Circle proposals & interest ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.circle_proposals (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposed_by    uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  name           text NOT NULL,
  description    text,
  city           text NOT NULL DEFAULT 'Madrid',
  status         text NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'active', 'official')),
  interest_count integer NOT NULL DEFAULT 0,
  meeting_count  integer NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.circle_proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone views proposals"   ON public.circle_proposals FOR SELECT USING (true);
CREATE POLICY "users create proposals"   ON public.circle_proposals FOR INSERT WITH CHECK (auth.uid() = proposed_by);
CREATE POLICY "system updates proposals" ON public.circle_proposals FOR UPDATE USING (true);

CREATE TABLE IF NOT EXISTS public.circle_proposal_interest (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES public.circle_proposals(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (proposal_id, user_id)
);
ALTER TABLE public.circle_proposal_interest ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own proposal interest" ON public.circle_proposal_interest FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Event interest (notify-me for TBC events) ────────────────
CREATE TABLE IF NOT EXISTS public.event_interest (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id   uuid REFERENCES public.events(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_id)
);
ALTER TABLE public.event_interest ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own event interest" ON public.event_interest FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "anyone reads event interest counts" ON public.event_interest FOR SELECT USING (true);

-- ── Event group messages & photos ────────────────────────────
CREATE TABLE IF NOT EXISTS public.event_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   uuid REFERENCES public.events(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  content    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.event_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attendees can message" ON public.event_messages FOR ALL USING (true) WITH CHECK (true);
