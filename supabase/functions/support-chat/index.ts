import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'not_configured' }), {
      status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Auth check
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )
  const { data: { user }, error: authError } = await userClient.auth.getUser()
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { message, context } = await req.json()

  const eventsText = context?.events?.length > 0
    ? context.events.map((e: any) =>
        e.isTbc
          ? `- ${e.title}: Coming soon (waitlist)`
          : `- ${e.title}: ${e.date}, ${e.price}${e.spotsLeft === 0 ? ' — SOLD OUT' : e.spotsLeft <= 3 ? ` — only ${e.spotsLeft} spots left` : ` — ${e.spotsLeft} spots available`}`
      ).join('\n')
    : 'No event data available right now.'

  const bookingsLine = context?.bookingsCount != null
    ? `The user currently has ${context.bookingsCount} confirmed booking(s).`
    : ''

  const systemPrompt = `You are the Nomaya support assistant — warm, concise, and helpful.

Nomaya is a curated women-only social club in Madrid, Spain. Founded in 2026.
Members connect through workshops, dinners, yoga, art classes, and more.
The app is iOS-only (App Store).

== EVENTS RIGHT NOW ==
${eventsText}

${bookingsLine}

== KEY INFO ==
Booking: Experiences tab → tap event → "Reserve my spot". Paid events use Stripe.
TBC events: join the waitlist to be first notified when they open.
Cancel: open event page → "Cancel reservation". 48h+ before = full refund or Nomaya credits (+10% bonus).
Circles: private groups in the Circles tab. Open = join freely. Private = request to join.
Verification: Profile tab → tap verification banner → photo of ID + selfie. Women-only safety check.
Badges (attend events): 🌸 Founding Circle (1), ✨ Inner Circle (3), 🔮 Keeper of the Circle (5), 🏛️ Founding Member (first ever event).
Credits & referrals: Your referral code is in Community → Rewards tab. Friend uses your code at signup → she gets €7.50, you get €10.
Use credits when booking — shown at checkout.
Member card: Profile → "Add to Wallet" downloads your Apple Wallet membership card.
Contact: hola@nomaya.app — team replies within 24h.

== RULES ==
- Reply in the same language the user writes in (English or Spanish).
- Keep replies to 2–4 short sentences. Never use bullet lists unless listing 3+ things.
- Never make up event prices, dates or details not listed above.
- If you don't know something specific, direct the user to hola@nomaya.app.
- Tone: like a friendly, knowledgeable member of the Nomaya team. Warm but direct. Use 💜 once per reply at most.`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
    }),
  })

  if (!res.ok) {
    return new Response(JSON.stringify({ error: 'api_error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const data = await res.json()
  const reply = data.content?.[0]?.text ?? "I'm not sure about that — email us at hola@nomaya.app and we'll help right away 💜"

  return new Response(JSON.stringify({ reply }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
