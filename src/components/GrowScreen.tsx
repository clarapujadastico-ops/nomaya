import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { Copy, Check, ChevronRight } from "lucide-react";
import { Logo } from "./Logo";
import { YourNomayaModal } from "./YourNomayaModal";
import { useProfile } from "@/hooks/useProfile";
import { useBookings } from "@/hooks/useBookings";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";
import type { BookingWithEvent } from "@/types/database";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function plansAttendedCount(bookings: BookingWithEvent[]) {
  return bookings.filter(b => b.checked_in_at).length;
}

// WhatsApp community group invite links, one per city.
const WHATSAPP_GROUP_URLS: Record<string, string> = {
  Madrid: 'https://chat.whatsapp.com/H4u4nh0ESRhIvCQ19WRCsi?mode=gi_t',
  Barcelona: 'https://chat.whatsapp.com/LvvwWEtMyA72VCq0mTLj3w?mode=gi_t',
};

function getMemberId(profile: any) {
  return profile?.member_number != null
    ? `NM-MAD-${String(profile.member_number).padStart(4, '0')}`
    : 'NM-MAD-????';
}

function getMemberSince(profile: any, lang: 'en' | 'es') {
  return profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { month: "long", year: "numeric" })
    : lang === 'es' ? "recientemente" : "recently";
}

// ─── Member Card Modal ────────────────────────────────────────────────────────

