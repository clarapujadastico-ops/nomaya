import { useState } from "react";
import { ArrowLeft, QrCode, ListChecks, Check, Calendar } from "lucide-react";
import { Camera as CapCamera, CameraResultType, CameraSource } from "@capacitor/camera";
import jsQR from "jsqr";
import { useEvents } from "@/hooks/useEvents";
import { useAdminEventAttendees, useCheckInAttendee } from "@/hooks/useAdminCheckIn";
import { localizedTitle, localizedEventDate } from "@/types/database";
import { useLang } from "@/contexts/LanguageContext";
import type { AppEvent } from "@/types/database";

async function decodeQrFromBase64(base64: string): Promise<string | null> {
  const img = new Image();
  img.src = `data:image/jpeg;base64,${base64}`;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Image load failed"));
  });
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(imageData.data, imageData.width, imageData.height);
  return code?.data ?? null;
}

function checkInErrorMessage(err: unknown, lang: 'en' | 'es'): string {
  const msg = err instanceof Error ? err.message : '';
  if (msg === 'NOT_BOOKED') {
    return lang === 'es' ? "Esta persona no tiene reserva para este evento." : "This person doesn't have a booking for this event.";
  }
  if (msg === 'ALREADY_CHECKED_IN') {
    return lang === 'es' ? "Esta persona ya ha hecho check-in." : "This person is already checked in.";
  }
  return lang === 'es' ? "No se pudo verificar el código." : "Couldn't verify that code.";
}

interface AdminScreenProps {
  onClose: () => void;
}

