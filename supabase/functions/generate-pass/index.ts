import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import forge from 'https://esm.sh/node-forge@1.3.1?bundle'
import { zipSync } from 'https://esm.sh/fflate@0.8.2?bundle'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 29x29 purple square PNG (valid Apple Wallet icon)
const ICON_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAB0AAAAdCAIAAADZ8fBYAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAACNJREFUeNpj/M9Qzw8EDAwM/xk4GEYNHTWUZChgGLShAAIMAE5FASpMNEqKAAAAAElFTkSuQmCC'
// Nomaya logo PNGs (60x60, 120x120, 180x180)
const LOGO_BASE64    = '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'
const LOGO2_BASE64   = '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'
const LOGO3_BASE64   = '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'

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

    const iconBytes  = Uint8Array.from(atob(ICON_BASE64),  c => c.charCodeAt(0))
    const logoBytes  = Uint8Array.from(atob(LOGO_BASE64),  c => c.charCodeAt(0))
    const logo2Bytes = Uint8Array.from(atob(LOGO2_BASE64), c => c.charCodeAt(0))
    const logo3Bytes = Uint8Array.from(atob(LOGO3_BASE64), c => c.charCodeAt(0))
    const enc        = new TextEncoder()

    const manifest = JSON.stringify({
      'pass.json':    sha1Hex(passJson),
      'icon.png':     sha1Hex(iconBytes),
      'icon@2x.png':  sha1Hex(iconBytes),
      'icon@3x.png':  sha1Hex(iconBytes),
      'logo.png':     sha1Hex(logoBytes),
      'logo@2x.png':  sha1Hex(logo2Bytes),
      'logo@3x.png':  sha1Hex(logo3Bytes),
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
      'logo.png':      logoBytes,
      'logo@2x.png':   logo2Bytes,
      'logo@3x.png':   logo3Bytes,
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