function MemberCardModal({ onClose }: { onClose: () => void }) {
  const { data: profile } = useProfile();
  const { data: bookings = [] } = useBookings();
  const { lang } = useLang();
  const [walletLoading, setWalletLoading] = useState(false);

  const memberId = getMemberId(profile);
  const memberSince = getMemberSince(profile, lang);
  const displayName = profile?.name && profile.name !== "Member" && profile.name.trim()
    ? profile.name : null;
  const isFoundingMember = (profile as any)?.badges?.includes?.('founding_member') ?? false;
  const plansAttended = plansAttendedCount(bookings);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.id) return;
    QRCode.toDataURL(profile.id, { margin: 4, width: 400, errorCorrectionLevel: 'H', color: { dark: "#1a1428", light: "#ffffff" } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [profile?.id]);

  async function handleAddToWallet() {
    setWalletLoading(true);
    try {
      // generate-pass derives name/city/member number/badges itself from the
      // caller's own profile via the auth token — it doesn't read a request
      // body — and always responds with JSON `{ url }`, a signed URL to the
      // generated .pkpass in storage, never a raw binary. Navigating to that
      // URL lets WKWebView hand it to Apple Wallet directly.
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('https://jtoftrghfwdffrkqejlq.supabase.co/functions/v1/generate-pass', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      const text = await res.text();
      let json: any = {};
      try { json = JSON.parse(text); } catch { /* not json */ }
      if (!res.ok) {
        alert(`HTTP ${res.status}: ${json?.detail || json?.error || text.slice(0, 200)}`);
      } else if (json?.url) {
        window.location.href = json.url;
      } else if (json?.error === 'not_configured') {
        alert(lang === 'es' ? "Apple Wallet estará disponible próximamente." : "Apple Wallet support is coming soon.");
      } else {
        alert(`Wallet error: ${json?.detail || json?.error || text.slice(0, 200)}`);
      }
    } catch (err) {
      alert(`Wallet error: ${err instanceof Error ? err.message : String(err)}`);
    }
    setWalletLoading(false);
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm bg-card rounded-t-3xl p-6 space-y-4"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 2.5rem)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-border rounded-full mx-auto" />
        <h2 className="font-serif text-xl font-medium text-foreground">
          {lang === 'es' ? "Mi tarjeta Nomaya" : "My Nomaya member card"}
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {lang === 'es'
            ? "Tu pase personal a la comunidad Nomaya. Muéstralo en los eventos para hacer check-in."
            : "Your personal pass to the Nomaya community. Show it at events to check in."}
        </p>
        <div className="rounded-2xl overflow-hidden shadow-card" style={{ background: "#5f5095" }}>
          <div className="px-6 pt-6 pb-4 border-b border-white/10 flex justify-center">
            <Logo className="h-14 w-auto mx-auto object-contain opacity-95" />
          </div>
          <div className="px-6 py-5 space-y-4">
            <div>
              <p className="text-[10px] tracking-[0.2em] uppercase text-white/40 mb-1">Membership Number</p>
              <p className="font-mono text-xl font-semibold text-white tracking-wider">{memberId}</p>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.2em] uppercase text-white/40 mb-1">Full Name</p>
              <p className="font-serif text-lg text-white">{displayName ?? (lang === 'es' ? 'Miembro' : 'Member')}</p>
            </div>
            <div className="pt-1 border-t border-white/10 flex items-center justify-between">
              <p className="text-xs text-white/40">{profile?.city || "Madrid"} · Member since {memberSince}</p>
              {isFoundingMember && <span className="text-[10px] text-white/50 flex-shrink-0 ml-2">🌸 Founding Member</span>}
            </div>
            <div className="pt-1 border-t border-white/10">
              <p className="text-xs text-white/40">
                {plansAttended} {lang === 'es' ? (plansAttended === 1 ? "plan asistido" : "planes asistidos") : (plansAttended === 1 ? "plan attended" : "plans attended")}
              </p>
            </div>
          </div>
          {qrDataUrl && (
            <div className="px-6 pb-6 flex flex-col items-center gap-2">
              <div className="bg-white rounded-xl p-3">
                <img src={qrDataUrl} alt="QR" className="w-48 h-48" />
              </div>
              <p className="text-[10px] tracking-[0.15em] uppercase text-white/40">
                {lang === 'es' ? "Muestra este código para hacer check-in" : "Show this code to check in"}
              </p>
            </div>
          )}
        </div>
        <button
          onClick={handleAddToWallet}
          disabled={walletLoading}
          className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm text-white disabled:opacity-60"
          style={{ background: "#000" }}
        >
          {walletLoading ? (
            <svg className="animate-spin" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
          )}
          {walletLoading
            ? (lang === 'es' ? "Generando pase..." : "Generating pass...")
            : (lang === 'es' ? "Guardar en Apple Wallet" : "Add to Apple Wallet")}
        </button>
      </div>
    </div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function GrowScreen({ onOpenCircle, onGoToCircles, onGoToEvents }: { onOpenCircle?: (id: string) => void; onGoToCircles?: () => void; onGoToEvents?: () => void }) {
  const { user } = useAuth();
  const { lang } = useLang();
  const { data: profile } = useProfile();
  const { data: bookings = [] } = useBookings();

  const [showMemberCard, setShowMemberCard] = useState(false);
  const [showYourNomaya, setShowYourNomaya] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  // Feedback state
  const [selectedChips, setSelectedChips] = useState<Set<string>>(new Set());
  const [suggestion, setSuggestion] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derived values
  const plansAttended = plansAttendedCount(bookings);
  const isFoundingMember = (profile as any)?.badges?.includes?.('founding_member') ?? false;
  const memberId = getMemberId(profile);
  const memberSince = getMemberSince(profile, lang);
  const referralCode = profile?.id
    ? profile.id.replace(/-/g, '').substring(0, 8).toUpperCase()
    : '········';
  const whatsappGroupUrl = profile?.city ? WHATSAPP_GROUP_URLS[profile.city] : undefined;

  const FEEDBACK_CHIPS = [
    { key: "love_events",      label: lang === 'es' ? "🎨 Me encantan los eventos"     : "🎨 Love the events" },
    { key: "great_community",  label: lang === 'es' ? "👥 Gran energía de grupo"        : "👥 Great community energy" },
    { key: "welcoming",        label: lang === 'es' ? "🌸 Ambiente muy acogedor"        : "🌸 Feels very welcoming" },
    { key: "love_circles",     label: lang === 'es' ? "🌀 Me encantan los círculos"     : "🌀 Love the circles" },
    { key: "more_events",      label: lang === 'es' ? "📅 Quiero más eventos"           : "📅 Want more events" },
    { key: "more_variety",     label: lang === 'es' ? "✨ Más variedad de actividades"  : "✨ More variety please" },
    { key: "better_prices",    label: lang === 'es' ? "💰 Mejorar los precios"          : "💰 Better pricing" },
    { key: "great_app",        label: lang === 'es' ? "📱 Buena experiencia en la app"  : "📱 Great app experience" },
    { key: "improvement",      label: lang === 'es' ? "💡 Tiene margen de mejora"       : "💡 Has room to improve" },
  ];

  function toggleChip(key: string) {
    setSelectedChips(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function copyCode() {
    navigator.clipboard?.writeText(referralCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  const APP_STORE_URL = 'https://apps.apple.com/es/app/nomaya/id6760704850?l=en-GB';

  function shareWhatsApp() {
    const text = lang === 'es'
      ? `Me encantaría verte en mi mesa 💜 Únete a Nomaya — una comunidad exclusiva para mujeres en Madrid y Barcelona. Usa mi código ${referralCode} al registrarte. Descárgala aquí: ${APP_STORE_URL}`
      : `I'd love to see you at my table 💜 Join Nomaya — a curated community for women in Madrid and Barcelona. Use my code ${referralCode} when you sign up. Download here: ${APP_STORE_URL}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  async function handleSendFeedback() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const chipLabels = FEEDBACK_CHIPS.filter(c => selectedChips.has(c.key)).map(c => c.label).join(", ");
      const message = [chipLabels, suggestion.trim()].filter(Boolean).join("\n\n");
      await supabase.from('feedback').insert({
        user_id: user?.id,
        message,
        type: 'general',
      });
      setFeedbackSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  const hasAnyFeedback = selectedChips.size > 0 || suggestion.trim().length > 0;

  return (
    <div className="mobile-container flex flex-col bg-background overflow-y-auto pb-screen-bottom">

      {/* Header */}
      <div className="px-5 pt-screen-top pb-4 text-center">
        <Logo />
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Madrid · 2026</p>
        <h1 className="font-serif text-4xl font-normal text-foreground tracking-display">
          {lang === 'es' ? "Comunidad" : "Community"}
        </h1>
      </div>

      <div className="px-5 space-y-4 pb-8">

        {/* ── YOUR PLACE ─────────────────────────────────────── */}
        <div className="bg-card rounded-2xl shadow-soft overflow-hidden">
          <button
            onClick={() => setShowYourNomaya(true)}
            className="w-full px-5 pt-5 pb-4 border-b border-white/10 text-center space-y-1 active:opacity-70 transition-opacity"
          >
            {isFoundingMember && (
              <>
                <p className="text-3xl">🌸</p>
                <p className="font-serif text-xl font-medium text-foreground">
                  {lang === 'es' ? "Miembro fundadora" : "Founding Member"}
                </p>
              </>
            )}
            <p className="text-xs text-muted-foreground">
              {lang === 'es' ? `Miembro desde ${memberSince}` : `Member since ${memberSince}`}
            </p>
          </button>

          <div className="grid grid-cols-2 divide-x divide-white/10">
            {[
              { label: lang === 'es' ? "Planes asistidos" : "Plans attended", value: plansAttended },
              { label: "Nomaya Credit", value: `€${((profile?.credits_cents ?? 0) / 100).toFixed(2)}` },
            ].map(({ label, value }) => (
              <div key={label} className="py-4 text-center">
                <p className="font-serif text-xl font-medium text-foreground">{value}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowMemberCard(true)}
            className="w-full flex items-center justify-between px-5 py-4 border-t border-white/10 active:opacity-70 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-8 rounded-lg flex-shrink-0 overflow-hidden"
                style={{ background: "linear-gradient(135deg, #2e235a 0%, #7058c8 100%)" }}>
                <div className="absolute -right-1 -top-1 w-8 h-8 rounded-full bg-white/10" />
                <div className="absolute bottom-1 left-1.5">
                  <p className="text-white/50 text-[5px] tracking-[0.2em] uppercase font-medium">Nomaya</p>
                </div>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">
                  {lang === 'es' ? "Mi tarjeta de miembro" : "My member card"}
                </p>
                <p className="text-[10px] text-muted-foreground font-mono">{memberId}</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-muted-foreground" />
          </button>
        </div>

        {/* ── COMMUNITY ACCESS — unlocked by real attendance, not signup/booking/referral (2026-08-28) ── */}
        {plansAttended >= 1 && (
          <div className="bg-card rounded-2xl shadow-soft px-5 py-5 space-y-3">
            <h2 className="font-serif text-lg font-medium text-foreground leading-snug">
              {lang === 'es' ? "Bienvenida a la comunidad 💜" : "Welcome to the community 💜"}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {lang === 'es'
                ? "Ya viniste a tu primer plan Nomaya. Ahora puedes unirte al grupo de WhatsApp de tu ciudad y seguir en contacto más allá de los planes."
                : "You came to your first Nomaya plan. Now you can join your city's WhatsApp group and stay connected beyond the plans."}
            </p>
            {whatsappGroupUrl ? (
              <a
                href={whatsappGroupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center py-3 rounded-2xl gradient-cta text-white font-medium text-sm"
              >
                {lang === 'es' ? `Únete al grupo de WhatsApp (${profile?.city})` : `Join the WhatsApp group (${profile?.city})`}
              </a>
            ) : (
              <p className="text-[11px] text-muted-foreground italic">
                {lang === 'es' ? "Muy pronto." : "Coming soon."}
              </p>
            )}
          </div>
        )}

        {/* ── INVITE (social only, deliberately no points/tiers/money — 2026-08-28) ── */}
        <div className="bg-card rounded-2xl shadow-soft px-5 py-5 space-y-4">
          <div>
            <h2 className="font-serif text-lg font-medium text-foreground leading-snug">
              {lang === 'es' ? "Invita a alguien a Nomaya 💜" : "Invite someone to Nomaya 💜"}
            </h2>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {lang === 'es'
                ? "¿Conoces a alguien a quien le encantaría Nomaya? Invítala a unirse."
                : "Know someone who'd love Nomaya? Invite her to join you."}
            </p>
          </div>

          <div className="bg-muted rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                {lang === 'es' ? "Tu código" : "Your code"}
              </p>
              <p className="font-mono text-2xl font-bold text-foreground tracking-wider">{referralCode}</p>
            </div>
            <button
              onClick={copyCode}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border text-sm font-medium active:scale-95 transition-all"
              style={{ color: codeCopied ? "hsl(252 50% 65%)" : undefined }}
            >
              {codeCopied ? <Check size={14} /> : <Copy size={14} />}
              {codeCopied ? (lang === 'es' ? "Copiado" : "Copied") : (lang === 'es' ? "Copiar" : "Copy")}
            </button>
          </div>

          <button
            onClick={shareWhatsApp}
            className="w-full py-3.5 rounded-2xl gradient-cta text-white font-medium text-sm flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            {lang === 'es' ? "Compartir invitación" : "Share invite"}
          </button>
        </div>

        {/* ── GIVE FEEDBACK ──────────────────────────────────── */}
        <div className="bg-card rounded-2xl shadow-soft px-5 py-5 space-y-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
              {lang === 'es' ? "Tu voz importa" : "Your voice matters"}
            </p>
            <h2 className="font-serif text-lg font-medium text-foreground leading-snug">
              {lang === 'es' ? "Ayúdanos a mejorar" : "Help us improve"}
            </h2>
          </div>

          {feedbackSubmitted ? (
            <div className="text-center py-6 space-y-2">
              <p className="text-3xl">💜</p>
              <p className="font-serif text-lg font-medium text-foreground">
                {lang === 'es' ? "¡Gracias!" : "Thank you!"}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {lang === 'es'
                  ? "Tu opinión nos ayuda a hacer Nomaya mejor para todas."
                  : "Your feedback helps us make Nomaya better for everyone."}
              </p>
              <button
                onClick={() => { setFeedbackSubmitted(false); setSelectedChips(new Set()); setSuggestion(""); }}
                className="text-xs text-primary font-medium mt-2"
              >
                {lang === 'es' ? "Enviar más feedback" : "Send more feedback"}
              </button>
            </div>
          ) : (
            <>
              {/* Guided chips */}
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                  {lang === 'es' ? "¿Qué describe mejor tu experiencia?" : "What best describes your experience?"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {FEEDBACK_CHIPS.map(c => (
                    <button
                      key={c.key}
                      onClick={() => toggleChip(c.key)}
                      className={`px-3 py-2 rounded-full text-sm font-medium transition-all border ${
                        selectedChips.has(c.key)
                          ? "bg-primary/20 border-primary/50 text-foreground"
                          : "bg-muted border-transparent text-muted-foreground"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional thoughts */}
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  {lang === 'es' ? "¿Algo más que añadir?" : "Anything else?"}
                </p>
                <textarea
                  value={suggestion}
                  onChange={e => setSuggestion(e.target.value)}
                  placeholder={lang === 'es'
                    ? "Cuéntanos más..."
                    : "Tell us more…"}
                  rows={3}
                  className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
                />
              </div>

              <button
                disabled={!hasAnyFeedback || isSubmitting}
                onClick={handleSendFeedback}
                className="w-full py-4 rounded-2xl gradient-cta text-white font-medium text-base disabled:opacity-40 transition-opacity"
              >
                {isSubmitting
                  ? (lang === 'es' ? "Enviando…" : "Sending…")
                  : (lang === 'es' ? "Enviar" : "Send feedback")}
              </button>
            </>
          )}
        </div>
      </div>

      {showMemberCard && <MemberCardModal onClose={() => setShowMemberCard(false)} />}
      {showYourNomaya && (
        <YourNomayaModal
          bookings={bookings}
          lang={lang}
          onClose={() => setShowYourNomaya(false)}
          onGoToEvents={() => onGoToEvents?.()}
        />
      )}
    </div>
  );
}
