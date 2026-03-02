import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { bookingId, userId, choice } = await req.json() as {
      bookingId: string
      userId: string
      choice: 'refund' | 'credits' | 'none'
    }

    if (!bookingId || !userId) {
      return new Response(JSON.stringify({ error: 'Missing bookingId or userId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Fetch booking + event
    const { data: booking, error: bookingErr } = await supabase
      .from('bookings')
      .select('id, user_id, event_id, payment_status, amount_cents_paid, stripe_payment_intent_id, events(date, time)')
      .eq('id', bookingId)
      .eq('user_id', userId)
      .single()

    if (bookingErr || !booking) {
      return new Response(JSON.stringify({ error: 'Booking not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const event = booking.events as { date: string; time: string } | null
    const isPaid = booking.payment_status === 'succeeded' && (booking.amount_cents_paid ?? 0) > 0

    // Compute hours until event
    let hoursUntil = Infinity
    if (event?.date) {
      const eventDateTime = new Date(`${event.date}T${event.time ?? '00:00'}`)
      hoursUntil = (eventDateTime.getTime() - Date.now()) / 3_600_000
    }

    let refunded_cents: number | undefined
    let credits_awarded: number | undefined

    if (isPaid && hoursUntil >= 48) {
      if (choice === 'refund' && booking.stripe_payment_intent_id) {
        // Call Stripe refund API
        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
        if (stripeKey) {
          const stripeRes = await fetch('https://api.stripe.com/v1/refunds', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${stripeKey}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              payment_intent: booking.stripe_payment_intent_id,
            }),
          })
          const stripeData = await stripeRes.json()
          if (!stripeRes.ok) {
            return new Response(JSON.stringify({ error: stripeData?.error?.message ?? 'Stripe refund failed' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
          }
          refunded_cents = booking.amount_cents_paid ?? 0

          // Update booking payment_status
          await supabase
            .from('bookings')
            .update({ payment_status: 'refunded' })
            .eq('id', bookingId)
        }
      } else if (choice === 'credits') {
        // Award credits with 10% bonus
        credits_awarded = Math.round((booking.amount_cents_paid ?? 0) * 1.1)

        const { data: profileData } = await supabase
          .from('profiles')
          .select('credits_cents')
          .eq('id', userId)
          .single()

        const currentCredits = (profileData as { credits_cents: number } | null)?.credits_cents ?? 0

        await supabase
          .from('profiles')
          .update({ credits_cents: currentCredits + credits_awarded })
          .eq('id', userId)
      }
    }

    // Always cancel the booking
    const { error: cancelErr } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)

    if (cancelErr) {
      return new Response(JSON.stringify({ error: cancelErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({ success: true, refunded_cents, credits_awarded }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
