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

    // Fetch event price + user credits using service role (bypasses RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const [{ data: event, error: eventError }, { data: userProfile }] = await Promise.all([
      supabase.from('events').select('title, price_cents, currency').eq('id', eventId).single(),
      supabase.from('profiles').select('credits_cents').eq('id', userId).single(),
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

    // Apply credits (read from DB — never trust client)
    const userCredits: number = (userProfile as any)?.credits_cents ?? 0
    const discountCents = Math.min(userCredits, event.price_cents)
    const chargeAmount = event.price_cents - discountCents

    // Credits cover the full price — no Stripe needed
    if (chargeAmount === 0) {
      // Zero out credits server-side immediately
      await supabase.from('profiles').update({ credits_cents: userCredits - discountCents }).eq('id', userId)
      return new Response(
        JSON.stringify({
          free: true,
          discountApplied: discountCents,
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
        discount_cents: String(discountCents),
      },
    })

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        publishableKey: stripePublishableKey,
        amountCents: chargeAmount,
        originalAmountCents: event.price_cents,
        discountApplied: discountCents,
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
