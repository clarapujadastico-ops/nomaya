import { MapPin } from "lucide-react";
import type { BookingWithEvent } from "@/types/database";
import { resolveEventImage } from "@/assets/eventImages";

function formatPlanDate(dateStr: string, lang: 'en' | 'es'): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short' });
}

interface YourNomayaModalProps {
  bookings: BookingWithEvent[];
  lang: 'en' | 'es';
  onClose: () => void;
  onGoToEvents: () => void;
}

export function YourNomayaModal({ bookings, lang, onClose, onGoToEvents }: YourNomayaModalProps) {
  const attended = bookings
    .filter(b => b.checked_in_at && b.event)
    .sort((a, b) => (b.event!.date > a.event!.date ? 1 : -1));

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-card rounded-t-3xl overflow-y-auto" style={{ maxHeight: "90dvh", paddingBottom: "max(env(safe-area-inset-bottom), 2rem)" }}>
        <div className="w-10 h-1 bg-border rounded-full mx-auto mt-4" />

        {attended.length === 0 ? (
          <div className="px-6 pt-6 pb-2 text-center">
            <p className="text-3xl mb-3">💜</p>
            <h2 className="font-serif text-xl text-foreground">
              {lang === 'es' ? "Tu primer plan Nomaya" : "Your first Nomaya plan"}
            </h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {lang === 'es'
                ? "La mejor forma de formar parte de Nomaya es simple: ven a conocernos. 💜"
                : "The best way to become part of Nomaya is simple: come meet us. 💜"}
            </p>
            <button
              onClick={() => { onClose(); onGoToEvents(); }}
              className="w-full mt-5 py-3.5 rounded-2xl gradient-cta text-white font-medium text-sm"
            >
              {lang === 'es' ? "Encuentra tu primer plan" : "Find your first plan"}
            </button>
          </div>
        ) : (
          <>
            <div className="px-6 pt-4 pb-5 text-center border-b border-border">
              <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">
                {lang === 'es' ? "Tu Nomaya" : "Your Nomaya"}
              </p>
              <p className="font-serif text-xl text-foreground leading-snug">
                {lang === 'es'
                  ? `Has sido parte de ${attended.length} plan${attended.length === 1 ? '' : 'es'} Nomaya 💜`
                  : `You've been part of ${attended.length} Nomaya plan${attended.length === 1 ? '' : 's'} 💜`}
              </p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                {lang === 'es'
                  ? "Cada plan al que asistes se convierte en parte de tu historia Nomaya."
                  : "Every plan you show up to becomes part of your Nomaya story."}
              </p>
            </div>

            <div className="px-6 pt-4">
              <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">
                {lang === 'es' ? "Tus planes" : "Your plans"}
              </p>
              <div className="space-y-3">
                {attended.map(b => {
                  const event = b.event!;
                  const title = lang === 'es' && event.title_es ? event.title_es : event.title;
                  const image = resolveEventImage(event.title, event.image_url ?? '');
                  return (
                    <div key={b.id} className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                        {image && <img src={image} alt={title} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          {formatPlanDate(event.date, lang)} <MapPin size={10} className="ml-1" /> {event.city}
                        </p>
                        <p className="text-xs text-primary mt-0.5">
                          {lang === 'es' ? "Estuviste allí 💜" : "You were there 💜"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
