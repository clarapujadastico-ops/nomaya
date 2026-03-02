import { useState, useMemo, useEffect } from "react";
import { Search, SlidersHorizontal, X, Shield, Bell, BellOff } from "lucide-react";
import { useEventInterest, useEventInterestCount } from "@/hooks/useEventInterest";
import { EventCard } from "./EventCard";
import { Logo } from "./Logo";
import { useEvents } from "@/hooks/useEvents";
import { useBookings, useBookEvent, useCancelBooking } from "@/hooks/useBookings";
import { useProfile } from "@/hooks/useProfile";
import { useLang } from "@/contexts/LanguageContext";
import { useEnsureEventCircle } from "@/hooks/useCircles";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { AppEvent } from "@/types/database";
import { useEventAttendees } from "@/hooks/useEventAttendees";
import { Stripe, PaymentSheetEventsEnum } from "@capacitor-community/stripe";

function fmtDate(dateStr: string): string {
  const [, month, day] = dateStr.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(month) - 1]} ${parseInt(day)}`;
}

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

const CAT_KEYS: Record<string, string> = {
  "Arts & Crafts": "cat.arts_crafts",
  "Food & Dining": "cat.food_dining",
  "Fitness":       "cat.fitness",
  "Wellness":      "cat.wellness",
  "Culture":       "cat.culture",
  "Entrepreneurship": "cat.entrepreneurship",
};

// Interest id → event categories it maps to
const INTEREST_CATEGORY_MAP: Record<string, string[]> = {
  arts:             ["Arts & Crafts"],
  wellness:         ["Fitness", "Wellness"],
  food:             ["Food & Dining"],
  culture:          ["Culture"],
  entrepreneurship: ["Entrepreneurship"],
  outdoors:         ["Fitness"],
  reading:          ["Culture"],
  music:            ["Culture"],
  travel:           ["Culture"],
  photography:      ["Arts & Crafts"],
  cooking:          ["Food & Dining"],
  sustainability:   ["Wellness"],
  ceramics:         ["Arts & Crafts"],
  fashion:          ["Arts & Crafts"],
  mindfulness:      ["Wellness"],
  wine:             ["Food & Dining"],
};

function scoreEvent(event: AppEvent, userInterests: string[], bookedCategories: string[]): number {
  let score = 0;
  // Interest match: +3 per matching interest
  for (const interest of userInterests) {
    const cats = INTEREST_CATEGORY_MAP[interest] ?? [];
    if (cats.includes(event.category)) score += 3;
  }
  // Past attendance in same category: +2
  if (bookedCategories.includes(event.category)) score += 2;
  // Popularity (spots taken): +1
  if (event.totalSpots - event.spotsLeft > 0) score += 1;
  // Featured: +1
  if (event.featured) score += 1;
  return score;
}

interface EventsScreenProps {
  onOpenCircle?: (id: string, tab?: 'chat' | 'about') => void;
  onOpenMap?: () => void;
  onSeeAllBookings?: () => void;
}

export function EventsScreen({ onOpenCircle, onOpenMap, onSeeAllBookings }: EventsScreenProps = {}) {
  const { t } = useLang();
  function tCat(cat: string) { return t(CAT_KEYS[cat] ?? "") || cat; }
  const [view, setView] = useState<"suggested" | "all" | "week">("suggested");
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [pendingFilters, setPendingFilters] = useState<FilterState>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(defaultFilters);
  const [showVerifyPrompt, setShowVerifyPrompt] = useState(false);

  const { data: events = [], isLoading } = useEvents();
  const { data: bookings = [] } = useBookings();
  const { data: profile } = useProfile();
  const { user } = useAuth();
  const isUnverified = false; // TODO: re-enable when verification flow is ready

  const [searchQuery, setSearchQuery] = useState("");

  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showCancelSheet, setShowCancelSheet] = useState(false);
  const [cancelChoice, setCancelChoice] = useState<'refund' | 'credits'>('credits');
  const [cancelOutcome, setCancelOutcome] = useState<string | null>(null);
  const { mutate: bookEvent, isPending: isBooking } = useBookEvent();
  const { mutate: cancelBooking, isPending: isCancelling } = useCancelBooking();
  const { mutateAsync: ensureEventCircle, isPending: isOpeningChat } = useEnsureEventCircle();
  const { data: attendees = [] } = useEventAttendees(selectedEvent);

  // Initialise Stripe once on mount (no-op if key not set)
  useEffect(() => {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (publishableKey) {
      Stripe.initialize({ publishableKey });
    }
  }, []);

  // Interest / notify-me (for TBC events)
  const { isInterested, toggle: toggleInterest, isPending: isTogglingInterest } = useEventInterest(selectedEvent ?? "");
  const { data: interestCount = 0 } = useEventInterestCount(selectedEvent ?? "");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingEvents = events.filter((e) => e.isTbc || new Date(e.rawDate) >= today);
  const featured = upcomingEvents.filter((e) => e.featured);

  // Scoring inputs
  const userInterests: string[] = profile?.interests ?? [];
  const bookedCategories = useMemo(
    () => [...new Set(bookings.filter(b => b.event).map(b => b.event!.category?.name ?? ""))],
    [bookings]
  );

  // Fixed category order — only show if events exist in that category
  const ALLOWED_CATEGORIES = ["Arts & Crafts", "Food & Dining", "Fitness", "Wellness"];
  const categories = useMemo(() => {
    const existing = new Set(upcomingEvents.map((e) => e.category).filter(Boolean));
    return ["All", ...ALLOWED_CATEGORIES.filter((c) => existing.has(c))];
  }, [upcomingEvents]);

  const filtered = useMemo(() => {
    // Base list by view
    let list: AppEvent[];
    if (view === "week") {
      list = upcomingEvents.filter((e) => !e.isTbc && isThisWeek(e.rawDate));
    } else if (view === "suggested") {
      list = [...upcomingEvents].sort((a, b) =>
        scoreEvent(b, userInterests, bookedCategories) - scoreEvent(a, userInterests, bookedCategories)
      );
    } else {
      list = activeFilter === "All"
        ? upcomingEvents
        : upcomingEvents.filter((e) => e.category === activeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((e) =>
        e.title.toLowerCase().includes(q) ||
        (e.description ?? "").toLowerCase().includes(q) ||
        (e.category ?? "").toLowerCase().includes(q)
      );
    }

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
  }, [events, view, activeFilter, appliedFilters, searchQuery, userInterests, bookedCategories]);

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
            <div className="space-y-3">
              {/* Interest count card */}
              <div className="rounded-2xl p-5 text-center space-y-1 shadow-soft" style={{ background: "hsl(252 30% 40%)" }}>
                <p className="text-[10px] uppercase tracking-widest text-white/50 mb-2">Women interested</p>
                <p className="font-serif text-5xl font-medium text-white">{interestCount}</p>
                <p className="text-xs text-white/60 mt-1">
                  {interestCount === 0
                    ? "Be the first to register interest"
                    : interestCount === 1
                    ? "1 woman wants to know when this opens"
                    : `${interestCount} women want to know when this opens`}
                </p>
              </div>
              <div className="bg-card rounded-2xl p-4 shadow-soft">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Location</p>
                <p className="text-sm font-medium text-foreground">{event.city}</p>
                <p className="text-xs text-muted-foreground mt-1 italic">Date & details to be confirmed</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Date", value: `${event.date} · ${event.time}` },
                { label: "Spots left", value: `${event.spotsLeft} spots left` },
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
                {isBooked ? (
                  <button
                    onClick={() => onOpenMap?.()}
                    className="text-xs text-primary font-medium mt-0.5"
                  >
                    See map →
                  </button>
                ) : (
                  <p className="text-[10px] text-muted-foreground mt-0.5">Register to see address</p>
                )}
              </div>
            </div>
          )}

          <div className="bg-card rounded-2xl p-4 shadow-soft">
            <h3 className="font-serif text-lg font-medium text-foreground mb-2">About this event</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {event.description || `A carefully curated gathering for women who share a love of ${event.category.toLowerCase()}. Small group of max ${event.totalSpots} participants. Come as you are. Leave feeling connected.`}
            </p>
            {isBooked && (
              <button
                onClick={() => onOpenMap?.()}
                className="flex items-center gap-1.5 mt-3 text-sm text-primary font-medium"
              >
                📍 See map — view exact address
              </button>
            )}
          </div>

          {attendees.length > 0 && (
            <div className="bg-card rounded-2xl p-4 shadow-soft">
              <h3 className="font-serif text-lg font-medium text-foreground mb-3">Who's coming</h3>
              <div className="space-y-3">
                {attendees.map((a) => (
                  <div key={a.user_id} className="flex items-center gap-3">
                    {a.profile?.avatar_url ? (
                      <img src={a.profile.avatar_url} alt={a.profile.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-medium flex-shrink-0">
                        {a.profile?.name?.[0] ?? "?"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{a.profile?.name ?? "Member"}</p>
                      {a.profile?.bio && (
                        <p className="text-xs text-muted-foreground leading-snug line-clamp-2">{a.profile.bio}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {bookingError && (
            <div className="bg-red-500/20 border border-red-400/40 rounded-xl px-4 py-3 text-xs text-red-200">
              {bookingError}
            </div>
          )}

          {isUnverified ? (
            <button
              onClick={() => setShowVerifyPrompt(true)}
              className="w-full py-4 rounded-2xl gradient-cta text-white font-medium text-base shadow-soft transition-all active:scale-[0.98]"
            >
              Verify to join this event →
            </button>
          ) : event.isTbc ? (
            <button
              onClick={() => { setBookingError(null); !isBooked && bookEvent({ eventId: selectedEvent }, { onError: (e) => setBookingError(e.message) }); }}
              disabled={isBooked || isBooking}
              className="w-full py-4 rounded-2xl gradient-cta text-white font-medium text-base shadow-soft transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-default"
            >
              {isBooked ? "✓ On the waitlist" : isBooking ? "Joining…" : t("events.waitlist")}
            </button>
          ) : (
            <button
              onClick={async () => {
                setBookingError(null);
                if (isBooked || isBooking || isProcessingPayment || event.spotsLeft === 0) return;

                if (event.price === "Free") {
                  bookEvent(
                    { eventId: selectedEvent },
                    { onError: (e) => setBookingError(e.message) }
                  );
                  return;
                }

                // Paid event — use Stripe Payment Sheet
                setIsProcessingPayment(true);
                try {
                  let fnRes: Response | null = null;
                  try {
                    fnRes = await fetch(
                      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`,
                      {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                        },
                        body: JSON.stringify({ eventId: selectedEvent, userId: user?.id }),
                      }
                    );
                  } catch {
                    fnRes = null;
                  }

                  // Edge Function unavailable or Stripe not configured — book directly
                  if (!fnRes || !fnRes.ok) {
                    bookEvent(
                      { eventId: selectedEvent },
                      { onError: (e) => setBookingError(e.message) }
                    );
                    return;
                  }

                  const data = await fnRes.json();

                  // Graceful degradation: Stripe not yet configured
                  if (data?.warning === 'Stripe not configured') {
                    bookEvent(
                      { eventId: selectedEvent },
                      { onError: (e) => setBookingError(e.message) }
                    );
                    return;
                  }

                  const { clientSecret, publishableKey, amountCents } = data;

                  // Re-initialise with the key returned from the server (handles pk_live_ vs pk_test_)
                  if (publishableKey) {
                    await Stripe.initialize({ publishableKey });
                  }

                  await Stripe.createPaymentSheet({
                    paymentIntentClientSecret: clientSecret,
                    merchantDisplayName: 'Nomaya',
                  });

                  // Listen for completion before presenting
                  const listener = await Stripe.addListener(
                    PaymentSheetEventsEnum.Completed,
                    () => {
                      bookEvent(
                        {
                          eventId: selectedEvent,
                          paymentIntentId: clientSecret.split('_secret_')[0],
                          amountCentsPaid: amountCents,
                        },
                        { onError: (e) => setBookingError(e.message) }
                      );
                      listener.remove();
                    }
                  );

                  await Stripe.presentPaymentSheet();
                } catch (err) {
                  setBookingError(err instanceof Error ? err.message : "Payment failed. Please try again.");
                } finally {
                  setIsProcessingPayment(false);
                }
              }}
              disabled={isBooked || isBooking || isProcessingPayment || event.spotsLeft === 0}
              className="w-full py-4 rounded-2xl gradient-cta text-white font-medium text-base shadow-soft transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-default"
            >
              {isBooked
                ? "✓ Spot reserved"
                : isBooking || isProcessingPayment
                ? "Processing…"
                : event.spotsLeft === 0
                ? t("events.fully_booked")
                : `Reserve my spot · ${event.price}`}
            </button>
          )}

          {cancelOutcome && (
            <div className="bg-primary/10 border border-primary/30 rounded-xl px-4 py-3 text-sm text-foreground text-center">
              {cancelOutcome}
            </div>
          )}

          {isBooked && !cancelOutcome && (
            <button
              onClick={() => { setCancelOutcome(null); setShowCancelSheet(true); }}
              className="w-full py-3 rounded-2xl bg-transparent border border-border text-muted-foreground text-sm font-medium transition-all active:scale-[0.98]"
            >
              {t("events.cancel_reservation")}
            </button>
          )}
        </div>
      </div>

      {/* ── Cancellation sheet ──────────────────────────────────────────── */}
      {showCancelSheet && booking && (() => {
        const isPaid = booking.payment_status === 'succeeded' && (booking.amount_cents_paid ?? 0) > 0;
        const eventDate = event.rawDate ? new Date(`${event.rawDate}T${event.time ?? '00:00'}`) : null;
        const hoursUntil = eventDate ? (eventDate.getTime() - Date.now()) / 3_600_000 : Infinity;
        const isEligible = isPaid && hoursUntil >= 48;
        const isTooLate = isPaid && hoursUntil < 48;
        const amountEur = ((booking.amount_cents_paid ?? 0) / 100).toFixed(2);
        const creditsEur = (Math.round((booking.amount_cents_paid ?? 0) * 1.1) / 100).toFixed(2);

        return (
          <div className="fixed inset-0 z-[200] flex items-end justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCancelSheet(false)} />
            <div className="relative w-full max-w-sm bg-card rounded-t-3xl p-6 space-y-4" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 2.5rem)" }}>
              <div className="w-10 h-1 bg-border rounded-full mx-auto" />
              <h2 className="font-serif text-xl font-medium text-foreground text-center">Cancel reservation</h2>

              {isEligible && (
                <>
                  <p className="text-xs text-muted-foreground text-center">Choose how you'd like your refund</p>
                  <div className="space-y-3">
                    {/* Credits option */}
                    <button
                      onClick={() => setCancelChoice('credits')}
                      className={`w-full rounded-2xl p-4 border-2 text-left transition-all ${cancelChoice === 'credits' ? 'border-primary bg-primary/10' : 'border-border bg-muted'}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl mt-0.5">✨</span>
                        <div>
                          <p className="text-sm font-medium text-foreground">Nomaya Credits + 10% bonus</p>
                          <p className="text-xs text-muted-foreground mt-0.5">€{creditsEur} to spend on future events</p>
                        </div>
                        <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${cancelChoice === 'credits' ? 'border-primary bg-primary' : 'border-border'}`}>
                          {cancelChoice === 'credits' && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                    </button>
                    {/* Refund option */}
                    <button
                      onClick={() => setCancelChoice('refund')}
                      className={`w-full rounded-2xl p-4 border-2 text-left transition-all ${cancelChoice === 'refund' ? 'border-primary bg-primary/10' : 'border-border bg-muted'}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl mt-0.5">💳</span>
                        <div>
                          <p className="text-sm font-medium text-foreground">Full refund</p>
                          <p className="text-xs text-muted-foreground mt-0.5">€{amountEur} back to your original payment method</p>
                        </div>
                        <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${cancelChoice === 'refund' ? 'border-primary bg-primary' : 'border-border'}`}>
                          {cancelChoice === 'refund' && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed text-center">
                    Cancellations 48h+ before the event receive a full refund or Nomaya Credits with a 10% bonus. Credits are applied automatically at checkout.
                  </p>
                </>
              )}

              {isTooLate && (
                <>
                  <div className="bg-amber-500/10 border border-amber-400/30 rounded-xl p-4 text-center space-y-1">
                    <p className="text-sm font-medium text-foreground">Non-refundable cancellation</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      This event is less than 48 hours away. Cancellations within 48h of the event are non-refundable.
                    </p>
                  </div>
                </>
              )}

              {!isPaid && (
                <p className="text-sm text-muted-foreground text-center">Are you sure you want to cancel your spot?</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelSheet(false)}
                  className="flex-1 py-3 rounded-2xl bg-muted text-foreground text-sm font-medium border border-border"
                >
                  Keep my spot
                </button>
                <button
                  disabled={isCancelling}
                  onClick={() => {
                    const choice = isEligible ? cancelChoice : 'none';
                    cancelBooking(
                      { bookingId: booking.id, choice },
                      {
                        onSuccess: (result) => {
                          setShowCancelSheet(false);
                          if (result.credits_awarded) {
                            setCancelOutcome(`✨ €${(result.credits_awarded / 100).toFixed(2)} credits added to your account`);
                          } else if (result.refunded_cents) {
                            setCancelOutcome(`✓ €${(result.refunded_cents / 100).toFixed(2)} refund initiated`);
                          } else {
                            setCancelOutcome('✓ Reservation cancelled');
                          }
                        },
                        onError: (e) => {
                          setShowCancelSheet(false);
                          setBookingError(e.message);
                        },
                      }
                    );
                  }}
                  className="flex-1 py-3 rounded-2xl bg-red-500/80 text-white text-sm font-medium disabled:opacity-50"
                >
                  {isCancelling ? 'Cancelling…' : isTooLate ? 'Cancel anyway' : 'Confirm cancellation'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("events.search")}
              className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground flex-1 focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}>
                <X size={14} className="text-muted-foreground" />
              </button>
            )}
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

      {/* View tabs */}
      <div className="flex gap-2 px-5 mb-3">
        {([
          { id: "suggested", label: "✦ Suggested" },
          { id: "all",       label: "All events" },
          { id: "week",      label: "This week" },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium border transition-all duration-200 ${
              view === tab.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Category sub-filter — only shown in All view */}
      {view === "all" && (
        <div className="flex gap-2 px-5 overflow-x-auto pb-2 scrollbar-hide mb-2">
          {categories.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                activeFilter === f
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border"
              }`}
            >
              {f === "All" ? t("cat.all") : tCat(f)}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">{t("events.loading")}</p>
        </div>
      ) : (
        <>
          {/* Nomaya Only — single compact banner */}
          {view === "suggested" && !hasFilters && !searchQuery && featured.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center justify-between px-5 mb-3">
                <h2 className="font-serif text-lg font-medium text-foreground">Nomaya Only</h2>
              </div>
              {(() => {
                const ev = featured[0];
                return (
                  <button
                    onClick={() => isUnverified ? setShowVerifyPrompt(true) : setSelectedEvent(ev.id)}
                    className="mx-5 w-[calc(100%-2.5rem)] rounded-2xl overflow-hidden shadow-soft h-28 relative text-left"
                  >
                    {ev.image ? (
                      <img src={ev.image} alt={ev.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full" style={{ background: ev.categoryColor }} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
                    <div className="absolute inset-0 flex flex-col justify-center px-4 gap-1">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full self-start" style={{ background: "hsl(347 86% 77%)", color: "#fff" }}>
                        {ev.category}
                      </span>
                      <p className="font-serif text-base font-medium text-white leading-snug">{ev.title}</p>
                      {!ev.isTbc && (
                        <p className="text-[11px] text-white/70">{ev.date}</p>
                      )}
                    </div>
                  </button>
                );
              })()}
            </div>
          )}

          {/* My Events — attended events with chat CTA */}
          {bookings.filter(b => b.status === 'confirmed').length > 0 && !searchQuery && view === "suggested" && !hasFilters && (
            <div className="mb-5">
              <div className="flex items-center justify-between px-5 mb-3">
                <h2 className="font-serif text-lg font-medium text-foreground">My Events</h2>
                <button onClick={() => onSeeAllBookings?.()} className="text-xs text-primary">
                  See all →
                </button>
              </div>
              <div className="flex gap-3 px-5 overflow-x-auto pb-2 scrollbar-hide">
                {bookings.filter(b => b.status === 'confirmed' && b.event).map((booking) => {
                  const ev = booking.event!;
                  return (
                    <button
                      key={booking.id}
                      disabled={isOpeningChat}
                      onClick={async () => {
                        const circleId = await ensureEventCircle({ eventId: booking.event_id, eventTitle: ev.title });
                        onOpenCircle?.(circleId, 'chat');
                      }}
                      className="flex-shrink-0 w-36 rounded-xl overflow-hidden shadow-soft active:scale-[0.97] transition-transform disabled:opacity-60"
                    >
                      <div className="h-24 relative">
                        {ev.image_url ? (
                          <img src={ev.image_url} alt={ev.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full" style={{ background: ev.category?.color ?? "hsl(252 30% 45%)" }} />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <span className="absolute bottom-1.5 left-2 text-[9px] uppercase tracking-wider text-white font-medium">
                          {fmtDate(ev.date)}
                        </span>
                      </div>
                      <div className="bg-card px-2.5 py-2">
                        <p className="text-xs font-medium text-foreground leading-snug line-clamp-2">{ev.title}</p>
                        <p className="text-[10px] text-primary mt-0.5">Open chat →</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* All events — 2-column grid */}
          <div className="px-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-serif text-lg font-medium text-foreground">
                {view === "suggested" ? "Suggested for you" : view === "week" ? "This week" : activeFilter === "All" ? t("events.upcoming") : activeFilter}
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
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
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
            <div className="px-6 pt-3 border-t border-border flex gap-3 flex-shrink-0" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 2rem)" }}>
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
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowVerifyPrompt(false)} />
          <div
            className="relative w-full max-w-sm bg-card rounded-t-3xl p-6 space-y-4 text-center"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 2.5rem)" }}
          >
            <div className="w-10 h-1 bg-border rounded-full mx-auto" />
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Shield size={28} className="text-primary" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-medium text-foreground">Verify to join events</h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Nomaya is a women-only space. Complete verification to access and reserve events.
              </p>
            </div>
            <button
              onClick={() => setShowVerifyPrompt(false)}
              className="w-full py-4 rounded-2xl gradient-cta text-white font-medium text-base"
            >
              Go to Profile → Verify
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
