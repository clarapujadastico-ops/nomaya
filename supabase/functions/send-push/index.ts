// Supabase Edge Function — send-push
// Sends APNs push notifications to one or all users.
//
// Secrets required (set via: supabase secrets set KEY=value):
//   APNS_TEAM_ID      — 10-char Apple Developer Team ID
//   APNS_KEY_ID       — 10-char APNs key ID (from Developer portal)
//   APNS_PRIVATE_KEY  — contents of .p8 file (AuthKey_XXXXXX.p8)
//   APNS_BUNDLE_ID    — com.nomaya.app
//
// POST body (JSON):
//   { userId?: string, title: string, body: string, data?: object }
//   Omit userId to broadcast to ALL tokens.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { create, getNumericDate } from 'https://deno.land/x/djwt@v3.0.2/mod.ts'

const APNS_HOST = 'https://api.sandbox.push.apple.com' // change to api.push.apple.com for production

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const { userId, title, body, data = {} } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Fetch target device tokens
  let query = supabase.from('device_tokens').select('token')
  if (userId) query = query.eq('user_id', userId)
  const { data: tokens, error } = await query

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  if (!tokens?.length) return new Response(JSON.stringify({ sent: 0 }), { status: 200 })

  // Build APNs JWT
  const teamId = Deno.env.get('APNS_TEAM_ID')!
  const keyId = Deno.env.get('APNS_KEY_ID')!
  const p8 = Deno.env.get('APNS_PRIVATE_KEY')!
  const bundleId = Deno.env.get('APNS_BUNDLE_ID') ?? 'com.nomaya.app'

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

  // Send to each token
  let sent = 0
  for (const { token } of tokens) {
    const res = await fetch(`${APNS_HOST}/3/device/${token}`, {
      method: 'POST',
      headers: {
        authorization: `bearer ${jwt}`,
        'apns-topic': bundleId,
        'apns-push-type': 'alert',
        'apns-priority': '10',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        aps: {
          alert: { title, body },
          sound: 'default',
          badge: 1,
        },
        ...data,
      }),
    })
    if (res.ok) sent++
    else console.error('APNs error for token', token, await res.text())
  }

  return new Response(JSON.stringify({ sent, total: tokens.length }), {
    headers: { 'content-type': 'application/json' },
  })
})
