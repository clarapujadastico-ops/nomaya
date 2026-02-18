import { Calendar, MapPin, Users } from "lucide-react";

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  city: string;
  spotsLeft: number;
  totalSpots: number;
  category: string;
  image: string;
  price?: string;
  featured?: boolean;
}

interface EventCardProps {
  event: Event;
  variant?: "featured" | "default";
  onClick?: () => void;
}

export function EventCard({ event, variant = "default", onClick }: EventCardProps) {
  const spotsPercent = (event.spotsLeft / event.totalSpots) * 100;
  const isAlmostFull = spotsPercent <= 30;

  if (variant === "featured") {
    return (
      <button
        onClick={onClick}
        className="relative w-72 flex-shrink-0 rounded-2xl overflow-hidden shadow-card text-left transition-transform duration-200 active:scale-[0.98]"
        style={{ height: 340 }}
      >
        <img src={event.image} alt={event.title} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-card/20 text-card backdrop-blur-sm border border-card/20 mb-2 inline-block">
            {event.category}
          </span>
          <h3 className="font-serif text-xl text-card font-medium leading-tight mb-1">{event.title}</h3>
          <div className="flex items-center gap-3 text-card/80 text-xs">
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
            <span className={`text-xs font-medium ${isAlmostFull ? "text-accent" : "text-card/70"}`}>
              {event.spotsLeft} spots left
            </span>
            {event.price && (
              <span className="text-xs font-medium text-card/90">{event.price}</span>
            )}
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="w-full bg-card rounded-2xl overflow-hidden shadow-soft flex gap-0 text-left transition-transform duration-200 active:scale-[0.98]"
    >
      <div className="w-28 flex-shrink-0">
        <img src={event.image} alt={event.title} className="w-full h-full object-cover" style={{ minHeight: 112 }} />
      </div>
      <div className="flex-1 p-3.5 flex flex-col justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{event.category}</span>
          <h3 className="font-serif text-base font-medium text-foreground leading-snug mt-0.5">{event.title}</h3>
        </div>
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
      </div>
    </button>
  );
}
