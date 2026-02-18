import { useState } from "react";
import { ChevronRight, Check } from "lucide-react";
import { INTERESTS } from "@/data/mockData";
import { useUpdateProfile } from "@/hooks/useProfile";

type Step = "language" | "welcome1" | "welcome2" | "welcome3" | "interests" | "profile";

interface OnboardingProps {
  onComplete: () => void;
}

const welcomeScreens = [
  {
    title: "Discover curated\nexperiences",
    subtitle: "Handpicked events designed for depth — not scale. Every gathering, carefully chosen.",
  },
  {
    title: "Meet women through\nshared interests",
    subtitle: "Connection built on what you love, not algorithms. Show up. Be seen.",
  },
  {
    title: "Belong to a circle\nover time",
    subtitle: "From one event to a small community. Real belonging comes from showing up again.",
  },
];

/* ─── Video background (reused across landing + welcome screens) ─── */
function VideoBackground({ opacity = 1 }: { opacity?: number }) {
  return (
    <video
      autoPlay
      muted
      loop
      playsInline
      className="absolute inset-0 w-full h-full object-cover"
      style={{ opacity }}
    >
      <source src="/videos/nomaya-hero.mov" type="video/mp4" />
    </video>
  );
}

export function OnboardingFlow({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<Step>("language");
  const [language, setLanguage] = useState<"en" | "es">("en");
  const [welcomeIndex, setWelcomeIndex] = useState(0);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [profile, setProfile] = useState({ name: "", city: "", bio: "" });
  const [saveError, setSaveError] = useState<string | null>(null);
  const { mutate: updateProfile, isPending: isSaving } = useUpdateProfile();

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  /* ── LANGUAGE / LANDING ── */
  if (step === "language") {
    return (
      <div className="mobile-container flex flex-col relative overflow-hidden" style={{ minHeight: "100dvh" }}>
        {/* Full-bleed video */}
        <VideoBackground />

        {/* Multi-layer overlay: dark base + soft vignette */}
        <div className="absolute inset-0 bg-foreground/50" />
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse at 50% 60%, transparent 30%, hsl(252 30% 8% / 0.7) 100%)"
        }} />
        <div className="absolute inset-0" style={{
          background: "linear-gradient(to bottom, transparent 30%, hsl(252 30% 8% / 0.95) 100%)"
        }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col flex-1 px-6 pt-safe">
          {/* Top spacer + wordmark */}
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            {/* Decorative line */}
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px w-10 bg-card/40" />
              <span className="text-[10px] tracking-[0.35em] uppercase text-card/50">Est. 2026</span>
              <div className="h-px w-10 bg-card/40" />
            </div>

            <h1
              className="font-serif font-normal leading-none text-card mb-3"
              style={{ fontSize: "clamp(3.5rem, 16vw, 5rem)", letterSpacing: "-0.04em" }}
            >
              Nomaya
            </h1>
            <p className="text-xs text-card/50 tracking-[0.3em] uppercase">
              women · circles · belonging
            </p>
          </div>

          {/* Bottom card — glassy */}
          <div
            className="rounded-3xl p-6 mb-8 mt-4"
            style={{
              background: "hsl(252 30% 8% / 0.55)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid hsl(0 0% 100% / 0.10)",
            }}
          >
            <p className="text-xs text-card/50 tracking-widest uppercase text-center mb-5">
              Choose your language
            </p>

            <div className="space-y-2.5 mb-6">
              {[
                { code: "en" as const, label: "English", flag: "🇬🇧" },
                { code: "es" as const, label: "Español", flag: "🇪🇸" },
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border transition-all duration-200"
                  style={{
                    borderColor: language === lang.code
                      ? "hsl(252 75% 93% / 0.5)"
                      : "hsl(0 0% 100% / 0.10)",
                    background: language === lang.code
                      ? "hsl(252 75% 93% / 0.15)"
                      : "hsl(0 0% 100% / 0.05)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{lang.flag}</span>
                    <span className="font-medium text-card/90 text-sm">{lang.label}</span>
                  </div>
                  {language === lang.code && (
                    <Check size={15} style={{ color: "hsl(252 75% 80%)" }} />
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep("welcome1")}
              className="w-full py-4 rounded-2xl font-medium text-sm tracking-wide transition-all duration-200 active:scale-[0.98]"
              style={{
                background: "hsl(252 30% 45%)",
                color: "hsl(252 75% 97%)",
                boxShadow: "0 4px 32px hsl(252 30% 45% / 0.5)",
              }}
            >
              Enter Nomaya
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── WELCOME SLIDES (video continues in background) ── */
  if (step === "welcome1" || step === "welcome2" || step === "welcome3") {
    const screen = welcomeScreens[welcomeIndex];
    const stepMap: Step[] = ["welcome1", "welcome2", "welcome3"];
    const isLast = welcomeIndex === 2;

    return (
      <div className="mobile-container flex flex-col relative overflow-hidden" style={{ minHeight: "100dvh" }}>
        <VideoBackground opacity={0.5} />
        <div className="absolute inset-0 bg-foreground/60" />
        <div className="absolute inset-0" style={{
          background: "linear-gradient(to bottom, hsl(252 30% 8% / 0.4) 0%, hsl(252 30% 8% / 0.85) 70%, hsl(252 30% 8% / 0.98) 100%)"
        }} />

        <div className="relative z-10 flex flex-col flex-1 px-6 pt-14 pb-10">
          {/* Progress */}
          <div className="flex gap-1.5 mb-auto">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-0.5 rounded-full transition-all duration-500"
                style={{
                  width: i === welcomeIndex ? "2rem" : "0.5rem",
                  background: i === welcomeIndex
                    ? "hsl(252 75% 80%)"
                    : "hsl(0 0% 100% / 0.25)",
                }}
              />
            ))}
          </div>

          <div className="flex-1 flex flex-col justify-end pb-6">
            <div
              className="inline-block px-3 py-1 rounded-full text-[10px] tracking-widest uppercase mb-5"
              style={{
                background: "hsl(252 75% 93% / 0.15)",
                color: "hsl(252 75% 85%)",
                border: "1px solid hsl(252 75% 80% / 0.3)",
              }}
            >
              {welcomeIndex + 1} of 3
            </div>

            <h2
              className="font-serif font-normal text-card leading-tight mb-4 whitespace-pre-line"
              style={{ fontSize: "clamp(2rem, 9vw, 2.75rem)", letterSpacing: "-0.042em" }}
            >
              {screen.title}
            </h2>
            <p className="text-sm text-card/60 leading-relaxed mb-8">
              {screen.subtitle}
            </p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  if (isLast) {
                    setStep("interests");
                  } else {
                    setWelcomeIndex((i) => i + 1);
                    setStep(stepMap[welcomeIndex + 1]);
                  }
                }}
                className="w-full py-4 rounded-2xl font-medium text-sm tracking-wide transition-all duration-200 active:scale-[0.98]"
                style={{
                  background: "hsl(252 30% 45%)",
                  color: "hsl(252 75% 97%)",
                  boxShadow: "0 4px 32px hsl(252 30% 45% / 0.5)",
                }}
              >
                {isLast ? "Choose your interests" : "Continue"}
                {!isLast && <ChevronRight size={16} className="inline ml-1" />}
              </button>
              <button
                onClick={() => {
                  if (welcomeIndex > 0) {
                    setWelcomeIndex((i) => i - 1);
                    setStep(stepMap[welcomeIndex - 1]);
                  } else {
                    setStep("language");
                  }
                }}
                className="w-full py-3 text-card/40 text-sm"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── INTERESTS ── */
  if (step === "interests") {
    return (
      <div className="mobile-container flex flex-col bg-background px-6 pt-14 pb-10">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Step 1 of 2</p>
          <h2
            className="font-serif font-normal text-foreground leading-tight"
            style={{ fontSize: "2rem", letterSpacing: "-0.042em" }}
          >
            What do you love?
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Select all that speak to you. We'll use these to surface events you'll actually enjoy.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 mb-8">
          {INTERESTS.map((interest) => {
            const isSelected = selectedInterests.includes(interest.id);
            return (
              <button
                key={interest.id}
                onClick={() => toggleInterest(interest.id)}
                className="px-4 py-2.5 rounded-full border text-sm font-medium transition-all duration-200 flex items-center gap-2"
                style={
                  isSelected
                    ? {
                        background: "hsl(var(--nomaya-purple))",
                        borderColor: "transparent",
                        color: "hsl(252 75% 97%)",
                        boxShadow: "0 2px 12px hsl(252 30% 45% / 0.3)",
                      }
                    : {}
                }
              >
                <span>{interest.emoji}</span>
                {interest.label}
              </button>
            );
          })}
        </div>

        <div className="mt-auto space-y-3">
          <button
            onClick={() => setStep("profile")}
            disabled={selectedInterests.length < 2}
            className="w-full py-4 rounded-2xl font-medium text-sm transition-all duration-200 active:scale-[0.98]"
            style={
              selectedInterests.length >= 2
                ? {
                    background: "hsl(var(--nomaya-purple))",
                    color: "hsl(252 75% 97%)",
                    boxShadow: "0 4px 24px hsl(252 30% 45% / 0.35)",
                  }
                : {}
            }
          >
            Continue · {selectedInterests.length} selected
          </button>
          <button onClick={() => setStep("profile")} className="w-full py-2 text-muted-foreground text-sm">
            Skip for now
          </button>
        </div>
      </div>
    );
  }

  /* ── PROFILE ── */
  if (step === "profile") {
    return (
      <div className="mobile-container flex flex-col bg-background px-6 pt-14 pb-10">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Step 2 of 2</p>
          <h2
            className="font-serif font-normal text-foreground leading-tight"
            style={{ fontSize: "2rem", letterSpacing: "-0.042em" }}
          >
            Tell us about you
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            A simple profile so your circle knows who's coming.
          </p>
        </div>

        <div className="flex justify-center mb-6">
          <button className="w-24 h-24 rounded-full bg-secondary border-2 border-dashed border-border flex items-center justify-center text-3xl transition-all duration-200 active:scale-95">
            📸
          </button>
        </div>

        <div className="space-y-4 flex-1">
          {[
            { key: "name", label: "Your name", placeholder: "Sofia" },
            { key: "city", label: "City", placeholder: "Barcelona" },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5 block">
                {label}
              </label>
              <input
                type="text"
                placeholder={placeholder}
                value={profile[key as keyof typeof profile]}
                onChange={(e) => setProfile((p) => ({ ...p, [key]: e.target.value }))}
                className="w-full px-4 py-3.5 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition"
              />
            </div>
          ))}
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5 block">
              Short bio <span className="normal-case">(optional)</span>
            </label>
            <textarea
              placeholder="Designer. Ceramics enthusiast. Dog mum."
              value={profile.bio}
              onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3.5 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition resize-none"
            />
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {saveError && (
            <p className="text-xs text-destructive px-1">{saveError}</p>
          )}
          <button
            onClick={() => {
              setSaveError(null);
              updateProfile(
                { name: profile.name, city: profile.city, bio: profile.bio || null, language, interests: selectedInterests },
                {
                  onSuccess: () => onComplete(),
                  onError: (err) => setSaveError((err as Error).message),
                }
              );
            }}
            disabled={isSaving}
            className="w-full py-4 rounded-2xl font-medium text-sm tracking-wide transition-all duration-200 active:scale-[0.98] disabled:opacity-60"
            style={{
              background: "hsl(var(--nomaya-purple))",
              color: "hsl(252 75% 97%)",
              boxShadow: "0 4px 32px hsl(252 30% 45% / 0.4)",
            }}
          >
            {isSaving ? "Saving…" : "Enter Nomaya ✦"}
          </button>
          <button
            onClick={() => {
              setSaveError(null);
              updateProfile(
                { name: profile.name || "Member", city: profile.city || "", bio: profile.bio || null, language, interests: selectedInterests },
                { onSuccess: () => onComplete(), onError: () => onComplete() }
              );
            }}
            disabled={isSaving}
            className="w-full py-2 text-muted-foreground text-sm"
          >
            Skip
          </button>
        </div>
      </div>
    );
  }

  return null;
}
