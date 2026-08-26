import { useState } from "react";
import { Sparkles, Check } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";

const EVENTS_BUCKET = "https://jtoftrghfwdffrkqejlq.supabase.co/storage/v1/object/public/Events";

// Illustrative-only previews of what circles could look like — never real
// data. Names stay the same in both languages, like brand names. Reusing
// real photos already uploaded for the matching September events, rather
// than sourcing new stock images.
const PREVIEW_CIRCLES = [
  { name: "Running Girls", image: `${EVENTS_BUCKET}/running-club.jpg` },
  { name: "Book Lovers", image: `${EVENTS_BUCKET}/book-club-gelato.jpg` },
  { name: "Creative Girls", image: `${EVENTS_BUCKET}/ceramics.JPG` },
];

const TAG_KEYS = ["circles.tag_running", "circles.tag_books", "circles.tag_yoga", "circles.tag_art", "circles.tag_travel", "circles.tag_foodies"];

export function CirclesComingSoon() {
  const { t } = useLang();
  const { data: profile } = useProfile();
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const [error, setError] = useState<string | null>(null);
  const alreadyInterested = profile?.circle_launch_interest ?? false;

  function handleNotifyMe() {
    setError(null);
    updateProfile(
      { circle_launch_interest: true },
      { onError: (e) => setError(e.message) }
    );
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

      {/* Interest tags */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {TAG_KEYS.map((key) => (
          <span key={key} className="px-3 py-1.5 rounded-full text-xs font-medium bg-card text-foreground border border-border">
            {t(key)}
          </span>
        ))}
      </div>

      {/* Preview cards — clearly illustrative, not real circles. Tapping one
          leads to the same notify-me action, since there's nothing else to
          open yet — better than doing nothing when tapped. */}
      <div className="space-y-2.5 mb-6">
        {PREVIEW_CIRCLES.map((c) => (
          <button
            key={c.name}
            onClick={handleNotifyMe}
            disabled={isPending || alreadyInterested}
            className="w-full flex items-center gap-3 bg-card rounded-2xl p-3.5 border border-dashed border-border text-left transition-transform active:scale-[0.98] disabled:opacity-70"
          >
            <img
              src={c.image}
              alt={c.name}
              className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
              <p className="text-xs text-muted-foreground">Madrid</p>
            </div>
            <span className="text-[9px] font-semibold tracking-wide uppercase text-nomaya-gold flex-shrink-0">
              {t("circles.coming_soon_badge")}
            </span>
          </button>
        ))}
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
