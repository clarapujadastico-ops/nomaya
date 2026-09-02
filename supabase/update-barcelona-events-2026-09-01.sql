-- 2026-09-01: remove Yoga + Matcha (Barcelona), update Dinner Club (Barcelona)
-- to match Madrid's payment-at-venue format + add approx price notes.

alter table public.events add column if not exists price_note text;

-- events_with_spots must have new columns appended at the end, not inserted
-- in the middle (Postgres won't allow replacing a view that removes/reorders
-- columns) -- see project memory.
drop view if exists public.events_with_spots;
create view public.events_with_spots as
select
  e.id,
  e.title,
  e.description,
  e.date,
  e.time,
  e.city,
  e.total_spots,
  e.price_cents,
  e.currency,
  e.category_id,
  e.image_url,
  e.is_featured,
  e.is_tbc,
  e.latitude,
  e.longitude,
  e.created_at,
  e.payment_at_venue,
  greatest(e.total_spots - count(b.id), 0::bigint)::integer as spots_left,
  c.name as category_name,
  c.slug as category_slug,
  c.color as category_color,
  e.title_es,
  e.description_es,
  e.venue_address,
  e.venue_name,
  e.price_note
from events e
left join bookings b on b.event_id = e.id and b.status = 'confirmed'
left join categories c on c.id = e.category_id
group by e.id, c.id;

grant select on public.events_with_spots to anon, authenticated;

delete from public.events where title = 'Yoga + Matcha' and city = 'Barcelona';

update public.events
set
  time = '21:00:00',
  total_spots = 8,
  price_cents = 0,
  payment_at_venue = true,
  venue_name = 'Barra Oso',
  venue_address = 'Carrer de Muntaner, 248, Sarrià-Sant Gervasi, 08021 Barcelona, España',
  price_note = '35-40€'
where title = 'Dinner Club' and city = 'Barcelona';

update public.events
set price_note = '20-30€'
where title = 'Dinner Club' and city = 'Madrid';
