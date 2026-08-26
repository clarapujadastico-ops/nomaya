create or replace view public.events_with_spots as
SELECT e.id,
    e.title,
    e.description,
    e.date,
    e."time",
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
    GREATEST(e.total_spots - count(b.id), 0::bigint)::integer AS spots_left,
    c.name AS category_name,
    c.slug AS category_slug,
    c.color AS category_color,
    e.title_es,
    e.description_es
   FROM events e
     LEFT JOIN bookings b ON b.event_id = e.id AND b.status = 'confirmed'::text
     LEFT JOIN categories c ON c.id = e.category_id
  GROUP BY e.id, c.id;
