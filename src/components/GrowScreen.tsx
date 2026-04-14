import { useState, useEffect } from "react";
import { Check, Copy, Users } from "lucide-react";
import { Logo } from "./Logo";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useBookings } from "@/hooks/useBookings";
import { useCircles } from "@/hooks/useCircles";
import { useLang } from "@/contexts/LanguageContext";

function generateCode(name: string | undefined, id: string | undefined): string {
  const prefix = name
    ? name.trim().toUpperCase().replace(/[^A-Z]/g, '').substring(0, 5)
    : '';
  const suffix = (id ?? '').replace(/-/g, '').substring(0, 4).toUpperCase();
  return (prefix + suffix).substring(0, 8) || Math.random().toString(36).substring(2, 8).toUpperCase();
}

const TIERS = [
  { icon: "🌸", labelKey: "badge.founding_circle", events: 1, perkKeys: ["grow.perk_all_access", "grow.perk_founding_badge"] },
  { icon: "✨", labelKey: "badge.inner_circle",    events: 3, perkKeys: ["grow.perk_priority", "grow.perk_guest_pass"] },
  { icon: "🔮", labelKey: "badge.keeper",           events: 5, perkKeys: ["grow.perk_early_retreats", "grow.perk_10off"] },
  { icon: "👁️", labelKey: "grow.tier_host",         events: 8, perkKeys: ["grow.perk_host_own", "grow.perk_host_dinners"] },
];

const WHATSAPP_SVG = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="white" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);


