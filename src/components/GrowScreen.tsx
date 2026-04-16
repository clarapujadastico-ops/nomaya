import { useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import { Logo } from "./Logo";
import { useProfile } from "@/hooks/useProfile";
import { useBookings } from "@/hooks/useBookings";
import { useCircles } from "@/hooks/useCircles";
import { useMonthlyStats } from "@/hooks/useMonthlyStats";
import { useLang } from "@/contexts/LanguageContext";

const TIERS = [
  { icon: "🌸", label: "Founding Circle",       events: 1,  perks: ["All events access", "Founding badge"] },
  { icon: "✨", label: "Inner Circle",           events: 3,  perks: ["Priority booking", "Guest pass"] },
  { icon: "🔮", label: "Keeper of the Circle",   events: 5,  perks: ["Early retreat access", "10% off"] },
];

// ─── Your Month Tab ────────────────────────────────────────────────────────────

function YourMonthTab({ eventsAttended, onOpenCircle }: {
  eventsAttended: number;
  onOpenCircle?: (id: string) => void;
}) {
  const { data: stats, isLoading } = useMonthlyStats();

  const now = new Date();
  const monthName = now.toLocaleString('default', { month: 'long' });

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
                <p className="text-xs text-muted-foreground mt-0.5">Across {stats?.eventsThisMonth ?? 0} events</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-muted rounded-2xl px-4 py-3">
              <span className="text-2xl">🌀</span>
              <div>
                <p className="text-base font-semibold text-foreground">
                  You joined <span className="text-primary font-bold">{stats?.circlesJoinedCount ?? 0}</span> circles
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">New this month</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Circles you're part of */}
      {(stats?.myCircles?.length ?? 0) > 0 && (
        <div className="bg-card rounded-2xl p-5 shadow-card space-y-4">
          <p className="text-xs uppercase tracking-widest font-semibold text-white/60">Circles you're part of</p>
          <div className="space-y-2">
            {stats!.myCircles.map((c) => (
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
                      : 'Recently joined'}
                  </p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tier progress */}
      <div className="bg-card rounded-2xl p-5 shadow-card space-y-4">
        <p className="text-xs uppercase tracking-widest font-semibold text-white/60">Your level</p>
        <div className="space-y-3">
          {TIERS.map(({ icon, label, events }) => {
            const done = eventsAttended >= events;
            return (
              <div key={label} className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${done ? 'bg-primary/20' : 'bg-muted'}`}>
                <span className="text-xl flex-shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${done ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{events} events</p>
                </div>
                {done && <Check size={16} className="text-primary flex-shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Your Journey Tab ──────────────────────────────────────────────────────────

function YourJourneyTab({ eventsAttended }: { eventsAttended: number }) {
  const qualifiesForHosting = eventsAttended >= 5;

  return (
    <div className="space-y-3">

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
              { icon: "✓", text: `You've attended ${eventsAttended} event${eventsAttended === 1 ? '' : 's'}`, done: eventsAttended >= 1 },
              { icon: "✓", text: "Women enjoyed meeting you", done: eventsAttended >= 3 },
              { icon: "✦", text: "When you feel ready, you can host something small", done: false },
            ].map(({ icon, text, done }, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${done ? 'border-white bg-white' : 'border-white/30'}`}>
                  {done && <Check size={10} className="text-card" />}
                </div>
                <p className={`text-sm leading-snug ${done ? 'text-foreground' : 'text-white/50'}`}>{text}</p>
              </div>
            ))}
          </div>

          {qualifiesForHosting ? (
            <button className="w-full mt-2 py-3.5 rounded-2xl gradient-cta text-white font-medium text-sm active:opacity-80 transition-opacity">
              Learn about hosting →
            </button>
          ) : (
            <div className="bg-muted rounded-xl px-4 py-3 mt-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Attend {Math.max(0, 5 - eventsAttended)} more event{5 - eventsAttended === 1 ? '' : 's'} to unlock hosting.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Journey milestones */}
      <div className="bg-card rounded-2xl p-5 shadow-card space-y-4">
        <p className="text-xs uppercase tracking-widest font-semibold text-white/60">Your milestones</p>
        <div className="space-y-3">
          {TIERS.map(({ icon, label, events, perks }) => {
            const done = eventsAttended >= events;
            return (
              <div key={label} className={`rounded-2xl p-4 space-y-2 ${done ? 'bg-primary/15 border border-primary/20' : 'bg-muted opacity-60'}`}>
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{icon}</span>
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  {done && <span className="ml-auto text-xs font-medium text-primary">Unlocked</span>}
                </div>
                <div className="space-y-1 pl-8">
                  {perks.map(p => (
                    <div key={p} className="flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-muted-foreground flex-shrink-0" />
                      <p className="text-xs text-muted-foreground">{p}</p>
                    </div>
                  ))}
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

export function GrowScreen({ onOpenCircle }: { onOpenCircle?: (id: string) => void }) {
  const { t } = useLang();
  const { data: profile } = useProfile();
  const { data: bookings = [] } = useBookings();
  const { data: circles = [] } = useCircles();
  const [tab, setTab] = useState<"month" | "journey">("month");

  const eventsAttended = bookings.filter(b => b.status === 'confirmed').length;

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
          ? <YourMonthTab eventsAttended={eventsAttended} onOpenCircle={onOpenCircle} />
          : <YourJourneyTab eventsAttended={eventsAttended} />
        }
      </div>
    </div>
  );
}
