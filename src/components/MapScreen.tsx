import { useState } from "react";
import { MapPin, Calendar } from "lucide-react";
import { useEvents } from "@/hooks/useEvents";

// Fallback city coordinates (as % on simulated map)
const cityPositions: Record<string, { x: number; y: number }> = {
  Barcelona: { x: 38, y: 62 },
  Madrid: { x: 52, y: 40 },
  Seville: { x: 35, y: 75 },
};

const defaultPosition = { x: 50, y: 50 };

export function MapScreen() {
  const [selectedPin, setSelectedPin] = useState<string | null>(null);
  const { data: events = [], isLoading } = useEvents();

  const selectedEvent = selectedPin ? events.find((e) => e.id === selectedPin) : null;

  const categoryColors: Record<string, string> = {
    "Food & Dining": "hsl(15 60% 55%)",
    "Arts & Crafts": "hsl(280 38% 55%)",
    Wellness: "hsl(140 35% 45%)",
    Entrepreneurship: "hsl(200 50% 45%)",
    Culture: "hsl(340 50% 55%)",
  };

  return (
    <div className="mobile-container flex flex-col bg-background">
      {/* Header */}
      <div className="px-5 pt-14 pb-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Discover nearby</p>
        <h1 className="font-serif text-4xl font-normal text-foreground tracking-display">Map</h1>
      </div>

      {/* Map area */}
      <div className="mx-5 rounded-2xl overflow-hidden shadow-card relative" style={{ height: 340 }}>
        <div
          className="w-full h-full relative"
          style={{
            background: "linear-gradient(145deg, hsl(200 30% 88%), hsl(140 20% 82%), hsl(200 25% 79%))",
          }}
        >
          {/* Grid lines */}
          <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
            {Array.from({ length: 8 }).map((_, i) => (
              <line key={`h${i}`} x1="0" y1={`${(i + 1) * 12.5}%`} x2="100%" y2={`${(i + 1) * 12.5}%`} stroke="hsl(200 30% 60%)" strokeWidth="0.5" />
            ))}
            {Array.from({ length: 8 }).map((_, i) => (
              <line key={`v${i}`} x1={`${(i + 1) * 12.5}%`} y1="0" x2={`${(i + 1) * 12.5}%`} y2="100%" stroke="hsl(200 30% 60%)" strokeWidth="0.5" />
            ))}
          </svg>

          {/* Roads */}
          <svg className="absolute inset-0 w-full h-full opacity-40" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 45% Q30% 40%, 60% 50% T100% 48%" stroke="hsl(0 0% 95%)" strokeWidth="3" fill="none" />
            <path d="M20% 0 Q25% 35%, 30% 70% T28% 100%" stroke="hsl(0 0% 95%)" strokeWidth="2" fill="none" />
            <path d="M50% 0 Q55% 45%, 52% 100%" stroke="hsl(0 0% 95%)" strokeWidth="2.5" fill="none" />
            <path d="M0 70% Q40% 65%, 100% 72%" stroke="hsl(0 0% 92%)" strokeWidth="1.5" fill="none" />
          </svg>

          {/* Event pins */}
          {events.map((event) => {
            const pos = cityPositions[event.city] ?? defaultPosition;
            // Slight offset per event id so overlapping pins spread out
            const offset = parseInt(event.id.slice(-2), 16) % 8;
            const x = pos.x + (offset - 4);
            const y = pos.y + (offset % 3) - 1;
            const color = categoryColors[event.category] ?? event.categoryColor;
            const isSelected = selectedPin === event.id;

            return (
              <button
                key={event.id}
                onClick={() => setSelectedPin(isSelected ? null : event.id)}
                className="absolute transform -translate-x-1/2 -translate-y-full transition-all duration-200"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                <div
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium shadow-floating transition-all duration-200 ${
                    isSelected ? "scale-110" : ""
                  }`}
                  style={{
                    background: color,
                    color: "hsl(0 0% 98%)",
                    boxShadow: `0 4px 16px ${color}40`,
                  }}
                >
                  <MapPin size={10} />
                  {event.city}
                </div>
                <div className="w-2 h-2 mx-auto rounded-full -mt-px" style={{ background: color }} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-3 px-5 mt-3 flex-wrap">
        {Object.entries(categoryColors).map(([cat, color]) => (
          <div key={cat} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            {cat}
          </div>
        ))}
      </div>

      {/* Selected event card */}
      {selectedEvent && (
        <div className="mx-5 mt-4 bg-card rounded-2xl overflow-hidden shadow-floating animate-fade-up">
          <div className="flex gap-0">
            <div className="w-20 flex-shrink-0">
              {selectedEvent.image ? (
                <img src={selectedEvent.image} alt={selectedEvent.title} className="w-full h-full object-cover" style={{ minHeight: 80 }} />
              ) : (
                <div className="w-full h-full" style={{ minHeight: 80, background: selectedEvent.categoryColor }} />
              )}
            </div>
            <div className="flex-1 p-3">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{selectedEvent.category}</span>
              <h3 className="font-serif text-sm font-medium text-foreground leading-snug">{selectedEvent.title}</h3>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar size={10} />{selectedEvent.date}</span>
                <span className="flex items-center gap-1"><MapPin size={10} />{selectedEvent.city}</span>
              </div>
            </div>
            <div className="pr-3 flex items-center">
              <button className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium">
                View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nearby events list */}
      <div className="px-5 mt-5 pb-24">
        <h2 className="font-serif text-lg font-medium text-foreground mb-3">Nearby events</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="space-y-2.5">
            {events.slice(0, 3).map((event) => (
              <button
                key={event.id}
                onClick={() => setSelectedPin(event.id === selectedPin ? null : event.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-card border transition-all text-left ${
                  selectedPin === event.id ? "border-primary" : "border-border"
                } shadow-soft`}
              >
                <MapPin size={14} className="text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                  <p className="text-xs text-muted-foreground">{event.city} · {event.date}</p>
                </div>
                <span className="text-xs font-medium text-primary">{event.spotsLeft} left</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