export function AdminScreen({ onClose }: AdminScreenProps) {
  const { lang } = useLang();
  const { data: events = [], isLoading } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState<AppEvent | null>(null);

  if (selectedEvent) {
    return <AdminCheckInScreen event={selectedEvent} onBack={() => setSelectedEvent(null)} onClose={onClose} />;
  }

  return (
    <div className="fixed inset-0 z-[400] bg-background flex flex-col" style={{ minHeight: "100dvh" }}>
      <div className="px-5 pt-screen-top pb-4 flex items-center gap-3 border-b border-border/40">
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-card flex items-center justify-center shadow-soft">
          <ArrowLeft size={16} className="text-foreground" />
        </button>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Admin</p>
          <h1 className="font-serif text-xl font-medium text-foreground">
            {lang === 'es' ? "Check-in de eventos" : "Event check-in"}
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
        {isLoading && <p className="text-sm text-muted-foreground text-center py-8">{lang === 'es' ? "Cargando…" : "Loading…"}</p>}
        {!isLoading && events.filter(e => !e.isTbc).length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">{lang === 'es' ? "No hay eventos próximos." : "No upcoming events."}</p>
        )}
        {events.filter(e => !e.isTbc).map(event => (
          <button
            key={event.id}
            onClick={() => setSelectedEvent(event)}
            className="w-full bg-card rounded-2xl p-4 flex items-center gap-3 text-left shadow-soft active:opacity-80"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Calendar size={16} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{localizedTitle(event, lang)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{localizedEventDate(event, lang)} · {event.city}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function AdminCheckInScreen({ event, onBack, onClose }: { event: AppEvent; onBack: () => void; onClose: () => void }) {
  const { lang } = useLang();
  const { data: attendees = [], isLoading } = useAdminEventAttendees(event.id);
  const { mutate: checkIn, isPending } = useCheckInAttendee();
  const [confirmation, setConfirmation] = useState<{ name: string } | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  async function handleScan() {
    setScanError(null);
    try {
      const photo = await CapCamera.getPhoto({
        quality: 80,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        allowEditing: false,
      });
      if (!photo.base64String) return;

      const memberId = await decodeQrFromBase64(photo.base64String);
      if (!memberId) {
        setScanError(lang === 'es' ? "No se pudo leer el código. Inténtalo de nuevo o usa el check-in manual." : "Couldn't read the code. Try again or use manual check-in.");
        return;
      }

      checkIn({ eventId: event.id, memberId }, {
        onSuccess: ({ name }) => {
          setConfirmation({ name: name || (lang === 'es' ? "Miembro" : "Member") });
          setTimeout(() => setConfirmation(null), 1800);
        },
        onError: (err) => setScanError(checkInErrorMessage(err, lang)),
      });
    } catch {
      // user cancelled the scan — no error needed
    }
  }

  function handleManualCheckIn(bookingId: string, name: string) {
    setScanError(null);
    checkIn({ eventId: event.id, bookingId }, {
      onSuccess: () => {
        setConfirmation({ name });
        setTimeout(() => setConfirmation(null), 1400);
      },
      onError: (err) => setScanError(checkInErrorMessage(err, lang)),
    });
  }

  return (
    <div className="fixed inset-0 z-[400] bg-background flex flex-col" style={{ minHeight: "100dvh" }}>
      <div className="px-5 pt-screen-top pb-4 flex items-center gap-3 border-b border-border/40">
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-card flex items-center justify-center shadow-soft">
          <ArrowLeft size={16} className="text-foreground" />
        </button>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {lang === 'es' ? "Check-in de asistentes" : "Check in attendees"}
          </p>
          <h1 className="font-serif text-lg font-medium text-foreground truncate">{localizedTitle(event, lang)}</h1>
        </div>
      </div>

      <div className="px-5 pt-4 grid grid-cols-2 gap-3">
        <button
          onClick={handleScan}
          disabled={isPending}
          className="py-4 rounded-2xl gradient-cta text-white font-medium text-sm flex flex-col items-center gap-1.5 disabled:opacity-60"
        >
          <QrCode size={20} />
          {lang === 'es' ? "Escanear QR" : "Scan QR"}
        </button>
        <div className="py-4 rounded-2xl bg-card border border-border text-foreground font-medium text-sm flex flex-col items-center gap-1.5">
          <ListChecks size={20} className="text-muted-foreground" />
          {lang === 'es' ? "Check-in manual" : "Check in manually"}
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center mt-2 px-5">
        {lang === 'es' ? "O toca a alguien en la lista de abajo." : "Or tap someone in the list below."}
      </p>

      {scanError && (
        <p className="mx-5 mt-3 text-xs text-destructive text-center">{scanError}</p>
      )}

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
        {isLoading && <p className="text-sm text-muted-foreground text-center py-8">{lang === 'es' ? "Cargando…" : "Loading…"}</p>}
        {!isLoading && attendees.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">{lang === 'es' ? "Nadie reservado todavía." : "No one booked yet."}</p>
        )}
        {attendees.map(a => (
          <button
            key={a.id}
            onClick={() => !a.checked_in_at && handleManualCheckIn(a.id, a.profile?.name ?? '')}
            disabled={!!a.checked_in_at || isPending}
            className="w-full bg-card rounded-2xl p-3.5 flex items-center gap-3 shadow-soft text-left disabled:opacity-70"
          >
            <div className="w-9 h-9 rounded-full overflow-hidden bg-muted flex-shrink-0">
              {a.profile?.avatar_url && <img src={a.profile.avatar_url} className="w-full h-full object-cover" alt="" />}
            </div>
            <p className="flex-1 text-sm font-medium text-foreground truncate">{a.profile?.name ?? '—'}</p>
            {a.checked_in_at ? (
              <span className="flex items-center gap-1 text-xs font-medium text-primary flex-shrink-0">
                <Check size={14} /> {lang === 'es' ? "Registrada" : "Checked in"}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground flex-shrink-0">{lang === 'es' ? "Toca para registrar" : "Tap to check in"}</span>
            )}
          </button>
        ))}
      </div>

      {confirmation && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/50 px-8" onClick={() => setConfirmation(null)}>
          <div className="bg-card rounded-3xl p-8 flex flex-col items-center gap-3 text-center max-w-xs w-full shadow-floating">
            <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
              <Check size={32} className="text-primary" />
            </div>
            <p className="font-serif text-xl font-medium text-foreground">
              {lang === 'es' ? "Registrada ✓" : "Checked in ✓"}
            </p>
            <p className="text-base text-foreground">{confirmation.name}</p>
            <p className="text-sm text-muted-foreground">{localizedTitle(event, lang)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
