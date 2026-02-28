// Supabase Edge Function — send-push
// Sends APNs push notifications to one user, a list of users, or a whole circle.
//
// Secrets required (set via Supabase dashboard → Settings → Edge Functions → Secrets):
//   APNS_TEAM_ID      — 10-char Apple Developer Team ID
//   APNS_KEY_ID       — 10-char APNs key ID
//   APNS_PRIVATE_KEY  — full contents of AuthKey_XXXXXX.p8 file
//   APNS_BUNDLE_ID    — com.nomaya.app
//   APNS_ENV          — "sandbox" (dev) or "production" (App Store)
//
// POST body shapes:
//   { userId, title, body, data? }                          → one user
//   { userIds, title, body, data? }                         → list of users
//   { circleId, excludeUserId?, title, body, data? }        → all circle members
//   { title, body, data? }                                  → broadcast to all

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { create, getNumericDate } from 'https://deno.land/x/djwt@v3.0.2/mod.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const { userId, userIds, circleId, excludeUserId, title, body, data = {} } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // ── Resolve target device tokens ──────────────────────────────────────────
  let tokenQuery = supabase.from('device_tokens').select('token, user_id')

  if (userId) {
    // Single user
    tokenQuery = tokenQuery.eq('user_id', userId)

  } else if (userIds?.length) {
    // Explicit list
    tokenQuery = tokenQuery.in('user_id', userIds)

  } else if (circleId) {
    // All members of a circle (excluding the sender if provided)
    const { data: members, error: membersError } = await supabase
      .from('circle_memberships')
      .select('user_id')
      .eq('circle_id', circleId)

    if (membersError) return new Response(JSON.stringify({ error: membersError.message }), { status: 500 })

    const memberIds = (members ?? [])
      .map((m: { user_id: string }) => m.user_id)
      .filter((id: string) => id !== excludeUserId)

    if (!memberIds.length) return new Response(JSON.stringify({ sent: 0, total: 0 }), { status: 200 })
    tokenQuery = tokenQuery.in('user_id', memberIds)

  }
  // else: no filter → broadcast to all (use sparingly)

  const { data: tokens, error: tokensError } = await tokenQuery
  if (tokensError) return new Response(JSON.stringify({ error: tokensError.message }), { status: 500 })
  if (!tokens?.length) return new Response(JSON.stringify({ sent: 0, total: 0 }), { status: 200 })

  // ── Build APNs JWT ─────────────────────────────────────────────────────────
  const teamId = Deno.env.get('APNS_TEAM_ID')
  const keyId = Deno.env.get('APNS_KEY_ID')
  const p8 = Deno.env.get('APNS_PRIVATE_KEY')
  const bundleId = Deno.env.get('APNS_BUNDLE_ID') ?? 'com.nomaya.app'
  const apnsEnv = Deno.env.get('APNS_ENV') ?? 'sandbox'
  const apnsHost = apnsEnv === 'production'
    ? 'https://api.push.apple.com'
    : 'https://api.sandbox.push.apple.com'

  if (!teamId || !keyId || !p8) {
    // APNs not configured yet — log and return gracefully
    console.warn('APNs credentials not set. Tokens targeted:', tokens.length)
    return new Response(JSON.stringify({ sent: 0, total: tokens.length, warning: 'APNs not configured' }), { status: 200 })
  }

  const pemKey = p8.includes('-----BEGIN') ? p8 : `-----BEGIN PRIVATE KEY-----\n${p8}\n-----END PRIVATE KEY-----`
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    new TextEncoder().encode(pemKey),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  )

  const jwt = await create(
    { alg: 'ES256', kid: keyId },
    { iss: teamId, iat: getNumericDate(0) },
    cryptoKey,
  )

  // ── Send to each token ─────────────────────────────────────────────────────
  let sent = 0
  const failed: string[] = []

  for (const { token } of tokens) {
    const res = await fetch(`${apnsHost}/3/device/${token}`, {
      method: 'POST',
      headers: {
        authorization: `bearer ${jwt}`,
        'apns-topic': bundleId,
        'apns-push-type': 'alert',
        'apns-priority': '10',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        aps: { alert: { title, body }, sound: 'default', badge: 1 },
        ...data,
      }),
    })
    if (res.ok) {
      sent++
    } else {
      const errText = await res.text()
      console.error('APNs error for token', token.slice(-8), ':', errText)
      failed.push(token.slice(-8))
      // Remove invalid tokens
      if (res.status === 410) {
        await supabase.from('device_tokens').delete().eq('token', token)
      }
    }
  }

  return new Response(
    JSON.stringify({ sent, total: tokens.length, failed }),
    { headers: { 'content-type': 'application/json' } },
  )
})
