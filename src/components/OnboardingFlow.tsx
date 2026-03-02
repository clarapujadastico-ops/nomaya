import { useState, useRef } from "react";
import { ChevronRight, Check, Instagram, Linkedin, Music2 } from "lucide-react";
import { INTERESTS } from "@/data/mockData";
import { useUpdateProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { VerificationFlow } from "./VerificationFlow";
import { useLang } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";

type Step = "language" | "welcome1" | "welcome2" | "welcome3" | "interests" | "about_you" | "profile" | "verify";

interface OnboardingProps {
  onComplete: () => void;
}

/* ─── Full-screen video background ─── */
function VideoBackground() {
  return (
    <video
      autoPlay
      muted
      loop
      playsInline
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
    >
      <source src="/videos/nomaya-hero.mov" type="video/mp4" />
    </video>
  );
}

/* ─── Full-screen wrapper for video slides (bypasses mobile-container max-w) ─── */
function FullScreen({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {children}
    </div>
  );
}

export function OnboardingFlow({ onComplete }: OnboardingProps) {
  const { t, setLang: setCtxLang } = useLang();
  const { user, signOut } = useAuth();
  const [step, setStep] = useState<Step>("language");
  const [language, setLanguage] = useState<"en" | "es">("en");

  const welcomeScreens = [
    { title: t("onboarding.w1_title"), subtitle: t("onboarding.w1_sub") },
    { title: t("onboarding.w2_title"), subtitle: t("onboarding.w2_sub") },
    { title: t("onboarding.w3_title"), subtitle: t("onboarding.w3_sub") },
  ];
  const [welcomeIndex, setWelcomeIndex] = useState(0);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [ageRange, setAgeRange] = useState<string | null>(null);
  const [lifeStage, setLifeStage] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    name: "", city: "", bio: "",
    instagram_url: "", linkedin_url: "", tiktok_url: "",
    favourite_song: "", favourite_food: "",
  });
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { mutate: updateProfile, isPending: isSaving } = useUpdateProfile();

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarDataUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function uploadAvatarAndSave() {
    setSaveError(null);
    setIsUploadingAvatar(true);

    let avatar_url: string | null = null;

    if (avatarDataUrl && user) {
      try {
        const base64 = avatarDataUrl.split(",")[1];
        const chars = atob(base64);
        const bytes = new Uint8Array(chars.length);
        for (let i = 0; i < chars.length; i++) bytes[i] = chars.charCodeAt(i);
        const blob = new Blob([bytes], { type: "image/jpeg" });
        const path = `avatars/${user.id}.jpg`;
        const { error } = await supabase.storage.from("Events").upload(path, blob, { upsert: true, contentType: "image/jpeg" });
        if (!error) {
          avatar_url = supabase.storage.from("Events").getPublicUrl(path).data.publicUrl;
        }
      } catch {
        // avatar upload failure is non-blocking
      }
    }

    setIsUploadingAvatar(false);

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
        age_range: ageRange,
        life_stage: lifeStage,
        ...(avatar_url ? { avatar_url } : {}),
      },
      {
        onSuccess: () => setStep("verify"),
        onError: (err) => {
          const msg = (err as Error).message ?? "";
          if (msg.includes("foreign key") || msg.includes("fkey")) {
            signOut(); // stale session after account deletion — force fresh login
          } else {
            setSaveError(msg);
          }
        },
      }
    );
  }

  /* ── LANGUAGE / LANDING ── */
  if (step === "language") {
    return (
      <FullScreen>
        <VideoBackground />
        {/* Dark overlay */}
        <div style={{ position: "absolute", inset: 0, background: "rgba(28, 18, 55, 0.52)" }} />

        <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", flex: 1, padding: "0 1.5rem", paddingTop: "max(env(safe-area-inset-top), 3.5rem)" }}>
          {/* Nomaya — top left */}
          <span className="font-serif text-white text-xl font-normal tracking-wide">Nomaya</span>

          {/* Centered tagline */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
            <p className="text-white font-light mb-3" style={{ fontSize: "1.35rem", letterSpacing: "0.28em" }}>
              MOVE · CONNECT · BELONG
            </p>
            <p className="text-white/75 text-xs" style={{ letterSpacing: "0.22em" }}>
              WOMEN-ONLY COMMUNITY
            </p>
          </div>

          {/* Bottom card — opaque purple/lavender */}
          <div
            className="rounded-3xl p-6 mb-8 mt-4"
            style={{
              background: "hsl(252 75% 96% / 0.94)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid hsl(252 30% 45% / 0.15)",
            }}
          >
            <p className="text-xs tracking-widest uppercase text-center mb-5" style={{ color: "hsl(252 30% 55%)" }}>
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
                    borderColor: language === lang.code ? "hsl(252 30% 45%)" : "hsl(252 30% 45% / 0.20)",
                    background: language === lang.code ? "hsl(252 30% 45% / 0.10)" : "hsl(0 0% 100% / 0.60)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{lang.flag}</span>
                    <span className="font-medium text-sm" style={{ color: "hsl(252 30% 30%)" }}>{lang.label}</span>
                  </div>
                  {language === lang.code && <Check size={15} style={{ color: "hsl(252 30% 45%)" }} />}
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
      </FullScreen>
    );
  }

  /* ── WELCOME SLIDES — full-screen video ── */
  if (step === "welcome1" || step === "welcome2" || step === "welcome3") {
    const screen = welcomeScreens[welcomeIndex];
    const stepMap: Step[] = ["welcome1", "welcome2", "welcome3"];
    const isLast = welcomeIndex === 2;

    return (
      <FullScreen>
        <VideoBackground />
        <div style={{ position: "absolute", inset: 0, background: "rgba(28, 18, 55, 0.65)" }} />

        <div
          style={{
            position: "relative", zIndex: 10, display: "flex", flexDirection: "column", flex: 1,
            padding: "0 1.5rem", paddingTop: "3.5rem",
            paddingBottom: "max(env(safe-area-inset-bottom), 2.5rem)",
          }}
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

          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", paddingBottom: "1.5rem" }}>
            <div
              className="inline-block px-3 py-1 rounded-full text-[10px] tracking-widest uppercase mb-5 self-start"
              style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.2)" }}
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
      </FullScreen>
    );
  }

  /* ── INTERESTS ── */
  if (step === "interests") {
    return (
      <div className="mobile-container flex flex-col bg-background" style={{ minHeight: "100dvh" }}>
        <div className="px-6 pt-14 pb-4 flex-shrink-0">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{t("onboarding.step1")}</p>
          <h2 className="font-serif font-normal text-foreground leading-tight" style={{ fontSize: "2rem", letterSpacing: "-0.042em" }}>
            {t("onboarding.what_love")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{t("onboarding.select_all")}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          {INTERESTS.map((interest) => {
            const isSelected = selectedInterests.includes(interest.id);
            return (
              <button
                key={interest.id}
                onClick={() => {
                  setSelectedInterests((prev) =>
                    prev.includes(interest.id) ? prev.filter((i) => i !== interest.id) : [...prev, interest.id]
                  );
                }}
                className="w-full flex items-center justify-between py-4 border-b border-border/50 text-left transition-all active:opacity-60"
              >
                <span
                  className="font-serif transition-all duration-200"
                  style={{
                    fontSize: "1.15rem", letterSpacing: "-0.01em",
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

        <div className="px-6 space-y-3 flex-shrink-0 border-t border-border/40" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 2rem)", paddingTop: "1rem" }}>
          <button
            onClick={() => setStep("about_you")}
            disabled={selectedInterests.length < 2}
            className="w-full py-4 rounded-2xl font-medium text-sm transition-all duration-200 active:scale-[0.98] gradient-cta text-white disabled:opacity-40"
          >
            {selectedInterests.length >= 2
              ? `${t("onboarding.continue")} · ${selectedInterests.length} selected`
              : t("onboarding.select_min2")}
          </button>
          <button onClick={() => setStep("about_you")} className="w-full py-2 text-muted-foreground text-sm">
            {t("onboarding.skip")}
          </button>
        </div>
      </div>
    );
  }

  /* ── ABOUT YOU ── */
  if (step === "about_you") {
    const AGE_RANGES = ["18–25", "26–35", "36–45", "46+"];
    const LIFE_STAGES = [
      { id: "student",              label: "Student",               emoji: "🎓" },
      { id: "working_professional", label: "Working professional",  emoji: "💼" },
      { id: "founder",              label: "Founder / entrepreneur", emoji: "🚀" },
      { id: "freelancer",           label: "Freelancer / creative",  emoji: "✨" },
      { id: "new_in_city",          label: "New in the city",        emoji: "📍" },
      { id: "parent",               label: "Parent",                 emoji: "🌸" },
    ];

    return (
      <div className="mobile-container flex flex-col bg-background" style={{ minHeight: "100dvh" }}>
        <div className="px-6 pt-14 pb-4 flex-shrink-0">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Step 2 of 3</p>
          <h2 className="font-serif font-normal text-foreground leading-tight" style={{ fontSize: "2rem", letterSpacing: "-0.042em" }}>
            A bit about you
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Helps us suggest the right events. Never shown publicly.</p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 space-y-6 pb-4">
          {/* Age range */}
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Your age range</p>
            <div className="grid grid-cols-4 gap-2">
              {AGE_RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => setAgeRange(r)}
                  className="py-3 rounded-2xl text-sm font-medium border-2 transition-all"
                  style={{
                    borderColor: ageRange === r ? "hsl(var(--primary-foreground))" : "hsl(var(--border))",
                    background: ageRange === r ? "hsl(var(--primary-foreground) / 0.12)" : "hsl(var(--card))",
                    color: ageRange === r ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Life stage */}
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Your life stage</p>
            <div className="space-y-2">
              {LIFE_STAGES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setLifeStage(s.id)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 text-left transition-all"
                  style={{
                    borderColor: lifeStage === s.id ? "hsl(var(--primary-foreground))" : "hsl(var(--border))",
                    background: lifeStage === s.id ? "hsl(var(--primary-foreground) / 0.12)" : "hsl(var(--card))",
                  }}
                >
                  <span className="text-xl">{s.emoji}</span>
                  <span
                    className="text-sm font-medium"
                    style={{ color: lifeStage === s.id ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
                  >
                    {s.label}
                  </span>
                  {lifeStage === s.id && (
                    <div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "hsl(var(--primary-foreground))" }}>
                      <Check size={11} className="text-primary" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 space-y-3 flex-shrink-0 border-t border-border/40" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 2rem)", paddingTop: "1rem" }}>
          <button
            onClick={() => setStep("profile")}
            className="w-full py-4 rounded-2xl font-medium text-sm transition-all duration-200 active:scale-[0.98] gradient-cta text-white"
          >
            {t("onboarding.continue")}
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
    const isBusy = isSaving || isUploadingAvatar;
    return (
      <div className="mobile-container bg-background" style={{ minHeight: "100dvh", overflowY: "auto" }}>
        {/* Hidden file input for photo */}
        <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />

        {/* Header */}
        <div className="px-6 pt-14 pb-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{t("onboarding.step2")}</p>
          <h2 className="font-serif font-normal text-foreground leading-tight" style={{ fontSize: "2rem", letterSpacing: "-0.042em" }}>
            {t("onboarding.tell_us")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{t("onboarding.simple_profile")}</p>
        </div>

        {/* All form fields — scrolls naturally */}
        <div className="px-6 space-y-4">
          {/* Photo */}
          <div className="flex justify-center py-2">
            <button
              onClick={() => photoInputRef.current?.click()}
              className="relative w-24 h-24 rounded-full bg-secondary border-2 border-dashed border-border flex items-center justify-center overflow-hidden transition-all duration-200 active:scale-95"
            >
              {avatarDataUrl ? (
                <img src={avatarDataUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl">📸</span>
              )}
            </button>
          </div>

          {/* Name & City */}
          {[
            { key: "name", label: "Full name (first & last)", placeholder: "Sofia García" },
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

          {/* Bio */}
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

        {/* Continue button — part of normal scroll flow, always reachable */}
        <div
          className="px-6 space-y-3 border-t border-border/40 mt-6"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 3rem)", paddingTop: "1rem" }}
        >
          {saveError && <p className="text-xs text-destructive px-1">{saveError}</p>}
          <button
            onClick={uploadAvatarAndSave}
            disabled={isBusy || !profile.name}
            className="w-full py-4 rounded-2xl font-medium text-sm tracking-wide transition-all duration-200 active:scale-[0.98] disabled:opacity-60"
            style={{
              background: "hsl(var(--nomaya-purple))",
              color: "hsl(252 75% 97%)",
              boxShadow: "0 4px 32px hsl(252 30% 45% / 0.4)",
            }}
          >
            {isBusy ? t("onboarding.saving") : t("onboarding.continue")}
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
