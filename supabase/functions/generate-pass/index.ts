import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import forge from 'https://esm.sh/node-forge@1.3.1?bundle'
import { zipSync } from 'https://esm.sh/fflate@0.8.2?bundle'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 29x29 purple square PNG (valid Apple Wallet icon)
const ICON_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAB0AAAAdCAIAAADZ8fBYAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAACNJREFUeNpj/M9Qzw8EDAwM/xk4GEYNHTWUZChgGLShAAIMAE5FASpMNEqKAAAAAElFTkSuQmCC'

function sha1Hex(data: Uint8Array | string): string {
  const md = forge.md.sha1.create()
  if (typeof data === 'string') {
    md.update(forge.util.encodeUtf8(data))
  } else {
    md.update(forge.util.binary.raw.encode(data as unknown as string))
  }
  return md.digest().toHex()
}

function getMemberTier(badges: string[], bookingsCount: number): string {
  if (badges?.includes('founding_member')) return 'Founding Member'
  if (bookingsCount >= 5) return 'Keeper of the Circle'
  if (bookingsCount >= 3) return 'Inner Circle'
  return 'Founding Circle'
}

function loadWwdrCert(): forge.pki.Certificate {
  const wwdrBase64 = Deno.env.get('PASS_WWDR_BASE64')
  if (!wwdrBase64) throw new Error('PASS_WWDR_BASE64 secret not set')
  const clean = wwdrBase64.trim()
  // Support both PEM (with or without headers) and raw DER base64
  if (clean.includes('BEGIN CERTIFICATE')) {
    return forge.pki.certificateFromPem(clean)
  }
  const der = forge.util.binary.base64.decode(clean.replace(/\s+/g, ''))
  return forge.pki.certificateFromAsn1(forge.asn1.fromDer(forge.util.createBuffer(der)))
}

