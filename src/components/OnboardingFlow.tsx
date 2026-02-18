import { useState } from "react";
import { ChevronRight, Check } from "lucide-react";
import onboardingHero from "@/assets/onboarding-hero.jpg";
import { INTERESTS } from "@/data/mockData";

type Step = "language" | "welcome1" | "welcome2" | "welcome3" | "interests" | "profile";

interface OnboardingProps {
  onComplete: () => void;
}

const welcomeScreens = [
  {
    title: "Discover curated\nexperiences",
    subtitle: "Handpicked events designed for depth — not scale. Every gathering, carefully chosen.",
    emoji: "✦",
  },
  {
    title: "Meet women through\nshared interests",
    subtitle: "Connection built on what you love, not algorithms. Show up. Be seen.",
    emoji: "◯",
  },
  {
    title: "Belong to a circle\nover time",
    subtitle: "From one event to a small community. Real belonging comes from showing up again.",
    emoji: "◈",
  },
];

export function OnboardingFlow({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<Step>("language");
  const [language, setLanguage] = useState<"en" | "es">("en");
  const [welcomeIndex, setWelcomeIndex] = useState(0);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [profile, setProfile] = useState({ name: "", city: "", bio: "" });

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  if (step === "language") {
    return (
      <div className="mobile-container flex flex-col bg-background">
        {/* Top image */}
        <div className="relative h-64 overflow-hidden">
          <img src={onboardingHero} alt="Nomaya" className="w-full h-full object-cover object-top" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        </div>

        <div className="flex-1 flex flex-col px-6 pt-2 pb-10">
          <div className="text-center mb-8">
            <h1 className="font-serif text-4xl font-medium text-foreground leading-tight mb-1">
              Nomaya
            </h1>
            <p className="text-sm text-muted-foreground tracking-widest uppercase">
              women · circles · belonging
            </p>
          </div>

          <p className="text-sm text-muted-foreground text-center mb-6">
            Choose your language
          </p>

          <div className="space-y-3">
            {[
              { code: "en" as const, label: "English", flag: "🇬🇧" },
              { code: "es" as const, label: "Español", flag: "🇪🇸" },
            ].map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-all duration-200 ${
                  language === lang.code
                    ? "border-primary bg-secondary"
                    : "border-border bg-card"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="font-medium text-foreground">{lang.label}</span>
                </div>
                {language === lang.code && (
                  <Check size={18} className="text-primary" />
                )}
              </button>
            ))}
          </div>

          <button
            onClick={() => setStep("welcome1")}
            className="mt-auto w-full py-4 rounded-2xl gradient-cta text-primary-foreground font-medium text-base shadow-soft transition-all duration-200 active:scale-[0.98]"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  if (step === "welcome1" || step === "welcome2" || step === "welcome3") {
    const screen = welcomeScreens[welcomeIndex];
    const stepMap: Step[] = ["welcome1", "welcome2", "welcome3"];
    const isLast = welcomeIndex === 2;

    return (
      <div className="mobile-container flex flex-col bg-background">
        <div className="relative flex-1 overflow-hidden">
          <img src={onboardingHero} alt="background" className="absolute inset-0 w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />

          <div className="relative z-10 flex flex-col h-full px-6 pt-16 pb-10">
            {/* Progress dots */}
            <div className="flex gap-2 justify-center mb-auto">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === welcomeIndex ? "w-6 bg-primary" : "w-2 bg-border"
                  }`}
                />
              ))}
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <div className="text-6xl mb-6 text-center text-primary opacity-40 font-serif">
                {screen.emoji}
              </div>
              <h2 className="font-serif text-3xl font-medium text-foreground leading-tight mb-4 whitespace-pre-line">
                {screen.title}
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                {screen.subtitle}
              </p>
            </div>

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
                className="w-full py-4 rounded-2xl gradient-cta text-primary-foreground font-medium text-base shadow-soft transition-all duration-200 active:scale-[0.98]"
              >
                {isLast ? "Choose your interests" : "Continue"}
                {!isLast && <ChevronRight size={18} className="inline ml-1" />}
              </button>
              {welcomeIndex > 0 && (
                <button
                  onClick={() => {
                    setWelcomeIndex((i) => i - 1);
                    setStep(stepMap[welcomeIndex - 1]);
                  }}
                  className="w-full py-3 text-muted-foreground text-sm"
                >
                  Back
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === "interests") {
    return (
      <div className="mobile-container flex flex-col bg-background px-6 pt-14 pb-10">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Step 1 of 2</p>
          <h2 className="font-serif text-3xl font-medium text-foreground leading-tight">
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
                className={`px-4 py-2.5 rounded-full border text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  isSelected
                    ? "border-primary bg-secondary text-foreground"
                    : "border-border bg-card text-muted-foreground"
                }`}
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
            className={`w-full py-4 rounded-2xl font-medium text-base transition-all duration-200 active:scale-[0.98] ${
              selectedInterests.length >= 2
                ? "gradient-cta text-primary-foreground shadow-soft"
                : "bg-muted text-muted-foreground"
            }`}
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

  if (step === "profile") {
    return (
      <div className="mobile-container flex flex-col bg-background px-6 pt-14 pb-10">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Step 2 of 2</p>
          <h2 className="font-serif text-3xl font-medium text-foreground leading-tight">
            Tell us about you
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            A simple profile so your circle knows who's coming.
          </p>
        </div>

        {/* Avatar placeholder */}
        <div className="flex justify-center mb-6">
          <button className="w-24 h-24 rounded-full bg-secondary border-2 border-dashed border-border flex items-center justify-center text-3xl transition-all duration-200 active:scale-95">
            📸
          </button>
        </div>

        <div className="space-y-4 flex-1">
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5 block">
              Your name
            </label>
            <input
              type="text"
              placeholder="Sofia"
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              className="w-full px-4 py-3.5 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5 block">
              City
            </label>
            <input
              type="text"
              placeholder="Barcelona"
              value={profile.city}
              onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))}
              className="w-full px-4 py-3.5 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5 block">
              Short bio <span className="text-muted-foreground normal-case">(optional)</span>
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
          <button
            onClick={onComplete}
            className="w-full py-4 rounded-2xl gradient-cta text-primary-foreground font-medium text-base shadow-soft transition-all duration-200 active:scale-[0.98]"
          >
            Enter Nomaya ✦
          </button>
          <button onClick={onComplete} className="w-full py-2 text-muted-foreground text-sm">
            Skip
          </button>
        </div>
      </div>
    );
  }

  return null;
}
