import { useState } from "react";
import { ArrowLeft, Ticket } from "lucide-react";
import { useBookings } from "@/hooks/useBookings";
import { useEnsureEventCircle } from "@/hooks/useCircles";
import { EventChatSheet } from "@/components/EventsScreen";

interface BookingsScreenProps {
  onBack: () => void;
}

function fmtDate(dateStr: string): string {
  const [, month, day] = dateStr.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(month) - 1]} ${parseInt(day)}`;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "confirmed") {
    return (
      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
        Confirmed
      </span>
    );
  }
  if (status === "cancelled") {
    return (
      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
        Cancelled
      </span>
    );
  }
  return (
    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
      Attended
    </span>
  );
}

export function BookingsScreen({ onBack }: BookingsScreenProps) {
  const { data: bookings = [], isLoading } = useBookings();
  const { mutateAsync: ensureEventCircle, isPending: isOpening } = useEnsureEventCircle();
  const [openGroup, setOpenGroup] = useState<{ circleId: string; event: { id: string; title: string } } | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = bookings.filter(
    (b) => b.event && new Date(b.event.date) >= today
  );
  const past = bookings.filter(
    (b) => b.event && new Date(b.event.date) < today
  );

  async function openEventGroup(eventId: string, eventTitle: string) {
    const circleId = await ensureEventCircle({ eventId, eventTitle });
    setOpenGroup({ circleId, event: { id: eventId, title: eventTitle } });
  }

  function BookingRow({ booking }: { booking: (typeof bookings)[number] }) {
    const ev = booking.event!;
    const timeStr = (ev as any).time
      ? (ev as any).time.slice(0, 5)
      : null;
    return (
      <button
        onClick={() => openEventGroup(ev.id, ev.title)}
        disabled={isOpening}
        className="w-full flex items-center gap-3 py-3 border-b border-border last:border-0 text-left active:opacity-70 transition-opacity disabled:opacity-50">
        {/* Thumbnail */}
        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
          {ev.image_url ? (
            <img src={ev.image_url} alt={ev.title} className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full"
              style={{ background: ev.category?.color ?? "hsl(252 30% 45%)" }}
            />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{ev.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {fmtDate(ev.date)}{timeStr ? ` · ${timeStr}` : ""}
          </p>
        </div>

        {/* Badge */}
        <StatusBadge status={booking.status} />
      </button>
    );
  }

  return (
    <div className="mobile-container flex flex-col bg-background pb-8">
      {/* Header */}
      <div className="px-5 pt-screen-top pb-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-card flex items-center justify-center"
        >
          <ArrowLeft size={16} className="text-foreground" />
        </button>
        <h1 className="font-serif text-2xl font-medium text-foreground">My Bookings</h1>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-10 text-center">
          <Ticket size={40} className="text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No bookings yet. Reserve your first event to see it here.
          </p>
        </div>
      ) : (
        <div className="px-5 space-y-6">
          {upcoming.length > 0 && (
            <div>
              <h2 className="font-serif text-lg font-medium text-foreground mb-1">Upcoming</h2>
              <div className="bg-card rounded-2xl px-4 shadow-soft">
                {upcoming.map((b) => (
                  <BookingRow key={b.id} booking={b} />
                ))}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h2 className="font-serif text-lg font-medium text-foreground mb-1">Past</h2>
              <div className="bg-card rounded-2xl px-4 shadow-soft opacity-80">
                {past.map((b) => (
                  <BookingRow key={b.id} booking={b} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {openGroup && (
        <EventChatSheet
          circleId={openGroup.circleId}
          event={openGroup.event}
          onClose={() => setOpenGroup(null)}
        />
      )}
    </div>
  );
}
