import { useState } from "react";
import { Check, ChevronRight, X } from "lucide-react";
import { Logo } from "./Logo";
import { useMonthlyStats } from "@/hooks/useMonthlyStats";
import { useLang } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const TIERS = [
  { icon: "🌸", label: "Founding Circle",       events: 1 },
  { icon: "✨", label: "Inner Circle",           events: 3 },
  { icon: "🔮", label: "Keeper of the Circle",   events: 5 },
];

const NOMAYA_MOMENTS = [
  {
    emoji: "🌸",
    title: "Your first gathering",
    desc: "You joined your first Nomaya experience",
    reward: "Your Founding Circle sticker",
    events: 1,
  },
  {
    emoji: "🌿",
    title: "You came back",
    desc: "You returned for a second experience",
    reward: "Nomaya the movement sticker",
    events: 2,
  },
  {
    emoji: "🕯",
    title: "A moment of connection",
    desc: "You've started building deeper connections",
    reward: "A purple candle",
    events: 3,
  },
  {
    emoji: "💌",
    title: "A meaningful step",
    desc: "You've been part of something special",
    reward: "A handwritten letter",
    events: 4,
  },
];

// ─── Your Month Tab ────────────────────────────────────────────────────────────

function YourMonthTab({ onOpenCircle, onGoToCircles }: {
  onOpenCircle?: (id: string) => void;
  onGoToCircles?: () => void;
}) {
  const { data: stats, isLoading } = useMonthlyStats();
  const completedTotal = stats?.completedTotal ?? 0;

  const now = new Date();
  const monthName = now.toLocaleString('default', { month: 'long' });

  // Only show moments the user has actually reached (one by one as they complete events)
  const unlockedMoments = NOMAYA_MOMENTS.filter(m => completedTotal >= m.events);
  const nextMoment = NOMAYA_MOMENTS.find(m => completedTotal < m.events);

  return (
    <div className="space-y-3">

      {/* This month stats */}
      <div className="bg-card rounded-2xl p-5 shadow-card space-y-4">
        <p className="text-xs uppercase tracking-widest font-semibold text-white/60">{monthName}</p>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-10 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-muted rounded-2xl px-4 py-3">
              <span className="text-2xl">👋</span>
              <div>
                <p className="text-base font-semibold text-foreground">
                  You've met <span className="text-primary font-bold">{stats?.womenMet ?? 0}</span> women this month
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Across {stats?.eventsThisMonth ?? 0} completed event{stats?.eventsThisMonth === 1 ? '' : 's'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-muted rounded-2xl px-4 py-3">
              <span className="text-2xl">🌀</span>
              <div>
                <p className="text-base font-semibold text-foreground">
                  You're part of <span className="text-primary font-bold">{stats?.totalCircles ?? 0}</span> circle{stats?.totalCircles === 1 ? '' : 's'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Your community</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Circles you're part of — top 3 + see all */}
      {(stats?.top3Circles?.length ?? 0) > 0 && (
        <div className="bg-card rounded-2xl p-5 shadow-card space-y-3">
          <p className="text-xs uppercase tracking-widest font-semibold text-white/60">Circles you're part of</p>
          <div className="space-y-2">
            {stats!.top3Circles.map((c) => (
              <button
                key={c.id}
                onClick={() => onOpenCircle?.(c.id)}
                className="w-full flex items-center justify-between bg-muted rounded-2xl px-4 py-3 active:opacity-70 transition-opacity"
              >
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {c.sessions > 0
                      ? `You've been to ${c.sessions} session${c.sessions === 1 ? '' : 's'}`
                      : 'Member'}
                  </p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />
              </button>
            ))}
            {(stats?.totalCircles ?? 0) > 3 && (
              <button
                onClick={() => onGoToCircles?.()}
                className="w-full flex items-center justify-between px-4 py-2 active:opacity-70"
              >
                <p className="text-sm text-primary font-medium">See all {stats!.totalCircles} circles</p>
                <ChevronRight size={16} className="text-primary flex-shrink-0" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Nomaya Moments — one by one as they unlock */}
      {(unlockedMoments.length > 0 || nextMoment) && (
        <div className="bg-card rounded-2xl p-5 shadow-card space-y-3">
          <p className="text-xs uppercase tracking-widest font-semibold text-white/60">Your Nomaya moments</p>
          <div className="space-y-2">
            {unlockedMoments.map(({ emoji, title, desc, reward }) => (
              <div key={title} className="rounded-2xl p-4 bg-primary/15 border border-primary/20 space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{emoji}</span>
                  <p className="text-sm font-semibold text-foreground flex-1">{title}</p>
                  <span className="text-xs font-medium text-primary">Earned</span>
                </div>
                <p className="text-xs text-muted-foreground pl-8">{desc}</p>
                <p className="text-xs text-primary/80 pl-8">→ {reward}</p>
              </div>
            ))}
            {nextMoment && (
              <div className="rounded-2xl p-4 bg-muted space-y-1 opacity-60">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl opacity-50">{nextMoment.emoji}</span>
                  <p className="text-sm font-semibold text-muted-foreground flex-1">{nextMoment.title}</p>
                </div>
                <p className="text-xs text-muted-foreground/60 pl-8">
                  {nextMoment.events - completedTotal} more event{nextMoment.events - completedTotal === 1 ? '' : 's'} to unlock
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Hosting Sheet ────────────────────────────────────────────────────────────

const HOSTING_TYPES = [
  { emoji: "🍝", label: "Small dinner", desc: "6–8 women · your place or a restaurant" },
  { emoji: "☕", label: "Coffee morning", desc: "4–6 women · low pressure, easy start" },
  { emoji: "🎨", label: "Workshop or skill share", desc: "Ceramics, painting, cooking, anything you love" },
  { emoji: "🌿", label: "Walk or outdoor plan", desc: "Retiro, a hike, a neighbourhood stroll" },
];

function HostingSheet({ onClose, eventsAttended }: { onClose: () => void; eventsAttended: number }) {
  const { user } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleExpress() {
    if (!user || !selected) return;
    setLoading(true);
    await supabase.from('hosting_interest').upsert({ user_id: user.id, event_type: selected });
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-background rounded-t-3xl overflow-y-auto" style={{ maxHeight: 'calc(92dvh - env(safe-area-inset-bottom, 0px))' }}>
        {/* Handle */}
        <div className="sticky top-0 bg-background px-5 pt-4 pb-3 flex items-center justify-between border-b border-border z-10">
          <div className="w-10 h-1 bg-border rounded-full absolute left-1/2 -translate-x-1/2 top-2" />
          <button onClick={onClose} className="ml-auto w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <X size={14} className="text-muted-foreground" />
          </button>
        </div>

        <div className="px-5 pb-8 pt-4 space-y-6" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 0px))' }}>

          {sent ? (
            <div className="flex flex-col items-center text-center py-8 gap-4">
              <span className="text-5xl">💜</span>
              <h2 className="font-serif text-2xl font-medium text-foreground">You're on the list</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We'll reach out when there's a good moment to plan your first gathering. No pressure — we'll do it together.
              </p>
              <button onClick={onClose} className="mt-2 w-full py-3.5 rounded-2xl gradient-cta text-white font-medium text-sm">
                Back to community
              </button>
            </div>
          ) : (
            <>
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Hosting at Nomaya</p>
                <h2 className="font-serif text-2xl font-medium text-foreground leading-snug">
                  Your table,<br />your vibe
                </h2>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Hosting at Nomaya means proposing a small gathering and showing up as yourself. We handle everything else — bookings, promotion, and making sure the right women find their way to your table.
                </p>
              </div>

              {/* What Nomaya does */}
              <div className="bg-card rounded-2xl p-4 space-y-2.5">
                <p className="text-xs uppercase tracking-widest font-semibold text-white/60">What we handle</p>
                {[
                  "📣  Promoting your event to the community",
                  "🎟️  Bookings, payments and confirmations",
                  "🤝  Matching you with women who'll love it",
                  "💬  Your own circle chat before and after",
                ].map(line => (
                  <p key={line} className="text-sm text-foreground leading-snug">{line}</p>
                ))}
              </div>

              {/* What you do */}
              <div className="bg-card rounded-2xl p-4 space-y-2.5">
                <p className="text-xs uppercase tracking-widest font-semibold text-white/60">What you bring</p>
                {[
                  "💡  An idea — a dinner, a walk, a skill",
                  "🌸  Your energy and presence",
                  "✦   Nothing has to be perfect",
                ].map(line => (
                  <p key={line} className="text-sm text-foreground leading-snug">{line}</p>
                ))}
              </div>

              {/* Pick a type */}
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">What feels right for you?</p>
                {HOSTING_TYPES.map(({ emoji, label, desc }) => (
                  <button
                    key={label}
                    onClick={() => setSelected(label)}
                    className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all ${
                      selected === label
                        ? 'bg-primary/20 border border-primary/40'
                        : 'bg-card border border-transparent'
                    }`}
                  >
                    <span className="text-xl flex-shrink-0">{emoji}</span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                    {selected === label && <Check size={16} className="text-primary ml-auto flex-shrink-0" />}
                  </button>
                ))}
              </div>

              <button
                onClick={handleExpress}
                disabled={!selected || loading}
                className="w-full py-3.5 rounded-2xl gradient-cta text-white font-medium text-sm disabled:opacity-40 transition-opacity active:opacity-80"
              >
                {loading ? "Sending…" : "I'm interested →"}
              </button>
              <p className="text-xs text-muted-foreground text-center -mt-2">
                No commitment — we'll have a conversation first
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Your Journey Tab ──────────────────────────────────────────────────────────

function YourJourneyTab({ completedEvents }: { completedEvents: number }) {
  const eventsAttended = completedEvents;
  const qualifiesForHosting = completedEvents >= 4;
  const [showHostingSheet, setShowHostingSheet] = useState(false);

  return (
    <div className="space-y-3">
      {showHostingSheet && (
        <HostingSheet onClose={() => setShowHostingSheet(false)} eventsAttended={eventsAttended} />
      )}

      {/* Hosting card */}
      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <div className="px-5 pt-5 pb-4 border-b border-white/10">
          <p className="text-xs uppercase tracking-widest font-semibold text-white/60 mb-1">Hosting</p>
          <h2 className="font-serif text-xl font-medium text-foreground leading-snug">
            You'd make a great host
          </h2>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="space-y-2.5">
            {[
              { text: `You've attended ${eventsAttended} event${eventsAttended === 1 ? '' : 's'}`, done: eventsAttended >= 1 },
              { text: "Women enjoyed meeting you", done: eventsAttended >= 3 },
            ].map(({ text, done }, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${done ? 'border-white bg-white' : 'border-white/30'}`}>
                  {done && <Check size={10} className="text-card" />}
                </div>
                <p className={`text-sm leading-snug ${done ? 'text-foreground' : 'text-white/50'}`}>{text}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed italic">
            When you feel ready, you can host something small ✦
          </p>

          {qualifiesForHosting ? (
            <button
              onClick={() => setShowHostingSheet(true)}
              className="w-full mt-2 py-3.5 rounded-2xl gradient-cta text-white font-medium text-sm active:opacity-80 transition-opacity"
            >
              Learn about hosting →
            </button>
          ) : (
            <div className="bg-muted rounded-xl px-4 py-3 mt-2 flex items-center gap-2">
              <span className="text-base">🔒</span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Complete {Math.max(0, 4 - completedEvents)} more event{4 - completedEvents === 1 ? '' : 's'} to unlock hosting.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Your Nomaya Moments */}
      <div className="bg-card rounded-2xl p-5 shadow-card space-y-4">
        <p className="text-xs uppercase tracking-widest font-semibold text-white/60">Your Nomaya moments</p>
        <div className="space-y-3">
          {NOMAYA_MOMENTS.map(({ emoji, title, desc, reward, events }) => {
            const done = eventsAttended >= events;
            return (
              <div key={title} className={`rounded-2xl p-4 space-y-1.5 transition-all ${done ? 'bg-primary/15 border border-primary/20' : 'bg-muted'}`}>
                <div className="flex items-start gap-3">
                  <span className={`text-xl flex-shrink-0 ${!done ? 'opacity-40' : ''}`}>{emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-semibold leading-snug ${done ? 'text-foreground' : 'text-muted-foreground'}`}>{title}</p>
                      {done && <span className="text-xs font-medium text-primary flex-shrink-0">Earned</span>}
                    </div>
                    <p className={`text-xs mt-0.5 leading-snug ${done ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>{desc}</p>
                    {done && (
                      <p className="text-xs mt-1.5 text-primary/80 leading-snug">→ {reward}</p>
                    )}
                    {!done && (
                      <p className="text-xs mt-1 text-muted-foreground/40">After {events} event{events === 1 ? '' : 's'}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export function GrowScreen({ onOpenCircle, onGoToCircles }: { onOpenCircle?: (id: string) => void; onGoToCircles?: () => void }) {
  const { t } = useLang();
  const [tab, setTab] = useState<"month" | "journey">("month");
  const { data: stats } = useMonthlyStats();
  const completedEvents = stats?.completedTotal ?? 0;

  return (
    <div className="mobile-container flex flex-col bg-background overflow-y-auto pb-screen-bottom">
      {/* Header */}
      <div className="px-5 pt-screen-top pb-2 text-center">
        <Logo />
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Madrid · 2026</p>
        <h1 className="font-serif text-4xl font-normal text-foreground tracking-display">{t("grow.community")}</h1>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 px-5 py-4">
        {([
          { key: "month",   label: "Your Month" },
          { key: "journey", label: "Your Journey" },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
              tab === key
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground border border-border"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="px-5">
        {tab === "month"
          ? <YourMonthTab onOpenCircle={onOpenCircle} onGoToCircles={onGoToCircles} />
          : <YourJourneyTab completedEvents={completedEvents} />
        }
      </div>
    </div>
  );
}
