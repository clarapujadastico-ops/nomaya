import { Calendar, MapPin, Users, Bell } from "lucide-react";
import type { AppEvent } from "@/types/database";
import { useEventInterestCount } from "@/hooks/useEventInterest";

export type { AppEvent as Event };

interface EventCardProps {
  event: AppEvent;
  variant?: "featured" | "default" | "grid";
  onClick?: () => void;
  locked?: boolean;
}

export function EventCard({ event, variant = "default", onClick, locked = false }: EventCardProps) {
  const spotsPercent = (event.spotsLeft / event.totalSpots) * 100;
  const isAlmostFull = spotsPercent <= 30;
  const { data: interestCount = 0 } = useEventInterestCount(event.id);

  if (variant === "featured") {
    return (
      <button
        onClick={onClick}
        className="relative w-72 flex-shrink-0 rounded-2xl overflow-hidden shadow-card text-left transition-transform duration-200 active:scale-[0.98]"
        style={{ height: 340 }}
      >
        {event.image
          ? <img src={event.image} alt={event.title} className="absolute inset-0 w-full h-full object-cover" />
          : <div className="absolute inset-0 w-full h-full" style={{ background: event.categoryColor }} />
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-nomaya-rose/80 text-white backdrop-blur-sm mb-2 inline-block">
            {event.category}
          </span>
          <h3 className="font-serif text-xl text-white font-medium leading-tight mb-1">{event.title}</h3>
          {event.isTbc ? (
            <span className="text-xs font-medium text-white/70 italic">Coming soon</span>
          ) : (
            <>
              <div className="flex items-center gap-3 text-white/80 text-xs">
                <span className="flex items-center gap-1">
                  <Calendar size={11} />
                  {event.date}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin size={11} />
                  {event.city}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className={`text-xs font-medium ${isAlmostFull ? "text-nomaya-rose" : "text-white/70"}`}>
                  {event.spotsLeft} spots left
                </span>
                {event.price && (
                  <span className="text-xs font-medium text-white/90">{event.price}</span>
                )}
              </div>
            </>
          )}
        </div>
      </button>
    );
  }

  if (variant === "grid") {
    // Format date as DD.MM
    const dateDisplay = event.rawDate
      ? new Date(event.rawDate + "T12:00:00")
          .toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" })
          .replace("/", ".")
      : event.date;

    const statusBadge =
      event.spotsLeft === 0
        ? "Sold out"
        : event.isTbc
        ? null   // handled separately below
        : null;

    const subtext = event.isTbc
      ? interestCount > 0 ? `${interestCount} interested` : "Notify me"
      : event.spotsLeft === 0
      ? "Waitlist"
      : isAlmostFull
      ? `${event.spotsLeft} spots left`
      : `${event.spotsLeft} spots`;

    return (
      <button
        onClick={onClick}
        className="relative rounded-2xl overflow-hidden shadow-soft text-left transition-transform duration-200 active:scale-[0.97] flex flex-col bg-card"
      >
        {/* Square image */}
        <div className="relative w-full" style={{ aspectRatio: "1 / 1" }}>
          {event.image ? (
            <img
              src={event.image}
              alt={event.title}
              className="w-full h-full object-cover absolute inset-0"
            />
          ) : (
            <div
              className="w-full h-full absolute inset-0"
              style={{ background: event.categoryColor }}
            />
          )}

          {/* Status badge */}
          {statusBadge && (
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-white/90 backdrop-blur-sm">
              <span className="text-[10px] font-semibold text-gray-800">{statusBadge}</span>
            </div>
          )}

          {/* TBC — bell badge */}
          {event.isTbc && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full backdrop-blur-sm" style={{ background: "hsl(252 30% 45% / 0.85)" }}>
              <Bell size={9} className="text-white" />
              <span className="text-[10px] font-semibold text-white">Coming soon</span>
            </div>
          )}

          {/* "New" badge for recently added events */}
          {event.featured && !statusBadge && !event.isTbc && (
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-white/90 backdrop-blur-sm">
              <span className="text-[10px] font-semibold text-gray-800">New</span>
            </div>
          )}
        </div>

        {/* Info below image */}
        <div className="p-2.5">
          <p className="text-[10px] text-muted-foreground">{dateDisplay}</p>
          <h3 className="text-sm font-medium text-foreground leading-snug line-clamp-2 mt-0.5">
            {event.title}
          </h3>
          <p className={`text-xs mt-0.5 ${isAlmostFull ? "text-primary font-medium" : "text-muted-foreground"}`}>
            {subtext}
          </p>
        </div>
      </button>
    );
  }

  // Default: horizontal list card
  return (
    <button
      onClick={onClick}
      className="w-full bg-card rounded-2xl overflow-hidden shadow-soft flex gap-0 text-left transition-transform duration-200 active:scale-[0.98]"
    >
      <div className="w-28 flex-shrink-0">
        {event.image
          ? <img src={event.image} alt={event.title} className="w-full h-full object-cover" style={{ minHeight: 112 }} />
          : <div className="w-full h-full" style={{ minHeight: 112, background: event.categoryColor }} />
        }
      </div>
      <div className="flex-1 p-3.5 flex flex-col justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{event.category}</span>
          <h3 className="font-serif text-base font-medium text-foreground leading-snug mt-0.5">{event.title}</h3>
        </div>
        {event.isTbc ? (
          <p className="text-xs text-muted-foreground italic mt-2">Coming soon</p>
        ) : (
          <div className="space-y-1 mt-2">
            <div className="flex items-center gap-3 text-muted-foreground text-xs">
              <span className="flex items-center gap-1">
                <Calendar size={10} />
                {event.date} · {event.time}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-muted-foreground text-xs">
                <MapPin size={10} />
                {event.city}
              </span>
              <span className={`text-xs font-medium ${isAlmostFull ? "text-primary" : "text-muted-foreground"}`}>
                <Users size={10} className="inline mr-0.5" />
                {event.spotsLeft} left
              </span>
            </div>
          </div>
        )}
      </div>
    </button>
  );
}
