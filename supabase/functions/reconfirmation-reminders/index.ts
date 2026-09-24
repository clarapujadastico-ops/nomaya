// reconfirmation-reminders — scheduled edge function
// Invoke every 30 minutes via Supabase cron: "*/30 * * * *"
//
// For events with no advance payment (payment_at_venue, or free) — where a
// confirmed booking isn't backed by any money on the line — sends a "still
// coming?" push 48h before the event, so a no-show risk surfaces with
// enough time to fill the spot instead of discovering it at the door.
// Paid events are intentionally excluded: they already have the 48h
// cancellation-refund policy as the commitment mechanism.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// See event-reminders/index.ts for why this conversion is needed — events
// store Madrid/Barcelona wall-clock date/time with no timezone attached,
// but this function's runtime clock is UTC.
function madridWallClockToUtc(date: string, time: string): Date {
  const wallClockMs = Date.parse(`${date}T${time}Z`);
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
  // A single point-in-time target (48h out) checked by a cron that only
  // wakes every 30 min needs a window around it, not an exact match —
  // otherwise a tick could step over the instant entirely.
  const windowStart = new Date(now.getTime() + 47 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 49 * 60 * 60 * 1000);

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("id, user_id, event_id, event:events(id, title, title_es, date, time, payment_at_venue, price_cents)")
    .eq("status", "confirmed")
    .is("reconfirmation_sent_at", null);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  let sent = 0;
  for (const b of bookings ?? []) {
    const event = b.event as unknown as {
      id: string; title: string; title_es: string | null; date: string; time: string;
      payment_at_venue: boolean; price_cents: number;
    } | null;
    if (!event?.date) continue;

    // Only unpaid-in-advance plans — a real payment is its own commitment.
    if (!event.payment_at_venue && event.price_cents > 0) continue;

    const eventStart = madridWallClockToUtc(event.date, event.time ?? "00:00:00");
    if (eventStart < windowStart || eventStart > windowEnd) continue;

    await supabase.functions.invoke("send-push", {
      body: {
        userId: b.user_id,
        title: "Still joining us? 💜",
        body: `${event.title} is in 2 days. Let us know if you're still coming so we can keep your spot.`,
        data: { type: "reconfirmation_reminder", event_id: event.id },
      },
    });

    await supabase.from("bookings").update({ reconfirmation_sent_at: now.toISOString() }).eq("id", b.id);
    sent++;
  }

  return new Response(JSON.stringify({ sent, checked: bookings?.length ?? 0 }), { status: 200 });
});
