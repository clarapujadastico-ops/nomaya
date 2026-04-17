import { useState } from "react";
import { Check, ChevronRight, X } from "lucide-react";
import { Logo } from "./Logo";
import { useMonthlyStats, type MonthStats } from "@/hooks/useMonthlyStats";
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
    lockedDesc: "You joined your first experience — that's how it begins",
    reward: "Your Founding Circle sticker",
    events: 1,
  },
  {
    emoji: "🌿",
    title: "You came back",
    desc: "You returned for a second experience",
    lockedDesc: "You returned for another experience → That's how connections begin",
    reward: "Nomaya the movement sticker",
    events: 2,
  },
  {
    emoji: "🕯",
    title: "A moment of connection",
    desc: "You've started building deeper connections",
    lockedDesc: "You've started building deeper connections",
    reward: "A purple candle",
    events: 3,
  },
  {
    emoji: "💌",
    title: "A meaningful step",
    desc: "You've been part of something special",
    lockedDesc: "You've been part of something that matters",
    reward: "A handwritten letter",
    events: 4,
  },
];

// ─── Your Journey Tab ─────────────────────────────────────────────────────────

function MonthCard({ m, isCurrent }: { m: MonthStats; isCurrent: boolean }) {
  const monthOnly = new Date(m.year, m.month, 1).toLocaleString('default', { month: 'long' });
  const hasAnything = m.eventsAttended > 0 || m.circlesJoined > 0 || m.womenMet > 0;

  // Only show months where something happened (or current month)
  if (!isCurrent && !hasAnything) return null;

  return (
    <div className={`rounded-2xl p-4 space-y-3 ${isCurrent ? 'bg-card shadow-card border border-primary/20' : 'bg-muted'}`}>
      <p className={`text-xs uppercase tracking-widest font-semibold ${isCurrent ? 'text-primary' : 'text-white/50'}`}>
        {isCurrent ? `This month · ${monthOnly}` : monthOnly}
      </p>

      {!hasAnything ? (
        // Current month, nothing yet — show soft message
        <p className="text-xs text-muted-foreground italic leading-relaxed">
          A small gathering might feel right soon 🌸
        </p>
      ) : (
        <div className="space-y-2.5">
          {m.eventsAttended > 0 && (
            <div className="flex items-start gap-2.5">
              <span className="text-base flex-shrink-0 mt-0.5">✦</span>
              <p className="text-sm text-foreground leading-snug">
                {m.eventsAttended === 1
                  ? "You showed up for a gathering"
                  : `You showed up for ${m.eventsAttended} gatherings`}
              </p>
            </div>
          )}
          {m.womenMet > 0 && (
            <div className="flex items-start gap-2.5">
              <span className="text-base flex-shrink-0 mt-0.5">👋</span>
              <p className="text-sm text-foreground leading-snug">
                {m.womenMet === 1
                  ? "You met someone new"
                  : `You were in the room with ${m.womenMet} other women`}
              </p>
            </div>
          )}
          {m.circlesJoined > 0 && (
            <div className="flex items-start gap-2.5">
              <span className="text-base flex-shrink-0 mt-0.5">🌀</span>
              <p className="text-sm text-foreground leading-snug">
                {m.circlesJoined === 1
                  ? "You found a new circle to belong to"
                  : "You explored different circles"}
              </p>
            </div>
          )}
        </div>
      )}

      {isCurrent && hasAnything && (
        <p className="text-xs text-muted-foreground italic">
          You're slowly finding your people here
        </p>
      )}
    </div>
  );
}

