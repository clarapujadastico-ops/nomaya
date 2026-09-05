import { useState } from "react";
import { Sparkles, Check } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useCircleInterestSignups, useSignalCircleInterest } from "@/hooks/useCircleInterest";

const EVENTS_BUCKET = "https://jtoftrghfwdffrkqejlq.supabase.co/storage/v1/object/public/Events";

// Illustrative-only previews of what circles could look like — never real
// data. Names and taglines stay the same in both languages, like brand
// copy, matching the English-only pattern already used for event
// title/description internals elsewhere in the app.
const PREVIEW_CIRCLES = [
  { name: "Running Club", tagline: "For girls who love a good run — and even better company.", image: `${EVENTS_BUCKET}/circle-running-club.jpg` },
  { name: "Book Club", tagline: "For book lovers looking for their next read and someone to talk about it with.", image: `${EVENTS_BUCKET}/circle-book-club.jpg` },
  { name: "Creative Girls", tagline: "A space to create, share ideas and find inspiration together.", image: `${EVENTS_BUCKET}/circle-creative-girls.jpg` },
  { name: "Art Lovers", tagline: "For gallery dates, exhibitions and girls who can never get enough art.", image: `${EVENTS_BUCKET}/circle-art-lovers.jpg` },
  { name: "Wander Club", tagline: "For girls who are always dreaming about — or planning — their next trip.", image: `${EVENTS_BUCKET}/circle-wander-club.jpg` },
  { name: "Digital Nomads", tagline: "For girls working from anywhere and looking for community along the way.", image: `${EVENTS_BUCKET}/circle-digital-nomads.jpg` },
  { name: "New Mums", tagline: "A space to connect with other mums navigating this new chapter together.", image: `${EVENTS_BUCKET}/circle-new-mums.jpg` },
  { name: "Yoga Girls", tagline: "For girls who love yoga, from first flows to everyday yogis.", image: `${EVENTS_BUCKET}/circle-yoga-girls.jpg` },
  { name: "Foodies", tagline: "For girls who are always saving restaurants and planning where to eat next.", image: `${EVENTS_BUCKET}/circle-foodies.jpg` },
];

// canonical (language-independent) names stored in circle_interest, so an
// admin sees the same value regardless of which language the tag was tapped in
const INTEREST_TAGS = [
  { key: "circles.tag_running", canonical: "Running" },
  { key: "circles.tag_books", canonical: "Books" },
  { key: "circles.tag_yoga", canonical: "Yoga" },
  { key: "circles.tag_art", canonical: "Art" },
  { key: "circles.tag_travel", canonical: "Travel" },
  { key: "circles.tag_foodies", canonical: "Foodies" },
];

export function CirclesComingSoon() {
  const { t } = useLang();
  const { data: profile } = useProfile();
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const { data: interestedCircles = [] } = useCircleInterestSignups();
  const { mutate: signalCircleInterest, isPending: isSignalling } = useSignalCircleInterest();
  const [error, setError] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const alreadyInterested = profile?.circle_launch_interest ?? false;

  function toggleTag(tag: string) {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  function handleNotifyMe() {
    setError(null);
    updateProfile(
      { circle_launch_interest: true },
      { onError: (e) => setError(e.message) }
    );
    selectedTags.forEach((tag) => {
      if (!interestedCircles.includes(tag)) signalCircleInterest(tag);
    });
  }

  function handleCircleInterest(circleName: string) {
    setError(null);
    signalCircleInterest(circleName, { onError: (e) => setError(e.message) });
  }

  return (
    <div className="px-5 pb-6">
      {/* Badge */}
      <div className="flex justify-center mb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold tracking-widest bg-nomaya-gold/20 text-nomaya-gold">
          <Sparkles size={11} />
          {t("circles.coming_soon_badge")}
        </span>
      </div>

      {/* Hero */}
      <div className="text-center mb-5">
        <h2 className="font-serif text-2xl font-medium text-foreground mb-2" style={{ letterSpacing: "-0.02em" }}>
          {t("circles.find_title")}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
          {t("circles.find_body")}
        </p>
      </div>

      {/* Interest tags — selectable, feed into circle_interest alongside the general "notify me" signal */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {INTEREST_TAGS.map(({ key, canonical }) => {
          const isSelected = selectedTags.includes(canonical) || interestedCircles.includes(canonical);
          return (
            <button
              key={key}
              type="button"
              onClick={() => !alreadyInterested && toggleTag(canonical)}
              disabled={alreadyInterested}
              className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 active:scale-95 disabled:active:scale-100"
              style={{
                borderColor: isSelected ? "hsl(var(--nomaya-purple))" : "hsl(var(--border))",
                background: isSelected ? "hsl(var(--nomaya-purple) / 0.15)" : "hsl(var(--card))",
              }}
            >
              {t(key)}
            </button>
          );
        })}
      </div>

      {/* Preview cards — clearly illustrative, not real circles. Tapping one
          registers interest in that specific circle (circle_interest table),
          so whoever gets notified when it launches is targeted, not just
          "someone tapped something". */}
      <div className="space-y-2.5 mb-6">
        {PREVIEW_CIRCLES.map((c) => {
          const isInterested = interestedCircles.includes(c.name);
          return (
            <button
              key={c.name}
              onClick={() => !isInterested && handleCircleInterest(c.name)}
              disabled={isSignalling || isInterested}
              className="w-full flex items-center gap-3 bg-card rounded-2xl p-3.5 border border-dashed border-border text-left transition-transform active:scale-[0.98] disabled:opacity-100"
            >
              <img
                src={c.image}
                alt={c.name}
                className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                <p className="text-xs text-muted-foreground leading-snug line-clamp-2">{c.tagline}</p>
              </div>
              {isInterested ? (
                <span className="flex items-center gap-1 text-[9px] font-semibold tracking-wide uppercase text-nomaya-rose flex-shrink-0 self-start mt-0.5">
                  <Check size={11} />
                  {t("circles.interested")}
                </span>
              ) : (
                <span className="text-[9px] font-semibold tracking-wide uppercase text-nomaya-gold flex-shrink-0 self-start mt-0.5">
                  {t("circles.coming_soon_badge")}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notify me */}
      {alreadyInterested ? (
        <div className="flex items-center justify-center gap-2 py-4 text-sm font-medium text-foreground">
          <Check size={16} className="text-nomaya-rose" />
          {t("circles.notify_success")}
        </div>
      ) : (
        <>
          <button
            onClick={handleNotifyMe}
            disabled={isPending}
            className="w-full py-4 rounded-2xl font-medium text-sm tracking-wide transition-all duration-200 active:scale-[0.98] gradient-cta text-white disabled:opacity-60"
          >
            {isPending ? "…" : t("circles.notify_cta")}
          </button>
          {error && <p className="text-xs text-destructive text-center mt-2">{error}</p>}
        </>
      )}
    </div>
  );
}
