import { X, Instagram, Music, UtensilsCrossed } from "lucide-react";
import type { MemberProfile } from "@/hooks/useCircleMembers";

const BADGE_META: Record<string, { label: string; icon: string }> = {
  founding_circle:  { label: "Founding Circle",    icon: "🌸" },
  inner_circle:     { label: "Inner Circle",        icon: "✨" },
  keeper:           { label: "Keeper of the Circle",icon: "🔮" },
  founding_member:  { label: "Founding Member",     icon: "🏛️" },
};

interface Props {
  profile: MemberProfile;
  onClose: () => void;
}

export function MemberProfileSheet({ profile, onClose }: Props) {
  const instagramHandle = profile.instagram_url
    ? profile.instagram_url.replace(/^https?:\/\/(www\.)?instagram\.com\/?/, "").replace(/\/$/, "").replace(/^@/, "")
    : null;

  function formatBirthday(dateStr: string | null) {
    if (!dateStr) return null;
    const [, month, day] = dateStr.split("-");
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${months[parseInt(month) - 1]} ${parseInt(day)}`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-h-[90vh] bg-background rounded-t-3xl overflow-y-auto pb-10"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative">
          {/* Avatar */}
          <div className="flex justify-center pt-6 pb-4">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.name} className="w-24 h-24 rounded-full object-cover ring-4 ring-card" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-card flex items-center justify-center text-4xl ring-4 ring-card">🌸</div>
            )}
          </div>
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-card flex items-center justify-center">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        <div className="px-6 space-y-4">
          {/* Name + city */}
          <div className="text-center">
            <h2 className="font-serif text-2xl font-medium text-foreground">{profile.name}</h2>
            {profile.city && <p className="text-sm text-muted-foreground mt-0.5">{profile.city}</p>}
          </div>

          {/* Badges */}
          {profile.badges?.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {profile.badges.map(b => {
                const meta = BADGE_META[b];
                if (!meta) return null;
                return (
                  <span key={b} className="text-xs px-3 py-1 rounded-full bg-card text-foreground">
                    {meta.icon} {meta.label}
                  </span>
                );
              })}
            </div>
          )}

          {/* Bio */}
          {profile.bio && (
            <div className="bg-card rounded-2xl p-4">
              <p className="text-sm text-foreground leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {/* Interests */}
          {profile.interests?.length > 0 && (
            <div className="bg-card rounded-2xl p-4">
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Interests</p>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map(i => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-background text-foreground">{i}</span>
                ))}
              </div>
            </div>
          )}

          {/* Details row */}
          {(profile.horoscope || profile.age_range || formatBirthday(profile.birthday)) && (
            <div className="bg-card rounded-2xl p-4 flex flex-wrap gap-4">
              {profile.horoscope && (
                <div>
                  <p className="text-xs text-muted-foreground">Star sign</p>
                  <p className="text-sm text-foreground mt-0.5">{profile.horoscope}</p>
                </div>
              )}
              {profile.age_range && (
                <div>
                  <p className="text-xs text-muted-foreground">Age</p>
                  <p className="text-sm text-foreground mt-0.5">{profile.age_range}</p>
                </div>
              )}
              {formatBirthday(profile.birthday) && (
                <div>
                  <p className="text-xs text-muted-foreground">Birthday</p>
                  <p className="text-sm text-foreground mt-0.5">{formatBirthday(profile.birthday)}</p>
                </div>
              )}
            </div>
          )}

          {/* Favourites */}
          {(profile.favourite_song || profile.favourite_food) && (
            <div className="bg-card rounded-2xl p-4 space-y-3">
              {profile.favourite_song && (
                <div className="flex items-center gap-3">
                  <Music size={16} className="text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Favourite song</p>
                    <p className="text-sm text-foreground">{profile.favourite_song}</p>
                  </div>
                </div>
              )}
              {profile.favourite_food && (
                <div className="flex items-center gap-3">
                  <UtensilsCrossed size={16} className="text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Favourite food</p>
                    <p className="text-sm text-foreground">{profile.favourite_food}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Instagram */}
          {instagramHandle && (
            <a
              href={`https://instagram.com/${instagramHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white font-medium text-sm"
            >
              <Instagram size={18} />
              @{instagramHandle}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
