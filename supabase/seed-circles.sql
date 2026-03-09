-- Run this in your Supabase SQL editor to add the two new circles.
-- Replace 'YOUR-ADMIN-USER-UUID' with your own user ID (find it in Auth > Users in the Supabase dashboard).

DO $$
DECLARE
  admin_id uuid := 'YOUR-ADMIN-USER-UUID';
  new_mothers_id uuid;
  remote_workers_id uuid;
BEGIN

  -- New Mothers circle (Wellness category, private)
  INSERT INTO circles (name, description, city, category_id, is_private, created_by)
  VALUES (
    'New Mothers 🍼',
    'A safe space for new mums to share experiences, ask questions, and support each other through the beautiful chaos of motherhood.',
    'Madrid',
    '33333333-3333-3333-3333-333333333333', -- Wellness
    true,
    admin_id
  )
  RETURNING id INTO new_mothers_id;

  INSERT INTO circle_memberships (circle_id, user_id, role)
  VALUES (new_mothers_id, admin_id, 'admin');

  -- Remote Workers circle (Professional category, public)
  INSERT INTO circles (name, description, city, category_id, is_private, created_by)
  VALUES (
    'Remote Workers 💻',
    'For women who work remotely — share tips, find co-working spots, beat the isolation, and build your network in Madrid.',
    'Madrid',
    '44444444-4444-4444-4444-444444444444', -- Professional
    false,
    admin_id
  )
  RETURNING id INTO remote_workers_id;

  INSERT INTO circle_memberships (circle_id, user_id, role)
  VALUES (remote_workers_id, admin_id, 'admin');

END $$;
