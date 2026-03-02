import { useState } from "react";
import { Check, Copy, ChevronDown } from "lucide-react";
import { Logo } from "./Logo";
import { useProfile } from "@/hooks/useProfile";
import { useBookings } from "@/hooks/useBookings";

const TIERS = [
  { icon: "🌸", label: "Founding Circle",  perk: "Access to all Nomaya events",        events: 1 },
  { icon: "✨", label: "Inner Circle",      perk: "Priority booking + 1 guest pass",    events: 3 },
  { icon: "🔮", label: "Keeper",            perk: "Exclusive circles + Nomaya credits", events: 5 },
  { icon: "👁️", label: "Circle Host",      perk: "Host your own Nomaya event",          events: 8 },
];

const WHATSAPP_SVG = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="white" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

function Section({ title, subtitle, defaultOpen = false, children }: {
  title: string; subtitle: string; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-card rounded-2xl shadow-card overflow-hidden">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between px-5 py-4 text-left">
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        <ChevronDown size={18} className={`text-muted-foreground transition-transform duration-200 flex-shrink-0 ml-3 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-5 pb-5 pt-1 border-t border-border/50">{children}</div>}
    </div>
  );
}

function ProgressTab({ eventsAttended }: { eventsAttended: number }) {
  const currentTier = [...TIERS].reverse().find(t => eventsAttended >= t.events) ?? null;
  const nextTier = TIERS.find(t => eventsAttended < t.events);
  const progressPct = nextTier ? Math.min(Math.round((eventsAttended / nextTier.events) * 100), 100) : 100;

  const hostSteps = [
    { label: "8 events attended", done: eventsAttended >= 8, value: `${Math.min(eventsAttended, 8)}/8` },
    { label: "2 referrals made",  done: false,               value: "0/2" },
    { label: "4.8+ rating",       done: false,               value: "—" },
    { label: "Host onboarding",   done: false,               value: "Pending" },
  ];
  const hostDone = hostSteps.filter(s => s.done).length;

  return (
    <div className="space-y-3">
      {/* Your Level */}
      <Section
        title="Your level"
        subtitle={currentTier ? `${currentTier.icon} ${currentTier.label}` : "Attend your first event to unlock"}
        defaultOpen
      >
        <div className="pt-3 space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{eventsAttended} event{eventsAttended !== 1 ? "s" : ""} attended</span>
            {nextTier && <span>{nextTier.events - eventsAttended} to {nextTier.label}</span>}
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${progressPct}%`, background: "hsl(252 50% 65%)" }} />
          </div>
          <div className="space-y-2">
            {TIERS.map((tier) => {
              const unlocked = eventsAttended >= tier.events;
              return (
                <div key={tier.label} className={`flex items-center gap-3 p-3 rounded-xl ${unlocked ? "bg-primary/10" : "bg-muted/50"}`}>
                  <span className="text-lg flex-shrink-0">{tier.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium leading-snug ${unlocked ? "text-foreground" : "text-muted-foreground"}`}>{tier.label}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{tier.perk}</p>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${unlocked ? "bg-primary/20 text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {unlocked ? "Unlocked" : `${tier.events} events`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* Host Pathway */}
      <Section title="Become a Nomaya Host" subtitle={`${hostDone}/4 steps complete`}>
        <div className="pt-3 space-y-3">
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${(hostDone / 4) * 100}%`, background: "hsl(252 50% 65%)" }} />
          </div>
          <div className="space-y-3">
            {hostSteps.map(({ label, done, value }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${done ? "border-primary bg-primary" : "border-border"}`}>
                    {done && <Check size={10} className="text-primary-foreground" />}
                  </div>
                  <span className={`text-sm ${done ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
                </div>
                <span className="text-xs text-muted-foreground">{value}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">Complete all steps and we'll reach out with your host onboarding. 💜</p>
        </div>
      </Section>
    </div>
  );
}

function RewardsTab({ profile }: { profile: { id?: string; credits_cents?: number } | null | undefined }) {
  const [referralCopied, setReferralCopied] = useState(false);

  const referralCode = profile?.id
    ? profile.id.replace(/-/g, '').substring(0, 8).toUpperCase()
    : '········';

  const creditsEur = ((profile?.credits_cents ?? 0) / 100).toFixed(2);

  function copyReferral() {
    navigator.clipboard?.writeText(referralCode);
    setReferralCopied(true);
    setTimeout(() => setReferralCopied(false), 2000);
  }

  function shareOnWhatsApp() {
    const text = `I'd love to see you at my table 💜 Join Nomaya — a curated community for women in Madrid. Use my code ${referralCode} for 15% off your first event + early access. https://nomaya.app`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  return (
    <div className="space-y-3">
      {/* Credits */}
      <div className="bg-card rounded-2xl p-5 shadow-card space-y-4">
        <p className="font-serif text-lg font-normal text-foreground leading-snug">
          "Your circle grows<br />when you show up."
        </p>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">Your balance</p>
            <p className="font-mono text-4xl font-bold text-foreground">€{creditsEur}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Nomaya credits</p>
          </div>
          <div className="text-4xl opacity-60">💜</div>
        </div>
        <div className="bg-muted rounded-xl px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">How to redeem</p>
          <p className="text-sm text-foreground leading-relaxed">Applied automatically at checkout on your next booking.</p>
        </div>
      </div>

      {/* How to earn */}
      <div className="bg-card rounded-2xl p-5 shadow-card">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">How to earn</p>
        <div className="space-y-3">
          {[
            { icon: "🎟️", label: "Attend an event",  value: "+4 credits" },
            { icon: "🎁", label: "Refer a friend",    value: "+10 credits" },
            { icon: "⭐", label: "Leave a review",    value: "+2 credits" },
          ].map(({ icon, label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">{icon}</span>
                <span className="text-sm text-foreground">{label}</span>
              </div>
              <span className="text-sm font-semibold" style={{ color: "hsl(252 50% 75%)" }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Invite a friend */}
      <div className="bg-card rounded-2xl p-5 shadow-card space-y-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Invite a friend</p>
          <h2 className="font-serif text-lg font-medium text-foreground leading-snug">Invite a woman you'd love<br />to see at your table.</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted rounded-xl p-3 space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">She gets</p>
            {["15% off her first event", "Early access"].map(item => (
              <div key={item} className="flex items-start gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "hsl(252 50% 65%)" }} />
                <span className="text-xs text-foreground leading-snug">{item}</span>
              </div>
            ))}
          </div>
          <div className="bg-muted rounded-xl p-3 space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">You get</p>
            {["10€ Nomaya credit", "+1 Circle Point"].map(item => (
              <div key={item} className="flex items-start gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "hsl(252 50% 65%)" }} />
                <span className="text-xs text-foreground leading-snug">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-muted rounded-xl p-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Your code</p>
            <p className="font-mono text-2xl font-bold text-foreground tracking-wider">{referralCode}</p>
          </div>
          <button
            onClick={copyReferral}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border text-sm font-medium active:scale-95 transition-all"
            style={{ color: referralCopied ? "hsl(252 50% 65%)" : undefined }}
          >
            {referralCopied ? <Check size={14} /> : <Copy size={14} />}
            {referralCopied ? "Copied!" : "Copy"}
          </button>
        </div>
        <button
          onClick={shareOnWhatsApp}
          className="w-full py-3.5 rounded-2xl gradient-cta text-white font-medium text-sm flex items-center justify-center gap-2"
        >
          {WHATSAPP_SVG}
          Share on WhatsApp
        </button>
      </div>
    </div>
  );
}

export function GrowScreen() {
  const { data: profile } = useProfile();
  const { data: bookings = [] } = useBookings();
  const [tab, setTab] = useState<"progress" | "rewards">("progress");

  return (
    <div className="mobile-container flex flex-col bg-background overflow-y-auto pb-28">
      {/* Header */}
      <div className="px-5 pt-14 pb-2 text-center">
        <Logo />
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Madrid · 2026</p>
        <h1 className="font-serif text-4xl font-normal text-foreground tracking-display">Community</h1>
      </div>

      {/* Internal tab switcher */}
      <div className="flex gap-2 px-5 py-4">
        {(["progress", "rewards"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
              tab === t
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground border border-border"
            }`}
          >
            {t === "progress" ? "Progress" : "Rewards"}
          </button>
        ))}
      </div>

      <div className="px-5">
        {tab === "progress"
          ? <ProgressTab eventsAttended={bookings.length} />
          : <RewardsTab profile={profile} />
        }
      </div>
    </div>
  );
}
