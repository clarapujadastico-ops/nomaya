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

    const { eventId } = await req.json()
    if (!eventId) {
      return new Response(
        JSON.stringify({ error: 'eventId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch event price + user profile using service role (bypasses RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Never trust a client-supplied userId — a caller could pass anyone's id
    // and have their credits read and deducted. Derive the acting user from
    // their own verified session token instead.
    const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const userId = user.id

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

    // Deduct credits server-side before creating the intent so the balance is
    // always consistent regardless of client behaviour after payment.
    if (discountCents > 0) {
      await supabase
        .from('profiles')
        .update({ credits_cents: userCredits - discountCents })
        .eq('id', userId)
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: chargeAmount,
      currency: event.currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
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
