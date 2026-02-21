import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, ChevronDown, X, Shield } from "lucide-react";
import { EventCard } from "./EventCard";
import { Logo } from "./Logo";
import { useEvents } from "@/hooks/useEvents";
import { useBookings, useBookEvent, useCancelBooking } from "@/hooks/useBookings";
import { useProfile } from "@/hooks/useProfile";
import { useLang } from "@/contexts/LanguageContext";
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
  const { t } = useLang();
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [pendingFilters, setPendingFilters] = useState<FilterState>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(defaultFilters);
  const [showVerifyPrompt, setShowVerifyPrompt] = useState(false);

  const { data: events = [], isLoading } = useEvents();
  const { data: bookings = [] } = useBookings();
  const { data: profile } = useProfile();
  const isUnverified = profile?.verification_status === "unverified";

  const [bookingError, setBookingError] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
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

  // ── Event detail view ──────────────────────────────────────────────────────
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
      <>
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

          <div className="bg-card rounded-2xl p-4 shadow-soft">
            <h3 className="font-serif text-lg font-medium text-foreground mb-3">Who's coming</h3>
            <div className="flex -space-x-2">
              {Array.from({ length: Math.min(6, event.totalSpots - event.spotsLeft) }).map((_, i) => (
                <div key={i} className="w-9 h-9 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-sm">
                  {["🌸", "🌿", "✨", "🎨", "🌊", "🍀"][i]}
                </div>
              ))}
              <div className="w-9 h-9 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] text-muted-foreground">
                +{event.spotsLeft}
              </div>
            </div>
          </div>

          {bookingError && (
            <div className="bg-red-500/20 border border-red-400/40 rounded-xl px-4 py-3 text-xs text-red-200">
              {bookingError}
            </div>
          )}

          {event.isTbc ? (
            <button
              onClick={() => { setBookingError(null); !isBooked && bookEvent(selectedEvent, { onError: (e) => setBookingError(e.message) }); }}
              disabled={isBooked || isBooking}
              className="w-full py-4 rounded-2xl gradient-cta text-white font-medium text-base shadow-soft transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-default"
            >
              {isBooked ? "✓ On the waitlist" : isBooking ? "Joining…" : t("events.waitlist")}
            </button>
          ) : (
            <button
              onClick={() => {
                setBookingError(null);
                if (isBooked || isBooking || event.spotsLeft === 0) return;
                if (event.price !== "Free") {
                  setShowPayment(true);
                } else {
                  bookEvent(selectedEvent, { onError: (e) => setBookingError(e.message) });
                }
              }}
              disabled={isBooked || isBooking || event.spotsLeft === 0}
              className="w-full py-4 rounded-2xl gradient-cta text-white font-medium text-base shadow-soft transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-default"
            >
              {isBooked
                ? "✓ Spot reserved"
                : isBooking
                ? "Reserving…"
                : event.spotsLeft === 0
                ? t("events.fully_booked")
                : `Reserve my spot · ${event.price}`}
            </button>
          )}

          {isBooked && (
            <button
              onClick={() => booking && cancelBooking(booking.id)}
              disabled={isCancelling}
              className="w-full py-3 rounded-2xl bg-transparent border border-border text-muted-foreground text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isCancelling ? t("events.cancelling") : t("events.cancel_reservation")}
            </button>
          )}
        </div>
      </div>

      {/* Payment sheet */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPayment(false)} />
          <div className="relative w-full max-w-sm bg-card rounded-t-3xl p-6 pb-10 space-y-4">
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-2" />
            <div>
              <h2 className="font-serif text-xl font-medium text-foreground">Payment</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{event.title} · <span className="font-medium text-foreground">{event.price}</span></p>
            </div>
            <div className="space-y-3">
              <div className="bg-muted rounded-xl px-4 py-3">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Card number</p>
                <input
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim())}
                  placeholder="1234 5678 9012 3456"
                  inputMode="numeric"
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none tracking-wider"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1 bg-muted rounded-xl px-4 py-3">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Expiry</p>
                  <input
                    value={cardExpiry}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setCardExpiry(v.length > 2 ? `${v.slice(0,2)}/${v.slice(2)}` : v);
                    }}
                    placeholder="MM/YY"
                    inputMode="numeric"
                    className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>
                <div className="flex-1 bg-muted rounded-xl px-4 py-3">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">CVC</p>
                  <input
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 3))}
                    placeholder="123"
                    inputMode="numeric"
                    className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setShowPayment(false);
                setBookingError(null);
                bookEvent(selectedEvent, { onError: (e) => setBookingError(e.message) });
              }}
              disabled={isBooking}
              className="w-full py-4 rounded-2xl gradient-cta text-white font-medium text-base shadow-soft transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {isBooking ? "Processing…" : `Pay & Reserve · ${event.price}`}
            </button>
            <p className="text-center text-[10px] text-muted-foreground">Payments powered by Stripe</p>
          </div>
        </div>
      )}
      </>
    );
  }

  // ── Main list view ─────────────────────────────────────────────────────────
  return (
    <div className="mobile-container flex flex-col bg-background pb-24">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 text-center">
        <Logo />
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">{t("events.city")}</p>
        <h1 className="font-serif text-4xl font-normal text-foreground tracking-display">{t("events.heading")}</h1>
      </div>

      {/* Verification gate banner */}
      {isUnverified && (
        <button
          onClick={() => setShowVerifyPrompt(true)}
          className="mx-5 mb-4 bg-primary/10 border border-primary/30 rounded-2xl p-4 flex items-center gap-3 text-left"
        >
          <Shield size={18} className="text-primary flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{t("events.verify_gate")}</p>
          </div>
          <span className="text-xs font-medium text-primary flex-shrink-0">{t("events.verify_cta")}</span>
        </button>
      )}

      {/* Search */}
      <div className="px-5 mb-4">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2.5 bg-card rounded-xl px-4 py-3 border border-border shadow-soft">
            <Search size={16} className="text-muted-foreground flex-shrink-0" />
            <input
              placeholder={t("events.search")}
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
            {f === "All" ? t("cat.all") : f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">{t("events.loading")}</p>
        </div>
      ) : (
        <>
          {/* Featured carousel */}
          {activeFilter === "All" && !hasFilters && featured.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center justify-between px-5 mb-3">
                <h2 className="font-serif text-lg font-medium text-foreground">{t("events.featured")}</h2>
                <button className="text-xs text-primary flex items-center gap-1">
                  {t("events.see_all")} <ChevronDown size={12} className="rotate-[-90deg]" />
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

          {/* All events — 2-column grid */}
          <div className="px-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-serif text-lg font-medium text-foreground">
                {activeFilter === "All" ? t("events.upcoming") : activeFilter}
              </h2>
              {hasFilters && (
                <button
                  onClick={() => setAppliedFilters(defaultFilters)}
                  className="flex items-center gap-1 text-xs text-primary"
                >
                  <X size={12} /> {t("events.clear")}
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {filtered.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  variant="grid"
                  locked={isUnverified}
                  onClick={() => isUnverified ? setShowVerifyPrompt(true) : setSelectedEvent(event.id)}
                />
              ))}
              {filtered.length === 0 && (
                <p className="col-span-2 text-sm text-muted-foreground text-center py-8">{t("events.no_results")}</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Filter sheet — fixed header + scrollable content + fixed footer */}
      {showFilterSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowFilterSheet(false)} />
          <div className="relative w-full max-w-sm bg-card rounded-t-3xl flex flex-col" style={{ maxHeight: "85vh" }}>
            {/* Fixed header */}
            <div className="px-6 pt-4 pb-3 flex-shrink-0">
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl font-medium text-foreground">{t("events.filter")}</h2>
                <button onClick={() => setShowFilterSheet(false)}>
                  <X size={18} className="text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-5">
              {/* Activity type */}
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{t("filter.activity")}</p>
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
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{t("filter.group_size")}</p>
                <div className="flex gap-2">
                  {[
                    { id: "intimate" as const, label: t("filter.intimate"), note: t("filter.intimate_note") },
                    { id: "small" as const, label: t("filter.small"), note: t("filter.small_note") },
                    { id: "large" as const, label: t("filter.gathering"), note: t("filter.gathering_note") },
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
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{t("filter.date")}</p>
                <div className="flex gap-2">
                  {[
                    { id: "week" as const, label: t("filter.this_week") },
                    { id: "month" as const, label: t("filter.this_month") },
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
                    {t("filter.any_date")}
                  </button>
                </div>
              </div>
            </div>

            {/* Fixed footer — always visible */}
            <div className="px-6 pt-3 pb-8 border-t border-border flex gap-3 flex-shrink-0">
              <button
                onClick={() => { setAppliedFilters(defaultFilters); setPendingFilters(defaultFilters); setShowFilterSheet(false); }}
                className="flex-1 py-3 rounded-2xl bg-muted text-foreground text-sm font-medium border border-border"
              >
                {t("filter.reset")}
              </button>
              <button
                onClick={() => { setAppliedFilters(pendingFilters); setShowFilterSheet(false); }}
                className="flex-1 py-3 rounded-2xl gradient-cta text-white text-sm font-medium shadow-soft"
              >
                {t("filter.apply")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verify prompt sheet */}
      {showVerifyPrompt && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowVerifyPrompt(false)} />
          <div className="relative w-full max-w-sm bg-card rounded-t-3xl p-6 pb-10 space-y-4 text-center">
            <div className="w-10 h-1 bg-border rounded-full mx-auto" />
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Shield size={24} className="text-primary" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-medium text-foreground">Verify to join events</h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Nomaya is a women-only space. Complete verification to access and reserve events.
              </p>
            </div>
            <button
              onClick={() => setShowVerifyPrompt(false)}
              className="w-full py-4 rounded-2xl gradient-cta text-white font-medium text-sm"
            >
              Go to Profile → Verify
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
