import { useState } from "react";
import { X, Download } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";

export function UpdateAvailableBanner({ updateUrl }: { updateUrl: string }) {
  const { t } = useLang();
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[500] flex justify-center px-4"
      style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}
    >
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-floating px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "hsl(var(--nomaya-purple) / 0.15)" }}>
          <Download size={16} style={{ color: "hsl(var(--nomaya-purple))" }} />
        </div>
        <p className="flex-1 text-xs text-foreground leading-snug">{t("update.banner_text")}</p>
        <button
          onClick={() => window.open(updateUrl, "_blank")}
          className="text-xs font-medium px-3 py-1.5 rounded-full text-white flex-shrink-0"
          style={{ background: "hsl(var(--nomaya-purple))" }}
        >
          {t("update.button")}
        </button>
        <button onClick={() => setDismissed(true)} className="flex-shrink-0 text-muted-foreground">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
