import { X } from "lucide-react";
import { markReferralNoticeShown } from "@/hooks/usePendingReferralNotice";
import { useLang } from "@/contexts/LanguageContext";

interface Props {
  referral: { id: string; name: string };
  onDismiss: () => void;
}

export function ReferralJoinedModal({ referral, onDismiss }: Props) {
  const { lang } = useLang();

  function dismiss() {
    markReferralNoticeShown(referral.id);
    onDismiss();
  }

  return (
    <div className="fixed inset-0 z-[400] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={dismiss} />
      <div
        className="relative w-full max-w-md bg-background rounded-t-3xl overflow-y-auto"
        style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom, 0px))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        <button onClick={dismiss} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-card flex items-center justify-center">
          <X size={16} className="text-muted-foreground" />
        </button>

        <div className="px-6 pt-3 pb-2 text-center space-y-3">
          <p className="text-4xl pt-6">💜</p>
          <p className="font-serif text-2xl font-medium text-foreground leading-snug">
            {lang === "es" ? `¡${referral.name} se unió con tu invitación!` : `${referral.name} joined with your invite!`}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {lang === "es" ? "Salúdala cuando la veas por Nomaya." : "Say hello when you see her around Nomaya."}
          </p>
          <button
            onClick={dismiss}
            className="mt-4 w-full py-3.5 rounded-2xl gradient-cta text-white font-medium text-sm"
          >
            {lang === "es" ? "Genial" : "Great"}
          </button>
        </div>
      </div>
    </div>
  );
}
