// Supabase Edge Function — notify-admin-pending-profile
// Emails Clara (the app's one admin) whenever a profile needs manual review,
// so she doesn't have to keep checking the Supabase Table Editor herself.
// Triggered by the notify_admin_on_pending_profile() Postgres trigger via pg_net.
//
// Secret required (Supabase dashboard → Settings → Edge Functions → Secrets):
//   RESEND_API_KEY — same key used for the auth SMTP config

const ADMIN_EMAIL = 'clarapujadastico@hotmail.com'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const { name, city, instagram_url, userId } = await req.json()

  const apiKey = Deno.env.get('RESEND_API_KEY')
  if (!apiKey) {
    console.warn('RESEND_API_KEY not set — skipping admin notification for', userId)
    return new Response(JSON.stringify({ sent: false, warning: 'RESEND_API_KEY not configured' }), { status: 200 })
  }

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #3D3457;">
      <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 16px;">New profile pending review</h1>
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 8px;"><strong>Name:</strong> ${escapeHtml(name ?? '(no name)')}</p>
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 8px;"><strong>City:</strong> ${escapeHtml(city ?? '—')}</p>
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px;"><strong>Instagram:</strong> ${escapeHtml(instagram_url ?? '(not provided)')}</p>
      <p style="font-size: 13px; line-height: 1.5; color: #6B6480; margin: 0;">
        Review and approve in Supabase → Table Editor → profiles → set verification_status to "verified".
      </p>
    </div>
  `.trim()

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Nomaya <noreply@nomaya.community>',
      to: ADMIN_EMAIL,
      subject: `New profile pending review — ${name ?? 'unnamed'}`,
      html,
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error('Resend error notifying admin:', errText)
    return new Response(JSON.stringify({ sent: false, error: errText }), { status: 200 })
  }

  return new Response(JSON.stringify({ sent: true }), { headers: { 'content-type': 'application/json' } })
})

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
