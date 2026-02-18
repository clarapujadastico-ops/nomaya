import { useState } from "react";
import { Search, SlidersHorizontal, ChevronDown } from "lucide-react";
import { EventCard } from "./EventCard";
import { EVENTS, FILTERS } from "@/data/mockData";

export function EventsScreen() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  const featured = EVENTS.filter((e) => e.featured);
  const filtered =
    activeFilter === "All"
      ? EVENTS
      : EVENTS.filter((e) => e.category === activeFilter || e.category.includes(activeFilter));

  if (selectedEvent) {
    const event = EVENTS.find((e) => e.id === selectedEvent)!;
    return (
      <div className="mobile-container flex flex-col bg-background pb-24">
        {/* Event hero */}
        <div className="relative h-72">
          <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
          <button
            onClick={() => setSelectedEvent(null)}
            className="absolute top-12 left-4 w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center text-foreground"
          >
            ←
          </button>
          <div className="absolute bottom-4 left-4 right-4">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-card/20 text-card backdrop-blur-sm border border-card/20 mb-2 inline-block">
              {event.category}
            </span>
            <h2 className="font-serif text-2xl font-medium text-card">{event.title}</h2>
          </div>
        </div>

        {/* Details */}
        <div className="px-5 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Date", value: `${event.date} · ${event.time}` },
              { label: "Location", value: event.city },
              { label: "Spots left", value: `${event.spotsLeft} of ${event.totalSpots}` },
              { label: "Price", value: event.price || "Free" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-card rounded-xl p-3.5 shadow-soft">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
                <p className="text-sm font-medium text-foreground mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          <div className="bg-card rounded-2xl p-4 shadow-soft">
            <h3 className="font-serif text-lg font-medium text-foreground mb-2">About this event</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A carefully curated gathering for women who share a love of {event.category.toLowerCase()}. 
              Small group of max {event.totalSpots} participants. Come as you are. Leave feeling connected.
            </p>
          </div>

          {/* Who's attending */}
          <div className="bg-card rounded-2xl p-4 shadow-soft">
            <h3 className="font-serif text-lg font-medium text-foreground mb-3">Who's coming</h3>
            <div className="flex -space-x-2">
              {Array.from({ length: Math.min(6, event.totalSpots - event.spotsLeft) }).map((_, i) => (
                <div
                  key={i}
                  className="w-9 h-9 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-sm"
                >
                  {["🌸", "🌿", "✨", "🎨", "🌊", "🍀"][i]}
                </div>
              ))}
              <div className="w-9 h-9 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] text-muted-foreground">
                +{event.spotsLeft}
              </div>
            </div>
          </div>

          <button className="w-full py-4 rounded-2xl gradient-cta text-primary-foreground font-medium text-base shadow-soft transition-all active:scale-[0.98]">
            Reserve my spot · {event.price || "Free"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container flex flex-col bg-background pb-24">
      {/* Header */}
      <div className="px-5 pt-14 pb-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Barcelona · Mar 2026</p>
        <h1 className="font-serif text-3xl font-medium text-foreground">Experiences</h1>
      </div>

      {/* Search */}
      <div className="px-5 mb-4">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2.5 bg-card rounded-xl px-4 py-3 border border-border shadow-soft">
            <Search size={16} className="text-muted-foreground flex-shrink-0" />
            <input
              placeholder="Search events..."
              className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground flex-1 focus:outline-none"
            />
          </div>
          <button className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center shadow-soft">
            <SlidersHorizontal size={16} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 px-5 overflow-x-auto pb-2 scrollbar-hide mb-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium border transition-all duration-200 ${
              activeFilter === f
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Featured carousel */}
      {activeFilter === "All" && (
        <div className="mb-5">
          <div className="flex items-center justify-between px-5 mb-3">
            <h2 className="font-serif text-lg font-medium text-foreground">Featured</h2>
            <button className="text-xs text-primary flex items-center gap-1">
              See all <ChevronDown size={12} className="rotate-[-90deg]" />
            </button>
          </div>
          <div className="flex gap-4 px-5 overflow-x-auto pb-2 scrollbar-hide">
            {featured.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                variant="featured"
                onClick={() => setSelectedEvent(event.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* All events list */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-lg font-medium text-foreground">
            {activeFilter === "All" ? "Upcoming" : activeFilter}
          </h2>
          <button className="text-xs text-muted-foreground flex items-center gap-1">
            Date <ChevronDown size={12} />
          </button>
        </div>
        <div className="space-y-3">
          {filtered.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              variant="default"
              onClick={() => setSelectedEvent(event.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
