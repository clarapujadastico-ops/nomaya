import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { useAttendedEventChats, useLeaveEventChat, type AttendedEventChat } from "@/hooks/useAttendedEventChats";
import { useEnsureEventCircle } from "@/hooks/useCircles";
import { EventChatSheet } from "./EventsScreen";
import { resolveEventImage } from "@/assets/eventImages";

export function ChatsScreen() {
  const { t, lang } = useLang();
  const { data: chats = [], isLoading } = useAttendedEventChats();
  const { mutateAsync: ensureEventCircle, isPending } = useEnsureEventCircle();
  const { mutate: leaveEventChat } = useLeaveEventChat();
  const [openChat, setOpenChat] = useState<{ circleId: string; event: { id: string; title: string } } | null>(null);

  async function openEventChat(ev: AttendedEventChat) {
    const circleId = await ensureEventCircle({ eventId: ev.event_id, eventTitle: ev.title });
    setOpenChat({ circleId, event: { id: ev.event_id, title: ev.title } });
  }

  return (
    <div className="mobile-container flex flex-col bg-background pb-screen-bottom" style={{ minHeight: "100dvh" }}>
      <div className="px-5 pt-screen-top pb-4">
        <h1 className="font-serif text-4xl font-normal text-foreground tracking-display">{t("chats.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("chats.subtitle")}</p>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">{t("events.loading")}</p>
        </div>
      ) : chats.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-10 text-center gap-3">
          <MessageCircle size={32} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground leading-relaxed">{t("chats.empty")}</p>
        </div>
      ) : (
        <div className="px-5 space-y-2">
          {chats.map((ev) => {
            const title = lang === "es" && ev.title_es ? ev.title_es : ev.title;
            const img = resolveEventImage(ev.title, ev.image_url ?? "");
            return (
              <button
                key={ev.event_id}
                onClick={() => openEventChat(ev)}
                disabled={isPending}
                className="w-full bg-card rounded-2xl overflow-hidden shadow-soft flex items-center gap-3 pr-4 active:opacity-80 transition-opacity disabled:opacity-60"
              >
                <div className="w-16 h-16 flex-shrink-0">
                  {img ? (
                    <img src={img} alt={title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-secondary" />
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left py-2">
                  <p className="text-sm font-semibold text-foreground truncate">{title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{t("chats.attended")}</p>
                </div>
                <MessageCircle size={16} className="text-muted-foreground flex-shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      {openChat && (
        <EventChatSheet
          circleId={openChat.circleId}
          event={openChat.event}
          onClose={() => setOpenChat(null)}
          onLeave={() => {
            leaveEventChat({ circleId: openChat.circleId, eventId: openChat.event.id });
            setOpenChat(null);
          }}
        />
      )}
    </div>
  );
}
