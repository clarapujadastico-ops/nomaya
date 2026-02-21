import { useState, useCallback } from "react";
import { Calendar, Ticket, Globe } from "lucide-react";
import Map, { Marker, Popup } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEvents } from "@/hooks/useEvents";
import { useBookings } from "@/hooks/useBookings";
import { Logo } from "./Logo";
import { useLang } from "@/contexts/LanguageContext";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;

// Madrid neighbourhood coordinates for events without lat/lon
const NEIGHBOURHOOD_COORDS: Record<string, [number, number]> = {
  Malasaña:   [-3.7045, 40.4262],
  Chueca:     [-3.6985, 40.4227],
  Lavapiés:   [-3.7026, 40.4092],
  Salamanca:  [-3.6826, 40.4282],
  "La Latina":[-3.7130, 40.4147],
  Chamberi:   [-3.7002, 40.4330],
  Madrid:     [-3.7038, 40.4168],
};

const NEIGHBOURHOOD_LIST = Object.entries(NEIGHBOURHOOD_COORDS);

function getEventCoords(eventId: string, lat: number | null, lon: number | null): [number, number] {
  if (lat !== null && lon !== null) return [lon, lat];
  // Spread events across neighbourhoods based on id hash
  const idx = eventId.charCodeAt(eventId.length - 1) % NEIGHBOURHOOD_LIST.length;
  return NEIGHBOURHOOD_LIST[idx][1];
}

const CATEGORY_COLORS: Record<string, string> = {
  "Food & Dining":    "#d4835a",
  "Arts & Crafts":    "#9b7bca",
  "Wellness":         "#5a9e7a",
  "Fitness":          "#5a9e7a",
  "Entrepreneurship": "#5a8fb5",
  "Culture":          "#c45a75",
  "Ceramics":         "#c48a5a",
  "Jewelry":          "#c4b55a",
};

function categoryColor(cat: string, fallback: string): string {
  return CATEGORY_COLORS[cat] ?? fallback;
}

export function MapScreen() {
  const { t } = useLang();
  const [popupEventId, setPopupEventId] = useState<string | null>(null);
  const [showMyOnly, setShowMyOnly] = useState(false);
  const { data: allEvents = [], isLoading: eventsLoading } = useEvents();
  const { data: bookings = [], isLoading: bookingsLoading } = useBookings();

  const isLoading = eventsLoading || bookingsLoading;
  const bookedIds = new Set(bookings.map((b) => b.event_id));
  const events = showMyOnly ? allEvents.filter((e) => bookedIds.has(e.id)) : allEvents;
  const selectedEvent = popupEventId ? events.find((e) => e.id === popupEventId) : null;

  const handleMarkerClick = useCallback((id: string) => {
    setPopupEventId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <div className="mobile-container flex flex-col bg-background">
      {/* Header */}
      <div className="px-5 pt-14 pb-3 text-center">
        <Logo />
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Madrid · 2026</p>
        <h1 className="font-serif text-4xl font-normal text-foreground tracking-display">{t("map.heading")}</h1>
      </div>

      {/* Toggle */}
      <div className="flex gap-2 mx-5 mb-3">
        <button
          onClick={() => setShowMyOnly(false)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium border transition-all ${
            !showMyOnly ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border"
          }`}
        >
          <Globe size={12} /> {t("map.all_events")}
        </button>
        <button
          onClick={() => setShowMyOnly(true)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium border transition-all ${
            showMyOnly ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border"
          }`}
        >
          <Ticket size={12} /> {t("map.my_events_tab")}
        </button>
      </div>

      {/* Map */}
      <div className="mx-5 rounded-2xl overflow-hidden shadow-card" style={{ height: 340 }}>
        {isLoading ? (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Loading map…</p>
          </div>
        ) : (
          <Map
            mapboxAccessToken={MAPBOX_TOKEN}
            initialViewState={{ longitude: -3.7038, latitude: 40.4168, zoom: 12.5 }}
            style={{ width: "100%", height: "100%" }}
            mapStyle="mapbox://styles/mapbox/streets-v12"
            onClick={() => setPopupEventId(null)}
          >
            {events.map((event) => {
              const [lng, lat] = getEventCoords(event.id, event.latitude, event.longitude);
              const color = categoryColor(event.category, event.categoryColor);
              const isSelected = popupEventId === event.id;
              return (
                <Marker key={event.id} longitude={lng} latitude={lat} anchor="bottom">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleMarkerClick(event.id); }}
                    className="transition-transform duration-200"
                    style={{ transform: isSelected ? "scale(1.25)" : "scale(1)" }}
                  >
                    <div
                      className="w-9 h-9 rounded-full border-2 border-white shadow-floating flex items-center justify-center"
                      style={{ background: color }}
                    >
                      <span className="text-white text-[10px] font-bold">
                        {event.category.charAt(0)}
                      </span>
                    </div>
                    <div className="w-0 h-0 mx-auto" style={{
                      borderLeft: "5px solid transparent",
                      borderRight: "5px solid transparent",
                      borderTop: `7px solid ${color}`,
                    }} />
                  </button>
                </Marker>
              );
            })}

            {selectedEvent && (() => {
              const [lng, lat] = getEventCoords(selectedEvent.id, selectedEvent.latitude, selectedEvent.longitude);
              return (
                <Popup
                  longitude={lng}
                  latitude={lat}
                  anchor="bottom"
                  offset={48}
                  closeButton={false}
                  closeOnClick={false}
                  style={{ padding: 0 }}
                >
                  <div className="bg-white rounded-xl overflow-hidden shadow-floating" style={{ width: 200 }}>
                    {selectedEvent.image && (
                      <img src={selectedEvent.image} alt={selectedEvent.title} className="w-full object-cover" style={{ height: 80 }} />
                    )}
                    <div className="p-2.5">
                      <p className="text-[10px] uppercase tracking-widest text-gray-400">{selectedEvent.category}</p>
                      <p className="text-sm font-serif font-medium text-gray-800 leading-snug mt-0.5">{selectedEvent.title}</p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                        <Calendar size={10} />
                        {selectedEvent.date}
                        <span className="ml-1 font-medium text-gray-700">{selectedEvent.price}</span>
                      </div>
                    </div>
                  </div>
                </Popup>
              );
            })()}
          </Map>
        )}
      </div>

      {/* My reservations list */}
      <div className="px-5 mt-5 pb-24">
        <h2 className="font-serif text-lg font-medium text-foreground mb-3">
          {showMyOnly ? t("map.my_reservations") : t("map.all_events")}
        </h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t("map.loading")}</p>
        ) : events.length === 0 ? (
          <div className="bg-card rounded-2xl p-6 shadow-soft flex flex-col items-center gap-3 text-center">
            <Ticket size={28} className="text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("map.empty")}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {events.map((event) => (
              <button
                key={event.id}
                onClick={() => setPopupEventId(event.id === popupEventId ? null : event.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-card border transition-all text-left shadow-soft ${
                  popupEventId === event.id ? "border-primary" : "border-border"
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: categoryColor(event.category, event.categoryColor) }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                  <p className="text-xs text-muted-foreground">{event.city} · {event.date} · {event.time}</p>
                </div>
                <span className="text-xs font-medium text-primary flex-shrink-0">{event.price}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