function YourJourneyTab({ onOpenCircle }: { onOpenCircle?: (id: string) => void }) {
  const { data: stats, isLoading, error } = useMonthlyStats();
  const [showHistory, setShowHistory] = useState(false);
  const completedTotal = stats?.completedTotal ?? 0;
  const unlockedMoments = NOMAYA_MOMENTS.filter(m => completedTotal >= m.events);
  const nextMoment = NOMAYA_MOMENTS.find(m => completedTotal < m.events);

  if (error) {
    return (
      <div className="bg-card rounded-2xl p-5 shadow-card">
        <p className="text-sm text-muted-foreground text-center">Could not load your journey. Pull to refresh.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2].map(i => <div key={i} className="h-24 bg-card rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  const monthStats = stats?.monthStats ?? [];
  const currentMonth = monthStats.find(m => m.isCurrent);
  const pastMonths = monthStats.filter(m => !m.isCurrent);

  return (
    <div className="space-y-3">
      {/* This month — always shown */}
      {currentMonth ? (
        <MonthCard m={currentMonth} isCurrent={true} />
      ) : (
        <div className="bg-card rounded-2xl p-5 shadow-card text-center">
          <p className="text-sm text-muted-foreground">Your journey starts with your first event 🌸</p>
        </div>
      )}

      {/* Past months — collapsed by default */}
      {pastMonths.length > 0 && (
        <>
          <button
            onClick={() => setShowHistory(v => !v)}
            className="w-full flex items-center justify-between px-1 py-1 active:opacity-60 transition-opacity"
          >
            <p className="text-xs text-muted-foreground font-medium">
              {showHistory ? "Hide past months" : `See past months (${pastMonths.length})`}
            </p>
            <ChevronRight
              size={14}
              className={`text-muted-foreground transition-transform duration-200 ${showHistory ? 'rotate-90' : ''}`}
            />
          </button>
          {showHistory && pastMonths.map(m => (
            <MonthCard key={`${m.year}-${m.month}`} m={m} isCurrent={false} />
          ))}
        </>
      )}

      {/* Nomaya Moments — identity + reflection */}
      {(unlockedMoments.length > 0 || nextMoment) && (
        <div className="bg-card rounded-2xl p-5 shadow-card space-y-3">
          <p className="text-xs uppercase tracking-widest font-semibold text-white/60">Your Nomaya moments</p>
          <div className="space-y-2">
            {unlockedMoments.map(({ emoji, title, desc, reward }) => (
              <div key={title} className="rounded-2xl p-4 bg-primary/15 border border-primary/20 space-y-1.5">
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">{emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground leading-snug">{title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{desc}</p>
                    <p className="text-xs text-primary/80 mt-1 leading-snug">→ {reward}</p>
                    <p className="text-xs font-medium text-primary mt-1.5">You received this ✓</p>
                  </div>
                </div>
              </div>
            ))}
            {nextMoment && (
              <div className="rounded-2xl p-4 bg-muted space-y-1.5">
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0 opacity-40">{nextMoment.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-muted-foreground leading-snug">{nextMoment.title}</p>
                    <p className="text-xs text-muted-foreground/70 mt-0.5 leading-snug">{nextMoment.lockedDesc}</p>
                  </div>
                </div>
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

function HostingSheet({ onClose, eventsAttended, canExpress = true }: { onClose: () => void; eventsAttended: number; canExpress?: boolean }) {
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

              {canExpress ? (
                <>
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
              ) : (
                <div className="bg-muted rounded-2xl px-4 py-4 text-center space-y-2">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    As you attend more gatherings and get a feel for the Nomaya community, hosting will open up naturally.
                  </p>
                  <button onClick={onClose} className="text-xs text-primary font-medium">Close</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Hosting Tab ──────────────────────────────────────────────────────────────

function HostingTab({ completedEvents }: { completedEvents: number }) {
  const n = completedEvents;
  const [showHostingSheet, setShowHostingSheet] = useState(false);
  const [showWomenInfo, setShowWomenInfo] = useState(false);

  // Invisible stages — no thresholds or lock language ever shown
  const stage: 'early' | 'mid' | 'ready' =
    n >= 5 ? 'ready' : n >= 3 ? 'mid' : 'early';

  return (
    <div className="space-y-3">
      {showHostingSheet && (
        <HostingSheet
          onClose={() => setShowHostingSheet(false)}
          eventsAttended={n}
          canExpress={stage !== 'early'}
        />
      )}

      {/* Women enjoyed meeting you — info sheet */}
      {showWomenInfo && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowWomenInfo(false)} />
          <div className="relative w-full max-w-sm bg-card rounded-t-3xl p-6 space-y-4" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 0px))' }}>
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-2" />
            <h3 className="font-serif text-xl font-medium text-foreground">Women enjoyed meeting you</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              After each Nomaya gathering, women can share how the experience felt.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              When conversations flow naturally and people leave feeling good, it often means you helped create that space — just by being there.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You don't have to do anything for this. It's simply a reflection of showing up 💜
            </p>
            <button
              onClick={() => setShowWomenInfo(false)}
              className="w-full py-3.5 rounded-2xl gradient-cta text-white font-medium text-sm"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Hosting card */}
      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <div className="px-5 pt-5 pb-4 border-b border-white/10">
          <p className="text-xs uppercase tracking-widest font-semibold text-white/60 mb-1">🌱 Hosting</p>
          <h2 className="font-serif text-xl font-medium text-foreground leading-snug">
            You'd make a great host
          </h2>
        </div>
        <div className="px-5 py-4 space-y-4">
          {stage === 'early' ? (
            <>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You've started experiencing Nomaya. As you get a feel for the gatherings, hosting will open up naturally.
              </p>
              <button
                onClick={() => setShowHostingSheet(true)}
                className="w-full py-3.5 rounded-2xl bg-muted text-muted-foreground font-medium text-sm active:opacity-70 transition-opacity"
              >
                Learn how hosting works
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {stage === 'ready'
                  ? "You've attended a few gatherings, women have enjoyed meeting you. You can now host a gathering of your own."
                  : "You've attended a few gatherings and women have enjoyed meeting you. You can now host a small gathering."}
              </p>
              <button
                onClick={() => setShowWomenInfo(true)}
                className="w-full flex items-center gap-2 text-left active:opacity-70"
              >
                <p className="text-xs text-primary font-medium">What does "women enjoyed meeting you" mean? →</p>
              </button>
              <button
                onClick={() => setShowHostingSheet(true)}
                className="w-full py-3.5 rounded-2xl gradient-cta text-white font-medium text-sm active:opacity-80 transition-opacity"
              >
                {stage === 'ready' ? "Host a gathering" : "Host a small gathering"}
              </button>
            </>
          )}
        </div>
      </div>

    </div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function GrowScreen({ onOpenCircle, onGoToCircles }: { onOpenCircle?: (id: string) => void; onGoToCircles?: () => void }) {
  const { t } = useLang();
  const [tab, setTab] = useState<"journey" | "hosting">("journey");
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
          { key: "journey", label: "Your Journey" },
          { key: "hosting", label: "Become a host" },
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

      <div className="px-5 pb-6">
        {tab === "journey"
          ? <YourJourneyTab onOpenCircle={onOpenCircle} />
          : <HostingTab completedEvents={completedEvents} />
        }
      </div>
    </div>
  );
}
