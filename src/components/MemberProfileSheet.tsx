import { useState } from "react";
import { X, Instagram, UserPlus, Check } from "lucide-react";
import type { MemberProfile } from "@/hooks/useCircleMembers";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/lib/supabase";
import { useLang } from "@/contexts/LanguageContext";
import { INTERESTS, LIFE_STAGES } from "@/data/mockData";

const BADGE_LABELS: Record<string, string> = {
  "founding_member": "🏛️ Founding Member",
};

interface MemberProfileSheetProps {
  profile: MemberProfile | null;
  userId?: string | null;
  onClose: () => void;
}

export function MemberProfileSheet({ profile, userId, onClose }: MemberProfileSheetProps) {
  const { user } = useAuth();
  const { data: myProfile } = useProfile();
  const { t } = useLang();
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  if (!profile) return null;

  const badges = (profile.badges ?? []).map(b => BADGE_LABELS[b]).filter(Boolean);
  const isSelf = userId && user?.id === userId;
  // life_stage is stored as a comma-joined string of LIFE_STAGES ids to
  // support multi-select without a DB schema change (see OnboardingFlow).
  const lifeStageLabels = (profile.life_stage ?? "")
    .split(",")
    .map((id) => LIFE_STAGES.find((s) => s.id === id.trim()))
    .filter((s): s is typeof LIFE_STAGES[number] => !!s)
    .map((s) => t(s.labelKey));

  async function handleConnect() {
    if (!userId || !user || isSelf || connected) return;
    setConnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              userId,
              title: `${myProfile?.name ?? 'Someone'} wants to connect`,
              body: 'Open Nomaya to see their profile in My Connections.',
              data: { tab: 'community' },
            }),
          }
        ).catch(() => {});
      }
      setConnected(true);
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-md bg-background rounded-t-3xl overflow-y-auto"
        style={{ maxHeight: "92dvh" }}
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

        <div
          className="px-6 pt-2"
          style={{ paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom, 0px))' }}
        >
          {/* Avatar + name + connect */}
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
            <div className="flex-1 min-w-0">
              <h2 className="font-serif text-xl text-foreground leading-tight">{profile.name}</h2>
              {profile.city && (
                <p className="text-xs text-muted-foreground mt-0.5">{profile.city}</p>
              )}
            </div>
            {userId && !isSelf && (
              <button
                onClick={handleConnect}
                disabled={connecting || connected}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all flex-shrink-0 ${
                  connected
                    ? 'bg-primary/20 text-primary'
                    : 'bg-primary text-primary-foreground active:opacity-80'
                }`}
              >
                {connected
                  ? <><Check size={13} /> Connected</>
                  : <><UserPlus size={13} /> Connect</>}
              </button>
            )}
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
            {profile.age_range && <Row label={t("member.age")} value={profile.age_range} />}
            {lifeStageLabels.length > 0 && <Row label={t("member.life_stage")} value={lifeStageLabels.join(", ")} />}
            {profile.horoscope && <Row label={t("member.sign")} value={profile.horoscope} />}
            {profile.favourite_song && <Row label={t("member.favourite_song")} value={profile.favourite_song} />}
            {profile.favourite_food && <Row label={t("member.favourite_food")} value={profile.favourite_food} />}
          </div>

          {/* Interests */}
          {profile.interests?.length > 0 && (
            <div className="mb-5">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{t("member.interests")}</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.interests.map(id => {
                  const interest = INTERESTS.find(i => i.id === id);
                  return (
                    <span key={id} className="text-xs bg-card px-2.5 py-1 rounded-full text-foreground">
                      {interest ? `${interest.emoji} ${t(interest.labelKey)}` : id}
                    </span>
                  );
                })}
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