Deno.serve(async (req) => {
  try {
  console.log('[generate-pass] request received', req.method)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Debug endpoint — GET /generate-pass?test=1 — no auth required
  const url = new URL(req.url)
  if (req.method === 'GET' && url.searchParams.get('test') === '1') {
    const results: Record<string, string> = {}
    try {
      const c = Deno.env.get('PASS_P12_BASE64'); results.p12 = c ? `present (${c.replace(/\s+/g,'').length} chars)` : 'MISSING'
      results.p12pw = Deno.env.get('PASS_P12_PASSWORD') ? 'present' : 'empty'
      results.passType = Deno.env.get('PASS_TYPE_IDENTIFIER') ?? 'MISSING'
      results.teamId = Deno.env.get('APPLE_TEAM_ID') ?? 'MISSING'
      const w = Deno.env.get('PASS_WWDR_BASE64'); results.wwdr = w ? `present (${w.replace(/\s+/g,'').length} chars, isPem=${w.includes('BEGIN')})` : 'MISSING'
    } catch (e) { results.secrets_error = String(e) }
    try { loadWwdrCert(); results.wwdr_parse = 'ok' } catch (e) { results.wwdr_parse = `FAILED: ${e}` }
    try {
      const cb = Deno.env.get('PASS_P12_BASE64')
      if (cb) {
        const pw = (Deno.env.get('PASS_P12_PASSWORD') ?? '').trim()
        const der = forge.util.binary.base64.decode(cb.replace(/\s+/g,''))
        const asn = forge.asn1.fromDer(forge.util.createBuffer(der))
        const p12 = forge.pkcs12.pkcs12FromAsn1(asn, pw)
        results.p12_parse = 'ok'
        // Check cert + key extraction
        let cert: forge.pki.Certificate | null = null
        let key: forge.pki.PrivateKey | null = null
        for (const sc of p12.safeContents) {
          for (const bag of sc.safeBags) {
            if (bag.type === forge.pki.oids.certBag && bag.cert) cert = bag.cert
            if (bag.type === forge.pki.oids.pkcs8ShroudedKeyBag && bag.key) key = bag.key
          }
        }
        results.cert_found = cert ? 'yes' : 'NO — re-export .p12 with private key included'
        results.key_found  = key  ? 'yes' : 'NO — re-export .p12 with private key included'
        // Try signing
        if (cert && key) {
          try {
            const p7 = forge.pkcs7.createSignedData()
            p7.content = forge.util.createBuffer('test', 'utf8')
            p7.addCertificate(loadWwdrCert())
            p7.addCertificate(cert)
            p7.addSigner({ key, certificate: cert, digestAlgorithm: forge.pki.oids.sha256,
              authenticatedAttributes: [
                { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
                { type: forge.pki.oids.messageDigest },
                { type: forge.pki.oids.signingTime, value: new Date() },
              ]})
            p7.sign({ detached: true })
            results.signing = 'ok'
          } catch (e) { results.signing = `FAILED: ${e}` }
        }
      }
    } catch (e) { results.p12_parse = `FAILED: ${e}` }
    // Test storage upload
    try {
      const adminClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
      const testBytes = new TextEncoder().encode('test')
      const { error: upErr } = await adminClient.storage.from('Events').upload('passes/test.txt', testBytes, { upsert: true, contentType: 'text/plain' })
      if (upErr) { results.storage_upload = `FAILED: ${upErr.message}` }
      else {
        const { data: sd } = await adminClient.storage.from('Events').createSignedUrl('passes/test.txt', 60)
        results.storage_upload = 'ok'
        results.storage_url = sd?.signedUrl ? 'ok' : 'FAILED: no signed url'
      }
    } catch (e) { results.storage_upload = `FAILED: ${e}` }
    return new Response(JSON.stringify(results, null, 2), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const certBase64    = Deno.env.get('PASS_P12_BASE64')
  const certPassword  = (Deno.env.get('PASS_P12_PASSWORD') ?? '').trim()
  const passTypeId    = Deno.env.get('PASS_TYPE_IDENTIFIER')
  const teamId        = Deno.env.get('APPLE_TEAM_ID')

  console.log('[generate-pass] secrets check:', { hasCert: !!certBase64, hasPassType: !!passTypeId, hasTeam: !!teamId })

  if (!certBase64 || !passTypeId || !teamId) {
    return new Response(
      JSON.stringify({ error: 'not_configured' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  console.log('[generate-pass] authenticating user...')
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user }, error: authError } = await userClient.auth.getUser()
  if (authError || !user) {
    console.log('[generate-pass] auth failed:', authError?.message)
    return new Response(JSON.stringify({ error: 'Unauthorized' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  console.log('[generate-pass] user authenticated, building pass...')
  try {
    const { data: profile } = await userClient
      .from('profiles')
      .select('name, city, created_at, badges, member_number')
      .eq('id', user.id)
      .single()

    const { count: bookingsCount } = await userClient
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'confirmed')

    const memberNum  = (profile as any)?.member_number
    const memberId   = memberNum != null ? `NM-MAD-${String(memberNum).padStart(4, '0')}` : `NM-MAD-0001`
    const displayName = (profile?.name && profile.name !== 'Member' && profile.name.trim())
      ? profile.name.trim() : 'Member'
    const memberSince = profile?.created_at
      ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : 'Nomaya'
    const tier = getMemberTier(profile?.badges ?? [], bookingsCount ?? 0)

    const passJson = JSON.stringify({
      formatVersion: 1,
      passTypeIdentifier: passTypeId,
      serialNumber: memberId,
      teamIdentifier: teamId,
      organizationName: 'Nomaya',
      description: 'Nomaya Member Card',
      logoText: 'Nomaya',
      foregroundColor: 'rgb(255, 255, 255)',
      backgroundColor: 'rgb(95, 80, 149)',
      labelColor: 'rgb(200, 185, 240)',
      generic: {
        primaryFields:   [{ key: 'name',      label: 'MEMBER',   value: displayName }],
        secondaryFields: [{ key: 'memberId',   label: 'MEMBER ID', value: memberId },
                          { key: 'since',      label: 'SINCE',     value: memberSince }],
        auxiliaryFields: [{ key: 'city',       label: 'CITY',      value: profile?.city || 'Madrid' },
                          { key: 'tier',       label: 'TIER',      value: tier }],
      },
    })

    const iconBytes = Uint8Array.from(atob(ICON_BASE64), c => c.charCodeAt(0))
    const enc       = new TextEncoder()

    const manifest = JSON.stringify({
      'pass.json':   sha1Hex(passJson),
      'icon.png':    sha1Hex(iconBytes),
      'icon@2x.png': sha1Hex(iconBytes),
      'icon@3x.png': sha1Hex(iconBytes),
    })

    console.log('[generate-pass] parsing p12...')
    // Parse .p12 — strip whitespace/newlines that macOS base64 adds every 76 chars
    const cleanBase64 = certBase64.replace(/\s+/g, '')
    const p12Der  = forge.util.binary.base64.decode(cleanBase64)
    const p12Asn1 = forge.asn1.fromDer(forge.util.createBuffer(p12Der))
    let p12: ReturnType<typeof forge.pkcs12.pkcs12FromAsn1>
    try {
      p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, certPassword)
    } catch (e) {
      throw new Error(`p12_parse_failed: ${e instanceof Error ? e.message : String(e)} — check PASS_P12_PASSWORD`)
    }
    console.log('[generate-pass] p12 parsed ok')

    let signingCert: forge.pki.Certificate | null = null
    let signingKey:  forge.pki.PrivateKey  | null = null

    for (const sc of p12.safeContents) {
      for (const bag of sc.safeBags) {
        if (bag.type === forge.pki.oids.certBag             && bag.cert) signingCert = bag.cert
        if (bag.type === forge.pki.oids.pkcs8ShroudedKeyBag && bag.key)  signingKey  = bag.key
      }
    }

    if (!signingCert || !signingKey) {
      return new Response(JSON.stringify({ error: 'cert_parse_failed', detail: 'Could not extract cert or key from .p12' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    console.log('[generate-pass] loading WWDR cert from secret...')
    const wwdrCert = loadWwdrCert()
    console.log('[generate-pass] WWDR loaded, signing...')

    const p7 = forge.pkcs7.createSignedData()
    p7.content = forge.util.createBuffer(manifest, 'utf8')
    p7.addCertificate(wwdrCert)
    p7.addCertificate(signingCert)
    p7.addSigner({
      key: signingKey,
      certificate: signingCert,
      digestAlgorithm: forge.pki.oids.sha256,
      authenticatedAttributes: [
        { type: forge.pki.oids.contentType,  value: forge.pki.oids.data },
        { type: forge.pki.oids.messageDigest },
        { type: forge.pki.oids.signingTime,  value: new Date() },
      ],
    })
    p7.sign({ detached: true })

    const signatureBytes = Uint8Array.from(
      forge.asn1.toDer(p7.toAsn1()).getBytes(), c => c.charCodeAt(0)
    )

    console.log('[generate-pass] signed, zipping...')
    // Build .pkpass (zip)
    const pkpassBytes = zipSync({
      'pass.json':     enc.encode(passJson),
      'manifest.json': enc.encode(manifest),
      'signature':     signatureBytes,
      'icon.png':      iconBytes,
      'icon@2x.png':   iconBytes,
      'icon@3x.png':   iconBytes,
    })

    console.log('[generate-pass] zip done, uploading...')
    // Upload and return signed URL
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const filePath = `passes/${user.id}.pkpass`
    const { error: uploadError } = await adminClient.storage
      .from('Events')
      .upload(filePath, pkpassBytes, { upsert: true, contentType: 'application/vnd.apple.pkpass' })

    if (uploadError) {
      return new Response(JSON.stringify({ error: 'upload_failed', detail: uploadError.message }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: signedData } = await adminClient.storage
      .from('Events')
      .createSignedUrl(filePath, 300)

    if (!signedData?.signedUrl) {
      return new Response(JSON.stringify({ error: 'url_failed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ url: signedData.signedUrl }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'internal', detail: err instanceof Error ? err.message : String(err) }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  } catch (fatal) {
    return new Response(
      JSON.stringify({ error: 'fatal', detail: fatal instanceof Error ? fatal.message : String(fatal) }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
