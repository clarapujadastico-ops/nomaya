import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    const stripePublishableKey = Deno.env.get('STRIPE_PUBLISHABLE_KEY')

    // Graceful degradation — Stripe not yet configured
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ warning: 'Stripe not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { eventId, userId } = await req.json()
    if (!eventId || !userId) {
      return new Response(
        JSON.stringify({ error: 'eventId and userId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch event price + user profile using service role (bypasses RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const [{ data: event, error: eventError }, { data: userProfile }, { count: bookingCount }] = await Promise.all([
      supabase.from('events').select('title, price_cents, currency').eq('id', eventId).single(),
      supabase.from('profiles').select('credits_cents, referred_by, referral_discount_used').eq('id', userId).single(),
      supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'confirmed'),
    ])

    if (eventError || !event) {
      return new Response(
        JSON.stringify({ error: 'Event not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (event.price_cents === 0) {
      return new Response(
        JSON.stringify({ error: 'Event is free — no payment required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── Referral 15% discount (first booking of a referred user, one-time) ──
    const profile = userProfile as any
    const userCredits: number = profile?.credits_cents ?? 0
    const isReferred = !!profile?.referred_by
    const referralDiscountUsed: boolean = profile?.referral_discount_used ?? false
    const isFirstBooking = (bookingCount ?? 0) === 0

    let referralDiscountCents = 0
    if (isReferred && !referralDiscountUsed && isFirstBooking) {
      referralDiscountCents = Math.floor(event.price_cents * 0.15)
    }

    // Apply credits on top of referral discount
    const priceAfterReferral = event.price_cents - referralDiscountCents
    const creditDiscount = Math.min(userCredits, priceAfterReferral)
    const chargeAmount = priceAfterReferral - creditDiscount
    const totalDiscount = referralDiscountCents + creditDiscount

    // Credits (+ referral) cover the full price — no Stripe needed
    if (chargeAmount === 0) {
      const updates: Record<string, unknown> = { credits_cents: userCredits - creditDiscount }
      if (referralDiscountCents > 0) updates.referral_discount_used = true
      await supabase.from('profiles').update(updates).eq('id', userId)

      // Reward referrer with €10 credits if referral discount was applied
      if (referralDiscountCents > 0 && profile.referred_by) {
        await supabase.rpc('increment_credits', { user_id: profile.referred_by, amount: 1000 })
          .catch(() => {}) // non-fatal
      }

      return new Response(
        JSON.stringify({
          free: true,
          discountApplied: totalDiscount,
          referralDiscountCents,
          amountCents: 0,
          currency: event.currency,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' })

    const paymentIntent = await stripe.paymentIntents.create({
      amount: chargeAmount,
      currency: event.currency.toLowerCase(),
      metadata: {
        event_id: eventId,
        user_id: userId,
        event_title: event.title,
        referral_discount_cents: String(referralDiscountCents),
        credit_discount_cents: String(creditDiscount),
        referred_by: profile?.referred_by ?? '',
      },
    })

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        publishableKey: stripePublishableKey,
        amountCents: chargeAmount,
        originalAmountCents: event.price_cents,
        discountApplied: creditDiscount,
        referralDiscountCents,
        currency: event.currency,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
