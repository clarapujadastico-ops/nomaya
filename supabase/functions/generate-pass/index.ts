import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import JSZip from 'npm:jszip'
import forge from 'npm:node-forge'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 1x1 transparent PNG as placeholder icon (replace with real Nomaya icon later)
const ICON_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

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
  if (badges.includes('founding_member')) return 'Founding Member'
  if (bookingsCount >= 5) return 'Keeper of the Circle'
  if (bookingsCount >= 3) return 'Inner Circle'
  return 'Founding Circle'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Check certificates are configured — return 503 until Developer account is set up
  const certBase64 = Deno.env.get('PASS_P12_BASE64')
  const certPassword = Deno.env.get('PASS_P12_PASSWORD') ?? ''
  const passTypeId = Deno.env.get('PASS_TYPE_IDENTIFIER')    // e.g. pass.com.nomaya.membercard
  const teamId = Deno.env.get('APPLE_TEAM_ID')               // 10-char Team ID from Developer portal

  if (!certBase64 || !passTypeId || !teamId) {
    return new Response(
      JSON.stringify({ error: 'not_configured' }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Authenticate user
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

  // Build pass fields
  const memberNum = (profile as any)?.member_number
  const memberId = memberNum != null ? `NM-MAD-${String(memberNum).padStart(4, '0')}` : `NM-MAD-????`
  const displayName = (profile?.name && profile.name !== 'Member' && profile.name.trim())
    ? profile.name.trim() : 'Member'
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Nomaya'
  const tier = getMemberTier(profile?.badges ?? [], bookingsCount ?? 0)

  // Build pass.json
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
      primaryFields: [
        { key: 'name', label: 'MEMBER', value: displayName }
      ],
      secondaryFields: [
        { key: 'memberId', label: 'MEMBER ID', value: memberId },
        { key: 'memberSince', label: 'SINCE', value: memberSince }
      ],
      auxiliaryFields: [
        { key: 'city', label: 'CITY', value: profile?.city ?? 'Madrid' },
        { key: 'tier', label: 'TIER', value: tier }
      ]
    }
  })

  const iconBytes = Uint8Array.from(atob(ICON_BASE64), c => c.charCodeAt(0))

  // Build manifest (SHA1 of each file)
  const manifest = JSON.stringify({
    'pass.json': sha1Hex(passJson),
    'icon.png': sha1Hex(iconBytes),
    'icon@2x.png': sha1Hex(iconBytes),
    'icon@3x.png': sha1Hex(iconBytes),
  })

  // Sign manifest with Pass certificate (PKCS7 detached)
  const p12Der = forge.util.binary.base64.decode(certBase64)
  const p12Asn1 = forge.asn1.fromDer(forge.util.createBuffer(p12Der))
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, certPassword)

  let signingCert: forge.pki.Certificate | null = null
  let signingKey: forge.pki.PrivateKey | null = null

  for (const safeContent of p12.safeContents) {
    for (const safeBag of safeContent.safeBags) {
      if (safeBag.type === forge.pki.oids.certBag && safeBag.cert) signingCert = safeBag.cert
      if (safeBag.type === forge.pki.oids.pkcs8ShroudedKeyBag && safeBag.key) signingKey = safeBag.key
    }
  }

  if (!signingCert || !signingKey) {
    return new Response(JSON.stringify({ error: 'Failed to read certificate' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Fetch Apple WWDR intermediate certificate
  const wwdrRes = await fetch('https://www.apple.com/certificateauthority/AppleWWDRCAG4.cer')
  const wwdrDer = new Uint8Array(await wwdrRes.arrayBuffer())
  const wwdrCert = forge.pki.certificateFromAsn1(
    forge.asn1.fromDer(forge.util.createBuffer(wwdrDer))
  )

  const p7 = forge.pkcs7.createSignedData()
  p7.content = forge.util.createBuffer(manifest, 'utf8')
  p7.addCertificate(wwdrCert)
  p7.addCertificate(signingCert)
  p7.addSigner({
    key: signingKey,
    certificate: signingCert,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
      { type: forge.pki.oids.messageDigest },
      { type: forge.pki.oids.signingTime, value: new Date() },
    ],
  })
  p7.sign({ detached: true })

  const signatureBytes = Uint8Array.from(
    forge.asn1.toDer(p7.toAsn1()).getBytes(), c => c.charCodeAt(0)
  )

  // Build .pkpass zip
  const zip = new JSZip()
  zip.file('pass.json', passJson)
  zip.file('manifest.json', manifest)
  zip.file('signature', signatureBytes)
  zip.file('icon.png', iconBytes)
  zip.file('icon@2x.png', iconBytes)
  zip.file('icon@3x.png', iconBytes)

  const pkpassBytes = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' })

  // Upload to Supabase Storage and return a signed URL (iOS opens it natively)
  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const filePath = `passes/${user.id}.pkpass`
  await adminClient.storage.from('Events').upload(filePath, pkpassBytes, {
    upsert: true,
    contentType: 'application/vnd.apple.pkpass',
  })

  const { data: signedData } = await adminClient.storage
    .from('Events')
    .createSignedUrl(filePath, 300) // valid 5 minutes

  if (!signedData?.signedUrl) {
    return new Response(JSON.stringify({ error: 'Failed to generate URL' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ url: signedData.signedUrl }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
