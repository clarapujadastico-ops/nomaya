-- Closes a real access-control gap: bookings and circle-joining were only
-- gated client-side (the "profile under review" UI). Any authenticated user
-- could bypass it entirely by calling the Supabase client directly, since
-- neither policy checked verification_status. Applied live via
-- `supabase db query --linked` on 2026-08-26 — this file documents it.
--
-- circle_messages already requires an existing circle_memberships row to
-- insert (see "messages: insert" policy), so gating circle_memberships join
-- also covers group chat access without a separate change there.

alter policy "Users can create their own bookings" on public.bookings
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.verification_status = 'verified'
  )
);

alter policy "memberships: join" on public.circle_memberships
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.verification_status = 'verified'
  )
);
