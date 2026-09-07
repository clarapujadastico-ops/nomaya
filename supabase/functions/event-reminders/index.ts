// event-reminders — scheduled edge function
// Invoke every 15 minutes via Supabase cron: "*/15 * * * *"
//
// Sends a "your plan is about to happen" push to anyone with a confirmed
// booking for an event starting within the next hour. Marks each booking's
// reminder_sent_at so it never fires twice for the same booking.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// events.date/time are stored as Madrid/Barcelona wall-clock time with no
// timezone attached. Both cities are in the same IANA zone, so a single
// conversion works for the whole app. We can't just do
// `new Date(`${date}T${time}`)` here — this function's runtime clock is UTC,
// and that would silently read the event's local start time as if it were
// already UTC, landing the reminder 1-2 hours off depending on DST.
function madridWallClockToUtc(date: string, time: string): Date {
  const wallClockMs = Date.parse(`${date}T${time}Z`); // treat the string as if it were UTC
  // Offset (in minutes) between Europe/Madrid and UTC on this specific date,
  // computed via Intl so it's correct across the CET/CEST DST boundary.
  const referenceNoonUtc = new Date(`${date}T12:00:00Z`);
  const madridHourAtNoonUtc = parseInt(
    referenceNoonUtc.toLocaleString("en-US", { timeZone: "Europe/Madrid", hour12: false, hour: "2-digit" }),
    10,
  );
  let offsetHours = madridHourAtNoonUtc - 12;
  if (offsetHours > 12) offsetHours -= 24;
  if (offsetHours < -12) offsetHours += 24;
  return new Date(wallClockMs - offsetHours * 60 * 60 * 1000);
}

Deno.serve(async (_req) => {
  const now = new Date();
  const in1h = new Date(now.getTime() + 60 * 60 * 1000);

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("id, user_id, event_id, event:events(id, title, date, time)")
    .eq("status", "confirmed")
    .is("reminder_sent_at", null);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  let sent = 0;
  for (const b of bookings ?? []) {
    const event = b.event as unknown as { id: string; title: string; date: string; time: string } | null;
    if (!event?.date) continue;

    const eventStart = madridWallClockToUtc(event.date, event.time ?? "00:00:00");
    if (eventStart < now || eventStart > in1h) continue;

    await supabase.functions.invoke("send-push", {
      body: {
        userId: b.user_id,
        title: "⏰ Your plan is about to happen!",
        body: `${event.title} starts soon — see you there!`,
        data: { type: "event_reminder", event_id: event.id },
      },
    });

    await supabase.from("bookings").update({ reminder_sent_at: now.toISOString() }).eq("id", b.id);
    sent++;
  }

  return new Response(JSON.stringify({ sent, checked: bookings?.length ?? 0 }), { status: 200 });
});
