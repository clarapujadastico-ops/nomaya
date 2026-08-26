import { MessageCircle } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";

// Shown instead of the real group chat (ChatPanel) — that component is kept
// in the codebase, just not rendered, so this is easy to remove later.
export function ChatComingSoon({ onBack }: { onBack: () => void }) {
  const { t } = useLang();
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-3">
      <div className="w-14 h-14 rounded-full bg-nomaya-gold/20 flex items-center justify-center">
        <MessageCircle size={24} className="text-nomaya-gold" />
      </div>
      <h3 className="font-serif text-lg font-medium text-foreground">{t("circles.chat_locked_title")}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{t("circles.chat_locked_body")}</p>
      <button onClick={onBack} className="mt-2 text-sm text-primary font-medium">
        {t("circles.chat_locked_back")}
      </button>
    </div>
  );
}
