import { Sparkles } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";

export function CreateCircleLockedSheet({ onClose }: { onClose: () => void }) {
  const { t } = useLang();
  const { data: profile } = useProfile();
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const alreadyInterested = profile?.circle_launch_interest ?? false;

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-sm bg-card rounded-t-3xl p-6 space-y-4"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 2.5rem)" }}
      >
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-1" />
        <div className="flex flex-col items-center text-center gap-3 py-1">
          <div className="w-14 h-14 rounded-full bg-nomaya-gold/20 flex items-center justify-center">
            <Sparkles size={24} className="text-nomaya-gold" />
          </div>
          <h2 className="font-serif text-xl font-medium text-foreground">{t("circles.create_locked_title")}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{t("circles.create_locked_body")}</p>
          <p className="text-xs text-nomaya-gold font-medium">{t("circles.club_early_access")}</p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-4 rounded-2xl font-medium text-sm tracking-wide transition-all duration-200 active:scale-[0.98] gradient-cta text-white"
        >
          {t("circles.got_it")}
        </button>

        {!alreadyInterested && (
          <button
            onClick={() => updateProfile({ circle_launch_interest: true })}
            disabled={isPending}
            className="w-full py-2 text-sm text-muted-foreground text-center disabled:opacity-50"
          >
            {t("circles.early_access_cta")}
          </button>
        )}
      </div>
    </div>
  );
}
