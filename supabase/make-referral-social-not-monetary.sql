-- Removes the monetary referral reward per Clara's 2026-08-28 direction:
-- "para el MVP haría que la recompensa sea social, no económica" — no
-- credits, no points, no tiers. Applied live via `supabase db query
-- --linked` on 2026-08-28 — this file documents it.

-- profiles.referral_code already has a hard UNIQUE constraint
-- (profiles_referral_code_key), so codes were already guaranteed unique
-- per user — no schema change needed for that part of the request.

-- Disable the €5-per-attendance payout. Function definition left in place
-- (dormant) in case Clara wants it back later — only the trigger is dropped.
drop trigger if exists on_first_attendance_reward on public.event_attendance;

-- New social-only notification: pushes "X joined with your invite 💜" to
-- the referrer the moment a new user applies their code (no money, no
-- gating on attendance) — this is now the only feedback a referrer gets.
CREATE OR REPLACE FUNCTION public.notify_referrer_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.referred_by IS NOT NULL AND OLD.referred_by IS NULL THEN
    PERFORM net.http_post(
      url := 'https://jtoftrghfwdffrkqejlq.supabase.co/functions/v1/send-push',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0b2Z0cmdoZndkZmZya3FlamxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0Mjk4NTYsImV4cCI6MjA4NzAwNTg1Nn0.GdXRzPRd2stVyD6MO8eSIrykofRxH80v_rDCyPP9jHw'
      ),
      body := jsonb_build_object(
        'userId', NEW.referred_by::text,
        'title', coalesce(NEW.name, 'Someone') || ' joined with your invite 💜',
        'body', 'Say hello when you see her around Nomaya.'
      )
    );
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_notify_referrer_on_signup ON public.profiles;
CREATE TRIGGER trg_notify_referrer_on_signup
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.notify_referrer_on_signup();