function ProgressTab({ eventsAttended, circles, onOpenCircle }: { eventsAttended: number; circles: { id: string; name: string; memberCount: number; category: string }[]; onOpenCircle?: (id: string) => void }) {
  const { t } = useLang();

  const topCircles = [...circles]
    .filter(c => c.memberCount > 0)
    .sort((a, b) => b.memberCount - a.memberCount)
    .slice(0, 3);

  const hostSteps = [
    { labelKey: "grow.step_8events",    done: eventsAttended >= 8, value: `${Math.min(eventsAttended, 8)}/8` },
    { labelKey: "grow.step_2referrals", done: false,               value: "0/2" },
    { labelKey: "grow.step_rating",     done: false,               value: "—" },
    { labelKey: "grow.step_onboarding", done: false,               valueKey: "grow.step_pending" },
  ];
  const hostDone = hostSteps.filter(s => s.done).length;

  return (
    <div className="space-y-3">

      {/* Community Spotlight */}
      {topCircles.length > 0 && (
        <div className="bg-card rounded-2xl p-5 shadow-card space-y-4">
          <p className="text-xs uppercase tracking-widest font-semibold text-white/60">{t("grow.most_active")}</p>
          <div className="space-y-4">
            {topCircles.map((c, i) => {
              const maxMembers = topCircles[0].memberCount;
              const pct = Math.round((c.memberCount / maxMembers) * 100);
              const medals = ["🥇","🥈","🥉"];
              return (
                <button key={c.id} onClick={() => onOpenCircle?.(c.id)} className="w-full text-left active:opacity-70 transition-opacity">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl flex-shrink-0">{medals[i]}</span>
                      <span className="text-base font-semibold text-white truncate">{c.name}</span>
                    </div>
                    <span className="text-sm text-white/70 flex-shrink-0 flex items-center gap-1.5 ml-2 font-medium">
                      <Users size={13} />{c.memberCount}
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.15)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "rgba(255,255,255,0.75)" }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Host Pathway — always visible */}
      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <p className="text-base font-semibold text-white">{t("grow.host_title")}</p>
          <p className="text-sm text-white/60 mt-0.5">{hostDone}/4 {t("grow.step_onboarding").toLowerCase()}</p>
        </div>
        <div className="px-5 pb-5 pt-4 space-y-4">
          <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.15)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${(hostDone / 4) * 100}%`, background: "rgba(255,255,255,0.75)" }} />
          </div>
          <div className="space-y-3.5">
            {hostSteps.map(({ labelKey, done, value, valueKey }) => (
              <div key={labelKey} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${done ? "border-white bg-white" : "border-white/40"}`}>
                    {done && <Check size={12} className="text-card" />}
                  </div>
                  <span className={`text-sm font-medium ${done ? "text-white" : "text-white/75"}`}>{t(labelKey)}</span>
                </div>
                <span className="text-sm font-semibold text-white/80">{valueKey ? t(valueKey) : value}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-white/60 leading-relaxed">{t("grow.host_done_msg")}</p>
        </div>
      </div>
    </div>
  );
}

function RewardsTab({ profile, onSaveCode }: { profile: { id?: string; name?: string; credits_cents?: number } | null | undefined; onSaveCode: (code: string) => void }) {
  const { t } = useLang();
  const [referralCopied, setReferralCopied] = useState(false);

  const storedCode = (profile as any)?.referral_code as string | null | undefined;
  const referralCode = storedCode || generateCode((profile as any)?.name, profile?.id) || '········';

  useEffect(() => {
    if (profile?.id && !storedCode && referralCode !== '········') {
      onSaveCode(referralCode);
    }
  }, [profile?.id, storedCode]);

  const creditsEur = ((profile?.credits_cents ?? 0) / 100).toFixed(2);

  function copyReferral() {
    navigator.clipboard?.writeText(referralCode);
    setReferralCopied(true);
    setTimeout(() => setReferralCopied(false), 2000);
  }

  function shareOnWhatsApp() {
    const text = `I'd love to see you at my table 💜\n\nJoin Nomaya — a curated community for women in Madrid.\n\n👉 Download the app: https://apps.apple.com/app/nomaya/id6743720892\n\nUse my code *${referralCode}* when you sign up to get €7.50 welcome credit. I'll get €10 credit too 💜`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  return (
    <div className="space-y-3">
      {/* Credits */}
      <div className="bg-card rounded-2xl p-5 shadow-card space-y-4">
        <p className="font-serif text-lg font-normal text-foreground leading-snug">
          {t("grow.quote").split('\n').map((line, i, arr) => (
            <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
          ))}
        </p>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold text-white/60 mb-0.5">{t("grow.balance")}</p>
            <p className="font-mono text-4xl font-bold text-foreground">€{creditsEur}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t("grow.nomaya_credits")}</p>
          </div>
          <div className="text-4xl opacity-60">💜</div>
        </div>
        <div className="bg-muted rounded-xl px-4 py-3">
          <p className="text-xs uppercase tracking-widest font-semibold text-white/60 mb-1">{t("grow.how_to_redeem")}</p>
          <p className="text-sm text-foreground leading-relaxed">{t("grow.redeem_desc")}</p>
        </div>
      </div>

      {/* How to earn */}
      <div className="bg-card rounded-2xl p-5 shadow-card">
        <p className="text-xs uppercase tracking-widest font-semibold text-white/60 mb-3">{t("grow.how_to_earn")}</p>
        <div className="space-y-3">
          {[
            { icon: "🎟️", labelKey: "grow.earn_attend", value: "+4 credits" },
            { icon: "🎁", labelKey: "grow.earn_refer",   value: "+10 credits" },
            { icon: "⭐", labelKey: "grow.earn_review",  value: "+2 credits" },
          ].map(({ icon, labelKey, value }) => (
            <div key={labelKey} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">{icon}</span>
                <span className="text-sm text-foreground">{t(labelKey)}</span>
              </div>
              <span className="text-sm font-semibold" style={{ color: "hsl(252 50% 75%)" }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Invite a friend */}
      <div className="bg-card rounded-2xl p-5 shadow-card space-y-4">
        <div>
          <p className="text-xs uppercase tracking-widest font-semibold text-white/60 mb-1">{t("profile.invite_friends")}</p>
          <h2 className="font-serif text-lg font-medium text-foreground leading-snug">
            {t("grow.invite_heading").split('\n').map((line, i, arr) => (
              <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
            ))}
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted rounded-xl p-3 space-y-1.5">
            <p className="text-xs uppercase tracking-widest font-semibold text-white/60">{t("grow.she_gets")}</p>
            {[t("grow.perk_15off"), t("grow.perk_early_access")].map(item => (
              <div key={item} className="flex items-start gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "hsl(252 50% 65%)" }} />
                <span className="text-xs text-foreground leading-snug">{item}</span>
              </div>
            ))}
          </div>
          <div className="bg-muted rounded-xl p-3 space-y-1.5">
            <p className="text-xs uppercase tracking-widest font-semibold text-white/60">{t("grow.you_get")}</p>
            {[t("grow.perk_credit"), t("grow.perk_circle_point")].map(item => (
              <div key={item} className="flex items-start gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "hsl(252 50% 65%)" }} />
                <span className="text-xs text-foreground leading-snug">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-muted rounded-xl p-3 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold text-white/60 mb-1">{t("grow.your_code")}</p>
            <p className="font-mono text-2xl font-bold text-foreground tracking-wider">{referralCode}</p>
          </div>
          <button
            onClick={copyReferral}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border text-sm font-medium active:scale-95 transition-all"
            style={{ color: referralCopied ? "hsl(252 50% 65%)" : undefined }}
          >
            {referralCopied ? <Check size={14} /> : <Copy size={14} />}
            {referralCopied ? t("grow.copied") : t("grow.copy")}
          </button>
        </div>
        <button
          onClick={shareOnWhatsApp}
          className="w-full py-3.5 rounded-2xl gradient-cta text-white font-medium text-sm flex items-center justify-center gap-2"
        >
          {WHATSAPP_SVG}
          {t("grow.share_whatsapp")}
        </button>
      </div>
    </div>
  );
}

export function GrowScreen({ onOpenCircle }: { onOpenCircle?: (id: string) => void }) {
  const { t } = useLang();
  const { data: profile } = useProfile();
  const { mutate: updateProfile } = useUpdateProfile();
  const { data: bookings = [] } = useBookings();
  const { data: circles = [] } = useCircles();
  const [tab, setTab] = useState<"progress" | "rewards">("progress");

  function handleSaveCode(code: string) {
    updateProfile({ referral_code: code });
  }

  return (
    <div className="mobile-container flex flex-col bg-background overflow-y-auto pb-28">
      {/* Header */}
      <div className="px-5 pt-14 pb-2 text-center">
        <Logo />
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Madrid · 2026</p>
        <h1 className="font-serif text-4xl font-normal text-foreground tracking-display">{t("grow.community")}</h1>
      </div>

      {/* Internal tab switcher */}
      <div className="flex gap-2 px-5 py-4">
        {(["progress", "rewards"] as const).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
              tab === tabKey
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground border border-border"
            }`}
          >
            {tabKey === "progress" ? t("grow.progress_tab") : t("grow.rewards_tab")}
          </button>
        ))}
      </div>

      <div className="px-5">
        {tab === "progress"
          ? <ProgressTab eventsAttended={bookings.length} circles={circles} onOpenCircle={onOpenCircle} />
          : <RewardsTab profile={profile} onSaveCode={handleSaveCode} />
        }
      </div>
    </div>
  );
}
