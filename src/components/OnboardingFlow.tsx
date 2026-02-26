import { useState } from "react";
import { ChevronRight, Check, Instagram, Linkedin, Music2 } from "lucide-react";
import { INTERESTS } from "@/data/mockData";
import { useUpdateProfile } from "@/hooks/useProfile";
import { VerificationFlow } from "./VerificationFlow";
import { useLang } from "@/contexts/LanguageContext";

type Step = "language" | "welcome1" | "welcome2" | "welcome3" | "interests" | "profile" | "verify";

interface OnboardingProps {
  onComplete: () => void;
}

/* ─── Video background ─── */
function VideoBackground() {
  return (
    <video
      autoPlay
      muted
      loop
      playsInline
      className="absolute inset-0 w-full h-full object-cover"
    >
      <source src="/videos/nomaya-hero.mov" type="video/mp4" />
    </video>
  );
}

export function OnboardingFlow({ onComplete }: OnboardingProps) {
  const { t, setLang: setCtxLang } = useLang();
  const [step, setStep] = useState<Step>("language");
  const [language, setLanguage] = useState<"en" | "es">("en");

  const welcomeScreens = [
    { title: t("onboarding.w1_title"), subtitle: t("onboarding.w1_sub") },
    { title: t("onboarding.w2_title"), subtitle: t("onboarding.w2_sub") },
    { title: t("onboarding.w3_title"), subtitle: t("onboarding.w3_sub") },
  ];
  const [welcomeIndex, setWelcomeIndex] = useState(0);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [profile, setProfile] = useState({
    name: "", city: "", bio: "",
    instagram_url: "", linkedin_url: "", tiktok_url: "",
    favourite_song: "", favourite_food: "",
  });
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
        <VideoBackground />
        {/* Dark overlay */}
        <div className="absolute inset-0" style={{ background: "rgba(28, 18, 55, 0.52)" }} />

        <div className="relative z-10 flex flex-col flex-1 px-6" style={{ paddingTop: "max(env(safe-area-inset-top), 3.5rem)" }}>
          {/* Nomaya — top left */}
          <span className="font-serif text-white text-xl font-normal tracking-wide">Nomaya</span>

          {/* Centered tagline */}
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <p className="text-white font-light mb-3" style={{ fontSize: "1.35rem", letterSpacing: "0.28em" }}>
              MOVE · CONNECT · BELONG
            </p>
            <p className="text-white/75 text-xs" style={{ letterSpacing: "0.22em" }}>
              WOMEN-ONLY COMMUNITY
            </p>
          </div>

          {/* Bottom card */}
          <div
            className="rounded-3xl p-6 mb-8 mt-4"
            style={{
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.18)",
            }}
          >
            <p className="text-xs tracking-widest uppercase text-center mb-5 text-white/70">
              {t("onboarding.choose_lang")}
            </p>

            <div className="space-y-2.5 mb-6">
              {[
                { code: "en" as const, label: "English", flag: "🇬🇧" },
                { code: "es" as const, label: "Español", flag: "🇪🇸" },
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => { setLanguage(lang.code); setCtxLang(lang.code); }}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border transition-all duration-200"
                  style={{
                    borderColor: language === lang.code ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)",
                    background: language === lang.code ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.07)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{lang.flag}</span>
                    <span className="font-medium text-sm text-white">{lang.label}</span>
                  </div>
                  {language === lang.code && <Check size={15} className="text-white" />}
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep("welcome1")}
              className="w-full py-4 rounded-2xl gradient-cta text-white font-medium text-sm tracking-wide transition-all duration-200 active:scale-[0.98]"
            >
              {t("onboarding.enter")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── WELCOME SLIDES — video background ── */
  if (step === "welcome1" || step === "welcome2" || step === "welcome3") {
    const screen = welcomeScreens[welcomeIndex];
    const stepMap: Step[] = ["welcome1", "welcome2", "welcome3"];
    const isLast = welcomeIndex === 2;

    return (
      <div className="mobile-container flex flex-col relative overflow-hidden" style={{ minHeight: "100dvh" }}>
        <VideoBackground />
        <div className="absolute inset-0" style={{ background: "rgba(28, 18, 55, 0.65)" }} />

        <div
          className="relative z-10 flex flex-col flex-1 px-6 pt-14"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 2.5rem)" }}
        >
          {/* Progress dots */}
          <div className="flex gap-1.5 mb-auto">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-0.5 rounded-full transition-all duration-500"
                style={{
                  width: i === welcomeIndex ? "2rem" : "0.5rem",
                  background: i === welcomeIndex ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.25)",
                }}
              />
            ))}
          </div>

          <div className="flex-1 flex flex-col justify-end pb-6">
            <div
              className="inline-block px-3 py-1 rounded-full text-[10px] tracking-widest uppercase mb-5 self-start"
              style={{
                background: "rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.75)",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              {welcomeIndex + 1} of 3
            </div>

            <h2
              className="font-serif font-normal text-white leading-tight mb-4 whitespace-pre-line"
              style={{ fontSize: "clamp(2rem, 9vw, 2.75rem)", letterSpacing: "-0.03em" }}
            >
              {screen.title}
            </h2>
            <p className="text-sm leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.65)" }}>
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
                className="w-full py-4 rounded-2xl gradient-cta text-white font-medium text-sm tracking-wide transition-all duration-200 active:scale-[0.98]"
              >
                {isLast ? t("onboarding.choose_interests") : t("onboarding.continue")}
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
                className="w-full py-3 text-sm"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                {t("onboarding.back")}
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
      <div className="mobile-container flex flex-col bg-background" style={{ minHeight: "100dvh" }}>
        <div className="px-6 pt-14 pb-4 flex-shrink-0">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{t("onboarding.step1")}</p>
          <h2
            className="font-serif font-normal text-foreground leading-tight"
            style={{ fontSize: "2rem", letterSpacing: "-0.042em" }}
          >
            {t("onboarding.what_love")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{t("onboarding.select_all")}</p>
        </div>

        {/* Editorial list */}
        <div className="flex-1 overflow-y-auto px-6">
          {INTERESTS.map((interest) => {
            const isSelected = selectedInterests.includes(interest.id);
            return (
              <button
                key={interest.id}
                onClick={() => toggleInterest(interest.id)}
                className="w-full flex items-center justify-between py-4 border-b border-border/50 text-left transition-all active:opacity-60"
              >
                <span
                  className="font-serif transition-all duration-200"
                  style={{
                    fontSize: "1.15rem",
                    letterSpacing: "-0.01em",
                    color: isSelected ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                    fontWeight: isSelected ? 500 : 400,
                  }}
                >
                  {interest.label}
                </span>
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-4 transition-all duration-200"
                  style={{
                    borderColor: isSelected ? "hsl(var(--primary-foreground))" : "hsl(var(--border))",
                    background: isSelected ? "hsl(var(--primary-foreground))" : "transparent",
                  }}
                >
                  {isSelected && <Check size={10} className="text-primary" />}
                </div>
              </button>
            );
          })}
          <div className="h-4" />
        </div>

        <div
          className="px-6 space-y-3 flex-shrink-0 border-t border-border/40"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 2rem)", paddingTop: "1rem" }}
        >
          <button
            onClick={() => setStep("profile")}
            disabled={selectedInterests.length < 2}
            className="w-full py-4 rounded-2xl font-medium text-sm transition-all duration-200 active:scale-[0.98] gradient-cta text-white disabled:opacity-40"
          >
            {selectedInterests.length >= 2
              ? `${t("onboarding.continue")} · ${selectedInterests.length} selected`
              : t("onboarding.select_min2")}
          </button>
          <button onClick={() => setStep("profile")} className="w-full py-2 text-muted-foreground text-sm">
            {t("onboarding.skip")}
          </button>
        </div>
      </div>
    );
  }

  /* ── PROFILE ── */
  if (step === "profile") {
    return (
      <div className="mobile-container flex flex-col bg-background" style={{ minHeight: "100dvh" }}>
        <div className="px-6 pt-14 pb-4 flex-shrink-0">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{t("onboarding.step2")}</p>
          <h2
            className="font-serif font-normal text-foreground leading-tight"
            style={{ fontSize: "2rem", letterSpacing: "-0.042em" }}
          >
            {t("onboarding.tell_us")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{t("onboarding.simple_profile")}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-4">
          {/* Photo placeholder */}
          <div className="flex justify-center py-2">
            <button className="w-24 h-24 rounded-full bg-secondary border-2 border-dashed border-border flex items-center justify-center text-3xl transition-all duration-200 active:scale-95">
              📸
            </button>
          </div>

          {/* Name & City */}
          {[
            { key: "name", label: t("onboarding.your_name"), placeholder: "Sofia" },
            { key: "city", label: t("onboarding.city"), placeholder: "Madrid" },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5 block">{label}</label>
              <input
                type="text"
                placeholder={placeholder}
                value={profile[key as keyof typeof profile]}
                onChange={(e) => setProfile((p) => ({ ...p, [key]: e.target.value }))}
                className="w-full px-4 py-3.5 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 transition"
              />
            </div>
          ))}

          {/* Bio — required */}
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5 block">
              {t("onboarding.short_bio")}
            </label>
            <textarea
              placeholder="Designer. Ceramics enthusiast. Dog mum."
              value={profile.bio}
              onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3.5 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 transition resize-none"
            />
          </div>

          {/* Social media */}
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">Social media</label>
            <div className="space-y-2">
              {[
                { key: "instagram_url", icon: Instagram, placeholder: "instagram.com/yourhandle" },
                { key: "linkedin_url", icon: Linkedin, placeholder: "linkedin.com/in/yourname" },
                { key: "tiktok_url", icon: Music2, placeholder: "tiktok.com/@yourhandle" },
              ].map(({ key, icon: Icon, placeholder }) => (
                <div key={key} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-input bg-card">
                  <Icon size={15} className="text-muted-foreground flex-shrink-0" />
                  <input
                    type="text"
                    placeholder={placeholder}
                    value={profile[key as keyof typeof profile]}
                    onChange={(e) => setProfile((p) => ({ ...p, [key]: e.target.value }))}
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Favourites */}
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">A little more about you</label>
            <div className="space-y-2">
              {[
                { key: "favourite_song", placeholder: "Favourite song right now…", prefix: "🎵" },
                { key: "favourite_food", placeholder: "Favourite food or restaurant…", prefix: "🍽️" },
              ].map(({ key, placeholder, prefix }) => (
                <div key={key} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-input bg-card">
                  <span className="text-base flex-shrink-0">{prefix}</span>
                  <input
                    type="text"
                    placeholder={placeholder}
                    value={profile[key as keyof typeof profile]}
                    onChange={(e) => setProfile((p) => ({ ...p, [key]: e.target.value }))}
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          className="px-6 space-y-3 flex-shrink-0 border-t border-border/40"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 2rem)", paddingTop: "1rem" }}
        >
          {saveError && <p className="text-xs text-destructive px-1">{saveError}</p>}
          <button
            onClick={() => {
              setSaveError(null);
              updateProfile(
                {
                  name: profile.name || "Member",
                  city: profile.city || "",
                  bio: profile.bio || null,
                  language,
                  interests: selectedInterests,
                  instagram_url: profile.instagram_url || null,
                  linkedin_url: profile.linkedin_url || null,
                  tiktok_url: profile.tiktok_url || null,
                  favourite_song: profile.favourite_song || null,
                  favourite_food: profile.favourite_food || null,
                },
                {
                  onSuccess: () => setStep("verify"),
                  onError: (err) => setSaveError((err as Error).message),
                }
              );
            }}
            disabled={isSaving || !profile.name}
            className="w-full py-4 rounded-2xl font-medium text-sm tracking-wide transition-all duration-200 active:scale-[0.98] disabled:opacity-60"
            style={{
              background: "hsl(var(--nomaya-purple))",
              color: "hsl(252 75% 97%)",
              boxShadow: "0 4px 32px hsl(252 30% 45% / 0.4)",
            }}
          >
            {isSaving ? t("onboarding.saving") : t("onboarding.continue")}
          </button>
        </div>
      </div>
    );
  }

  /* ── VERIFY ── */
  if (step === "verify") {
    return <VerificationFlow onComplete={onComplete} onSkip={onComplete} />;
  }

  return null;
}
