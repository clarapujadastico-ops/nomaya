// circle-reminders — scheduled edge function
// Invoke daily via Supabase cron: "0 10 * * *" (10:00 UTC)
//
// What it does:
//   1. "Write something" reminder → members who haven't posted in their circles for 3+ days
//   2. "Plan together?" suggestion → once a week (Fridays) to all circle members

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

async function sendPush(params: {
  userId?: string;
  userIds?: string[];
  circleId?: string;
  excludeUserId?: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}) {
  await supabase.functions.invoke("send-push", { body: params });
}

Deno.serve(async (_req) => {
  const now = new Date();
  const isFriday = now.getDay() === 5;
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();

  // ── 1. "Write something" reminder ─────────────────────────────────────────
  // Find circle members who haven't sent a message in 3+ days
  // (exclude event circles which have event_id set)
  const { data: memberships } = await supabase
    .from("circle_memberships")
    .select("user_id, circle_id, circle:circles!inner(id, name, event_id)")
    .is("circle.event_id", null); // user circles only

  if (memberships) {
    for (const m of memberships) {
      const circle = m.circle as { id: string; name: string; event_id: string | null };
      if (!circle) continue;

      // Check if user has posted recently in this circle
      const { count } = await supabase
        .from("circle_messages")
        .select("id", { count: "exact", head: true })
        .eq("circle_id", circle.id)
        .eq("user_id", m.user_id)
        .gte("created_at", threeDaysAgo);

      if ((count ?? 0) === 0) {
        await sendPush({
          userId: m.user_id,
          title: "💬 Say hello!",
          body: `You haven't posted in ${circle.name} for a while. Share something with the group!`,
          data: { type: "circle_reminder", circle_id: circle.id },
        });
      }
    }
  }

  // ── 2. "Plan together?" suggestion — Fridays only ─────────────────────────
  if (isFriday) {
    const { data: circles } = await supabase
      .from("circles")
      .select("id, name")
      .is("event_id", null);

    if (circles) {
      for (const circle of circles) {
        await sendPush({
          circleId: circle.id,
          title: "🗓️ Plan something together?",
          body: `What should ${circle.name} do next? Open the app to suggest a plan!`,
          data: { type: "circle_plan_suggestion", circle_id: circle.id },
        });
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, friday: isFriday }), {
    headers: { "Content-Type": "application/json" },
  });
});
