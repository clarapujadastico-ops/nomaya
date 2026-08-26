-- Rebuild the events list for September 2026: delete all old test events
-- except Horseback Riding (kept, marked Coming Soon), and add the new
-- Madrid + Barcelona calendar. Wrapped in a transaction: if anything fails
-- (e.g. a column name mismatch), nothing is applied — report the error back.

begin;

-- 1. Delete the duplicate Horseback Riding entry and all other old events,
--    keeping only '6f016ae0-...' (Horseback Riding), which we mark TBC below.
delete from public.events where id in (
  '1c621884-e228-43a8-ac52-05954cd81427', -- Brunch + Painting Ceramics
  'e67cdc3c-9e05-489e-b03c-c3a5ed6a8f91', -- Jewelry & Wine Workshop
  '59ee9362-9780-415d-a5a1-ce4241a2c2c9', -- Holistic Vinyasa & Light Brunch
  '85ebd488-aef5-414e-98a9-0d3cbdad0c63', -- Nomaya Dinner Club (old)
  'b395fa6b-4406-4d00-84f4-18e4943c5f19', -- Movie Night
  '7c94042e-6400-4614-a557-86382204eb7f', -- Cookies Cooking Club
  '3f241619-7400-489c-b4e6-be94164002c9', -- Yoga Class + Picnic (old)
  'dd8d610d-f0e7-4884-99c9-eb5009b8b3ca', -- Segovia Day Trip (old)
  '8cd2660f-679b-4bfc-a9fa-d87cd60499ef', -- Longevity Session
  '75bcebae-b7e5-4244-8c7d-1054b7b87133', -- Founding Members Afterwork
  '8ddffd74-75bf-4c16-bf45-c1c8de1f164e', -- Ski Weekend Sierra Nevada
  'a783e29b-9130-49d2-a51a-88dad6dd51a8', -- Yoga Retreat in the Mountains
  '2f43d713-2405-4f61-9a69-39e22a8afb70', -- Journal Workshop
  '4e4ca655-dc0a-4143-9466-ae0c6b84ff6d', -- Pottery Painting Session (old)
  'fce47958-f43d-461f-a9e1-38b04112306c', -- Horseback Riding Day Trip (duplicate)
  '1d693c3e-7db8-4149-80f5-f88a09c9caeb'  -- Matcha Workshop (old)
);

-- 2. Keep Horseback Riding, mark it Coming Soon
update public.events set is_tbc = true
  where id = '6f016ae0-ab2d-4b75-8ae5-9cf5e10735f3';

-- 3. New Madrid events (placeholder time/price/capacity — update later)
insert into public.events (title, title_es, description, description_es, date, time, city, category_id, image_url, price_cents, total_spots)
values
  ('Running Club', 'Club de Running',
   'A morning run through Madrid with a group of women who love to move. All paces welcome — it''s about showing up together, not speed.',
   'Una carrera matutina por Madrid con un grupo de mujeres a las que les encanta moverse. Todos los ritmos son bienvenidos — se trata de presentarse juntas, no de velocidad.',
   '2026-09-05', '09:00', 'Madrid', '33333333-3333-3333-3333-333333333333',
   'https://jtoftrghfwdffrkqejlq.supabase.co/storage/v1/object/public/Events/running-club.jpg', 0, 10),

  ('Pottery Workshop', 'Taller de Cerámica',
   'Get your hands in the clay and learn the basics of pottery in a relaxed, creative session with fellow members.',
   'Ensúciate las manos con el barro y aprende los fundamentos de la cerámica en una sesión relajada y creativa junto a otras miembros.',
   '2026-09-11', '18:00', 'Madrid', '22222222-2222-2222-2222-222222222222',
   'https://jtoftrghfwdffrkqejlq.supabase.co/storage/v1/object/public/Events/ceramics.JPG', 0, 10),

  ('Book Club: Gelato Edition', 'Club de Lectura: Edición Gelato',
   'Discuss this month''s pick over gelato on a warm evening. Haven''t read it yet? Come anyway — great conversation is the real point.',
   'Hablamos del libro del mes tomando un gelato en una tarde cálida. ¿No has leído el libro todavía? Ven igual — la buena conversación es lo importante.',
   '2026-09-15', '19:00', 'Madrid', '55555555-5555-5555-5555-555555555555',
   'https://jtoftrghfwdffrkqejlq.supabase.co/storage/v1/object/public/Events/book-club-gelato.jpg', 0, 10),

  ('Welcome Back Picnic', 'Picnic de Bienvenida',
   'Kick off the new season with a relaxed picnic in the park — good food, good company, and a warm welcome back to the community.',
   'Empieza la nueva temporada con un picnic relajado en el parque — buena comida, buena compañía y una cálida bienvenida de vuelta a la comunidad.',
   '2026-09-20', '13:00', 'Madrid', '11111111-1111-1111-1111-111111111111',
   'https://jtoftrghfwdffrkqejlq.supabase.co/storage/v1/object/public/Events/welcome-back-picnic.jpg', 0, 10),

  ('Day Trip: Segovia', 'Excursión de un Día: Segovia',
   'A day trip to discover Segovia together — the iconic Roman aqueduct, the old city, and a leisurely lunch. Transportation included from central Madrid.',
   'Una excursión de un día para descubrir Segovia juntas — el icónico acueducto romano, el casco antiguo y una comida tranquila. Transporte incluido desde el centro de Madrid.',
   '2026-09-26', '09:00', 'Madrid', '77777777-7777-7777-7777-777777777777',
   'https://jtoftrghfwdffrkqejlq.supabase.co/storage/v1/object/public/Events/segovia-trip.jpg', 0, 10),

  ('Dinner Club', 'Dinner Club',
   'A curated dinner for a small group of women at one of Madrid''s most charming spots. Good food, good wine, better conversations.',
   'Una cena seleccionada para un grupo reducido de mujeres en uno de los rincones con más encanto de Madrid. Buena comida, buen vino, mejores conversaciones.',
   '2026-09-30', '20:00', 'Madrid', '66666666-6666-6666-6666-666666666666',
   'https://jtoftrghfwdffrkqejlq.supabase.co/storage/v1/object/public/Events/dinner-club.jpg', 0, 10),

  -- 4. New Barcelona events
  ('Yoga + Matcha', 'Yoga + Matcha',
   'Start your Sunday with a gentle yoga flow followed by matcha and good company. Mats provided.',
   'Empieza tu domingo con una sesión suave de yoga seguida de matcha y buena compañía. Esterillas incluidas.',
   '2026-09-06', '10:00', 'Barcelona', '33333333-3333-3333-3333-333333333333',
   null, 0, 10),

  ('Dinner Club', 'Dinner Club',
   'A curated dinner for a small group of women at one of Barcelona''s most charming spots. Good food, good wine, better conversations.',
   'Una cena seleccionada para un grupo reducido de mujeres en uno de los rincones con más encanto de Barcelona. Buena comida, buen vino, mejores conversaciones.',
   '2026-09-08', '20:00', 'Barcelona', '66666666-6666-6666-6666-666666666666',
   'https://jtoftrghfwdffrkqejlq.supabase.co/storage/v1/object/public/Events/dinner-club.jpg', 0, 10);

commit;

-- Verify: should show 9 rows total (8 new + Horseback Riding)
select title, city, date, is_tbc from public.events order by date;
