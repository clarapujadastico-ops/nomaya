-- Lock down the "Verification" storage bucket (ID + selfie photos).
--
-- Before this fix, several overlapping policies had accumulated from
-- iterative patches:
--   - "Users upload own photos" allowed ANY authenticated user to upload
--     a file under ANY name into the bucket, including overwriting another
--     user's verification photos (no ownership check at all).
--   - "Verification: users can upload own photos" only matched the old
--     `_id.jpg` / `_selfie.jpg` filenames, so it would have silently
--     rejected (or rather, no longer been the policy that allowed) the
--     new `_id_front.jpg` / `_id_back.jpg` uploads from the front/back ID
--     capture flow.
--   - "Only service role reads verification" and
--     "Verification: users can view own photos" were functionally
--     duplicate own-file-only SELECT policies.
--
-- This replaces all of them with one clean INSERT/SELECT/UPDATE policy per
-- action, each scoped strictly to files whose name is prefixed with the
-- caller's own auth.uid() — matching how the app already names files
-- (`${user.id}_id_front.jpg`, `${user.id}_id_back.jpg`, `${user.id}_selfie.jpg`).

drop policy if exists "Only service role reads verification" on storage.objects;
drop policy if exists "Users upload own photos" on storage.objects;
drop policy if exists "Users upload own verification" on storage.objects;
drop policy if exists "Verification: users can upload own photos" on storage.objects;
drop policy if exists "Verification: users can view own photos" on storage.objects;
drop policy if exists "Verification: users can update own photos" on storage.objects;

create policy "Verification: owner can insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'Verification'
    and name like (auth.uid()::text || '%')
  );

create policy "Verification: owner can select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'Verification'
    and name like (auth.uid()::text || '%')
  );

create policy "Verification: owner can update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'Verification'
    and name like (auth.uid()::text || '%')
  );
