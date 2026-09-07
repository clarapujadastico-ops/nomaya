import { X } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import type { FamiliarFace } from "@/hooks/useFamiliarFaces";

interface Props {
  faces: FamiliarFace[];
  onClose: () => void;
}

export function FamiliarFacesSheet({ faces, onClose }: Props) {
  const { t, lang } = useLang();

  return (
    <div className="fixed inset-0 z-[350] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-sm bg-card rounded-t-3xl overflow-hidden"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1.5rem)" }}
      >
        <div className="w-10 h-1 bg-border rounded-full mx-auto mt-3 mb-1" />
        <div className="px-5 pt-3 pb-4 flex items-center justify-between">
          <h2 className="font-serif text-lg font-medium text-foreground">{t("event.familiar_faces_title")}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>
        <div className="px-5 pb-2 space-y-1 max-h-[60vh] overflow-y-auto">
          {faces.map((f) => {
            const eventTitle = lang === "es" && f.metEventTitleEs ? f.metEventTitleEs : f.metEventTitle;
            const firstName = f.name.split(" ")[0];
            return (
              <div key={f.user_id} className="flex items-center gap-3 py-2.5">
                {f.avatar_url ? (
                  <img src={f.avatar_url} alt={firstName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-medium flex-shrink-0">
                    {firstName[0] ?? "?"}
                  </div>
                )}
                <p className="text-sm text-foreground">
                  <span className="font-medium">{firstName}</span>
                  {" — "}
                  <span className="text-muted-foreground">{t("event.met_at")} {eventTitle}</span>
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
