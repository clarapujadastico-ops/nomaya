import { X, Instagram } from "lucide-react";
import type { MemberProfile } from "@/hooks/useCircleMembers";

const BADGE_LABELS: Record<string, string> = {
  "founding_member": "🏛️ Founding Member",
  "ritual_1": "🌸 Founding Circle",
  "ritual_3": "✨ Inner Circle",
  "ritual_5": "🔮 Keeper",
};

interface MemberProfileSheetProps {
  profile: MemberProfile | null;
  onClose: () => void;
}

export function MemberProfileSheet({ profile, onClose }: MemberProfileSheetProps) {
  if (!profile) return null;

  const badges = (profile.badges ?? []).map(b => BADGE_LABELS[b]).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-md bg-background rounded-t-3xl overflow-y-auto"
        style={{ maxHeight: "88dvh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-card flex items-center justify-center"
        >
          <X size={16} className="text-muted-foreground" />
        </button>

        <div className="px-6 pb-10 pt-2">
          {/* Avatar + name */}
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-full bg-card overflow-hidden flex-shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-serif text-foreground">
                  {profile.name?.[0] ?? "?"}
                </div>
              )}
            </div>
            <div>
              <h2 className="font-serif text-xl text-foreground leading-tight">{profile.name}</h2>
              {profile.city && (
                <p className="text-xs text-muted-foreground mt-0.5">{profile.city}</p>
              )}
            </div>
          </div>

          {/* Badges */}
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {badges.map(b => (
                <span key={b} className="text-xs bg-card px-2.5 py-1 rounded-full text-foreground">{b}</span>
              ))}
            </div>
          )}

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">{profile.bio}</p>
          )}

          {/* Details grid */}
          <div className="space-y-3 mb-5">
            {profile.age_range && (
              <Row label="Age" value={profile.age_range} />
            )}
            {profile.life_stage && (
              <Row label="Life stage" value={profile.life_stage} />
            )}
            {profile.horoscope && (
              <Row label="Sign" value={profile.horoscope} />
            )}
            {profile.favourite_song && (
              <Row label="Favourite song" value={profile.favourite_song} />
            )}
            {profile.favourite_food && (
              <Row label="Favourite food" value={profile.favourite_food} />
            )}
          </div>

          {/* Interests */}
          {profile.interests?.length > 0 && (
            <div className="mb-5">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Interests</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.interests.map(i => (
                  <span key={i} className="text-xs bg-card px-2.5 py-1 rounded-full text-foreground">{i}</span>
                ))}
              </div>
            </div>
          )}

          {/* Instagram */}
          {profile.instagram_url && (
            <a
              href={profile.instagram_url.startsWith("http") ? profile.instagram_url : `https://instagram.com/${profile.instagram_url.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <Instagram size={14} />
              {profile.instagram_url}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}
