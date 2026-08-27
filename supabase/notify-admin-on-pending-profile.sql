-- Sends Clara (the app's one admin) an email whenever a profile needs manual
-- review, via the notify-admin-pending-profile edge function (which calls
-- Resend). Fires on INSERT with verification_status = 'pending' (the normal
-- case — new profiles land pending right after onboarding), and on any
-- UPDATE that changes verification_status to 'pending'. Applied live via
-- `supabase db query --linked` on 2026-08-27 — this file documents it.
--
-- Mirrors the existing notify_user_on_verification() trigger's pattern
-- (pg_net.http_post to an edge function) for consistency with the rest of
-- this project.

CREATE OR REPLACE FUNCTION public.notify_admin_on_pending_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.verification_status != 'pending' THEN
      RETURN NEW;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.verification_status IS NOT DISTINCT FROM OLD.verification_status THEN
      RETURN NEW;
    END IF;
    IF NEW.verification_status != 'pending' THEN
      RETURN NEW;
    END IF;
  END IF;

  PERFORM net.http_post(
    url := 'https://jtoftrghfwdffrkqejlq.supabase.co/functions/v1/notify-admin-pending-profile',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0b2Z0cmdoZndkZmZya3FlamxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0Mjk4NTYsImV4cCI6MjA4NzAwNTg1Nn0.GdXRzPRd2stVyD6MO8eSIrykofRxH80v_rDCyPP9jHw'
    ),
    body := jsonb_build_object(
      'userId', NEW.id::text,
      'name', NEW.name,
      'city', NEW.city,
      'instagram_url', NEW.instagram_url
    )
  );

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_notify_admin_on_pending_profile ON public.profiles;
CREATE TRIGGER trg_notify_admin_on_pending_profile
AFTER INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.notify_admin_on_pending_profile();
