import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, ChevronDown, X } from "lucide-react";
import { EventCard } from "./EventCard";
import { Logo } from "./Logo";
import { useEvents } from "@/hooks/useEvents";
import { useBookings, useBookEvent, useCancelBooking } from "@/hooks/useBookings";
import type { AppEvent } from "@/types/database";

interface FilterState {
  groupSize: null | "intimate" | "small" | "large";
  dateRange: null | "week" | "month";
  type: string;
}

const defaultFilters: FilterState = { groupSize: null, dateRange: null, type: "" };

function isThisWeek(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return d >= start && d <= end;
}

function isThisMonth(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export function EventsScreen() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [pendingFilters, setPendingFilters] = useState<FilterState>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(defaultFilters);

  const { data: events = [], isLoading } = useEvents();
  const { data: bookings = [] } = useBookings();
  const { mutate: bookEvent, isPending: isBooking } = useBookEvent();
  const { mutate: cancelBooking, isPending: isCancelling } = useCancelBooking();

  // Fixed category order — only show if events exist in that category
  const ALLOWED_CATEGORIES = ["Arts & Crafts", "Food & Dining", "Fitness"];
  const categories = useMemo(() => {
    const existing = new Set(events.map((e) => e.category).filter(Boolean));
    return ["All", ...ALLOWED_CATEGORIES.filter((c) => existing.has(c))];
  }, [events]);

  const featured = events.filter((e) => e.featured);

  const filtered = useMemo(() => {
    let list = activeFilter === "All"
      ? events
      : events.filter((e) => e.category === activeFilter);

    if (appliedFilters.type) {
      list = list.filter((e) => e.category === appliedFilters.type);
    }
    if (appliedFilters.groupSize) {
      list = list.filter((e) => {
        if (appliedFilters.groupSize === "intimate") return e.totalSpots <= 8;
        if (appliedFilters.groupSize === "small") return e.totalSpots >= 9 && e.totalSpots <= 15;
        return e.totalSpots >= 16;
      });
    }
    if (appliedFilters.dateRange) {
      list = list.filter((e) => {
        if (!e.rawDate) return true;
        if (appliedFilters.dateRange === "week") return isThisWeek(e.rawDate);
        return isThisMonth(e.rawDate);
      });
    }
    return list;
  }, [events, activeFilter, appliedFilters]);

  const hasFilters = appliedFilters.groupSize !== null || appliedFilters.dateRange !== null || appliedFilters.type !== "";

  if (selectedEvent) {
    const event: AppEvent | undefined = events.find((e) => e.id === selectedEvent);
    if (!event) {
      return (
        <div className="mobile-container flex flex-col bg-background pb-24 items-center justify-center">
          <p className="text-muted-foreground text-sm">Loading event…</p>
        </div>
      );
    }

    const booking = bookings.find((b) => b.event_id === selectedEvent);
    const isBooked = !!booking;

    return (
      <div className="mobile-container flex flex-col bg-background pb-24">
        {/* Event hero */}
        <div className="relative h-72">
          {event.image ? (
            <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full" style={{ background: event.categoryColor }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <button
            onClick={() => setSelectedEvent(null)}
            className="absolute top-12 left-4 w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center text-foreground"
          >
            ←
          </button>
          <div className="absolute bottom-4 left-4 right-4">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full mb-2 inline-block" style={{ background: "hsl(347 86% 77%)", color: "hsl(0 0% 100%)" }}>
              {event.category}
            </span>
            <h2 className="font-serif text-2xl font-medium text-white">{event.title}</h2>
          </div>
        </div>

        {/* Details */}
        <div className="px-5 py-5 space-y-5">
          {event.isTbc ? (
            <div className="bg-card rounded-2xl p-4 shadow-soft">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Location</p>
              <p className="text-sm font-medium text-foreground">{event.city}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Register to see address</p>
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-sm text-muted-foreground italic">Details coming soon</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Date", value: `${event.date} · ${event.time}` },
                { label: "Spots left", value: `${event.spotsLeft} of ${event.totalSpots}` },
                { label: "Price", value: event.price },
              ].map(({ label, value }) => (
                <div key={label} className="bg-card rounded-xl p-3.5 shadow-soft">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium text-foreground mt-0.5">{value}</p>
                </div>
              ))}
              <div className="bg-card rounded-xl p-3.5 shadow-soft">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Location</p>
                <p className="text-sm font-medium text-foreground mt-0.5">{event.city}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Register to see address</p>
              </div>
            </div>
          )}

          <div className="bg-card rounded-2xl p-4 shadow-soft">
            <h3 className="font-serif text-lg font-medium text-foreground mb-2">About this event</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {event.description || `A carefully curated gathering for women who share a love of ${event.category.toLowerCase()}. Small group of max ${event.totalSpots} participants. Come as you are. Leave feeling connected.`}
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

          {event.isTbc ? (
            <button
              onClick={() => !isBooked && bookEvent(selectedEvent)}
              disabled={isBooked || isBooking}
              className="w-full py-4 rounded-2xl gradient-cta text-white font-medium text-base shadow-soft transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-default"
            >
              {isBooked ? "✓ On the waitlist" : isBooking ? "Joining…" : "Join the waitlist"}
            </button>
          ) : (
            <button
              onClick={() => !isBooked && bookEvent(selectedEvent)}
              disabled={isBooked || isBooking || event.spotsLeft === 0}
              className="w-full py-4 rounded-2xl gradient-cta text-white font-medium text-base shadow-soft transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-default"
            >
              {isBooked
                ? "✓ Spot reserved"
                : isBooking
                ? "Reserving…"
                : event.spotsLeft === 0
                ? "Fully booked"
                : `Reserve my spot · ${event.price}`}
            </button>
          )}

          {isBooked && (
            <button
              onClick={() => booking && cancelBooking(booking.id)}
              disabled={isCancelling}
              className="w-full py-3 rounded-2xl bg-transparent border border-border text-muted-foreground text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isCancelling ? "Cancelling…" : "Cancel reservation"}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container flex flex-col bg-background pb-24">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 text-center">
        <Logo />
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Madrid · 2026</p>
        <h1 className="font-serif text-4xl font-normal text-foreground tracking-display">Experiences</h1>
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
          <button
            onClick={() => { setPendingFilters(appliedFilters); setShowFilterSheet(true); }}
            className={`w-12 h-12 rounded-xl border flex items-center justify-center shadow-soft transition-colors ${
              hasFilters ? "bg-primary border-primary" : "bg-card border-border"
            }`}
          >
            <SlidersHorizontal size={16} className={hasFilters ? "text-primary-foreground" : "text-muted-foreground"} />
          </button>
        </div>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 px-5 overflow-x-auto pb-2 scrollbar-hide mb-2">
        {categories.map((f) => (
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

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading events…</p>
        </div>
      ) : (
        <>
          {/* Featured carousel */}
          {activeFilter === "All" && !hasFilters && featured.length > 0 && (
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
              {hasFilters && (
                <button
                  onClick={() => setAppliedFilters(defaultFilters)}
                  className="flex items-center gap-1 text-xs text-primary"
                >
                  <X size={12} /> Clear filters
                </button>
              )}
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
              {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No events match your filters.</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Filter sheet */}
      {showFilterSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowFilterSheet(false)} />
          <div className="relative w-full max-w-sm bg-card rounded-t-3xl p-6 pb-10 space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="w-10 h-1 bg-border rounded-full mx-auto" />
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-medium text-foreground">Filters</h2>
              <button onClick={() => setShowFilterSheet(false)}>
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>

            {/* Activity type */}
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Activity type</p>
              <div className="flex flex-wrap gap-2">
                {categories.filter((c) => c !== "All").map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setPendingFilters((f) => ({ ...f, type: f.type === cat ? "" : cat }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      pendingFilters.type === cat
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-foreground border-border"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Group size */}
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Group size</p>
              <div className="flex gap-2">
                {[
                  { id: "intimate" as const, label: "Intimate", note: "≤8" },
                  { id: "small" as const, label: "Small", note: "9–15" },
                  { id: "large" as const, label: "Gathering", note: "16+" },
                ].map(({ id, label, note }) => (
                  <button
                    key={id}
                    onClick={() => setPendingFilters((f) => ({ ...f, groupSize: f.groupSize === id ? null : id }))}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                      pendingFilters.groupSize === id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-foreground border-border"
                    }`}
                  >
                    {label}
                    <span className="block text-[10px] opacity-70 mt-0.5">{note}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Date range */}
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Date</p>
              <div className="flex gap-2">
                {[
                  { id: "week" as const, label: "This week" },
                  { id: "month" as const, label: "This month" },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setPendingFilters((f) => ({ ...f, dateRange: f.dateRange === id ? null : id }))}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                      pendingFilters.dateRange === id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-foreground border-border"
                    }`}
                  >
                    {label}
                  </button>
                ))}
                <button
                  onClick={() => setPendingFilters((f) => ({ ...f, dateRange: null }))}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                    pendingFilters.dateRange === null
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-foreground border-border"
                  }`}
                >
                  Any date
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setAppliedFilters(defaultFilters); setPendingFilters(defaultFilters); setShowFilterSheet(false); }}
                className="flex-1 py-3 rounded-2xl bg-muted text-foreground text-sm font-medium border border-border"
              >
                Reset
              </button>
              <button
                onClick={() => { setAppliedFilters(pendingFilters); setShowFilterSheet(false); }}
                className="flex-1 py-3 rounded-2xl gradient-cta text-white text-sm font-medium shadow-soft"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
