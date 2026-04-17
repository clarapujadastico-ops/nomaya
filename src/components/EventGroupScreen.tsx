import { useState, useRef, useEffect } from "react";
import { CalendarDays, MapPin, MessageCircle, ImageIcon, Send, Camera } from "lucide-react";
import { Camera as CapCamera, CameraResultType, CameraSource } from "@capacitor/camera";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useEventMessages, useSendEventMessage } from "@/hooks/useEventMessages";

const IMG_PREFIX = "__img__:";

export interface EventGroupEvent {
  id: string;
  title: string;
  date: string;
  city: string;
  image?: string | null;
  location?: string | null;
  description?: string | null;
}

async function uploadEventPhoto(eventId: string): Promise<string | null> {
  try {
    const photo = await CapCamera.getPhoto({
      resultType: CameraResultType.Base64,
      source: CameraSource.Photos,
      quality: 80,
    });
    if (!photo.base64String) return null;
    const chars = atob(photo.base64String);
    const bytes = new Uint8Array(chars.length);
    for (let i = 0; i < chars.length; i++) bytes[i] = chars.charCodeAt(i);
    const blob = new Blob([bytes], { type: "image/jpeg" });
    const path = `event-photos/${eventId}/${Date.now()}.jpg`;
    const { error } = await supabase.storage.from("Events").upload(path, blob, { upsert: false, contentType: "image/jpeg" });
    if (error) throw error;
    return supabase.storage.from("Events").getPublicUrl(path).data.publicUrl;
  } catch {
    return null;
  }
}

export function EventGroupScreen({ event, onBack }: { event: EventGroupEvent; onBack: () => void }) {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: messages = [], isLoading: msgsLoading } = useEventMessages(event.id);
  const { mutate: send, isPending: isSending } = useSendEventMessage();
  const [activeTab, setActiveTab] = useState<"about" | "chat" | "photos">("chat");
  const [text, setText] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const chatMessages = messages.filter((m) => !m.content.startsWith(IMG_PREFIX));
  const photos = messages.filter((m) => m.content.startsWith(IMG_PREFIX));

  useEffect(() => {
    if (activeTab === "chat") {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages.length, activeTab]);

  function handleSend() {
    if (!text.trim()) return;
    send({ eventId: event.id, content: text.trim(), senderName: profile?.name ?? undefined });
    setText("");
  }

  async function handleUploadPhoto() {
    setIsUploadingPhoto(true);
    const url = await uploadEventPhoto(event.id);
    if (url) send({ eventId: event.id, content: `${IMG_PREFIX}${url}`, senderName: profile?.name ?? undefined });
    setIsUploadingPhoto(false);
  }

  return (
    <div className="mobile-container flex flex-col bg-background pb-screen-bottom">
      {/* Hero */}
      <div className="relative h-52">
        {event.image ? (
          <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{ background: "hsl(252 30% 45%)" }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent" />
        <button
          onClick={onBack}
          className="absolute top-12 left-4 w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center text-foreground text-base"
        >
          ←
        </button>
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-[10px] uppercase tracking-widest text-card/60 mb-0.5">Event Group</p>
          <h2 className="font-serif text-xl font-medium text-card leading-snug">{event.title}</h2>
          <p className="text-xs text-card/70 mt-0.5">{event.city}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mx-5 mt-4 gap-1">
        {(["about", "chat", "photos"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab ? "border-primary text-foreground" : "border-transparent text-muted-foreground"
            }`}
          >
            {tab === "chat" && <MessageCircle size={14} />}
            {tab === "photos" && <ImageIcon size={14} />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="px-5 py-4">
        {/* About tab */}
        {activeTab === "about" && (
          <div className="space-y-4">
            <div className="bg-card rounded-2xl p-4 shadow-soft space-y-3">
              {event.date && (
                <div className="flex items-center gap-2.5 text-sm text-foreground">
                  <CalendarDays size={15} className="text-muted-foreground flex-shrink-0" />
                  <span>{event.date}</span>
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-2.5 text-sm text-foreground">
                  <MapPin size={15} className="text-muted-foreground flex-shrink-0" />
                  <span>{event.location}</span>
                </div>
              )}
              {event.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">{event.description}</p>
              )}
            </div>
            <div className="bg-card rounded-2xl p-4 shadow-soft space-y-1.5">
              <p className="text-sm font-medium text-foreground">Your event group</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Chat with everyone attending this event and share photos from the experience.
              </p>
            </div>
          </div>
        )}

        {/* Chat tab */}
        {activeTab === "chat" && (
          <div className="bg-card rounded-2xl shadow-soft overflow-hidden flex flex-col" style={{ minHeight: 320 }}>
            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: 380 }}>
              {msgsLoading && <p className="text-xs text-muted-foreground text-center">Loading…</p>}
              {!msgsLoading && chatMessages.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No messages yet. Say hello to your table! 👋</p>
              )}
              {chatMessages.map((msg) => {
                const isOwn = msg.user_id === user?.id;
                const time = new Date(msg.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
                return (
                  <div key={msg.id} className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
                    {msg.sender?.avatar_url ? (
                      <img src={msg.sender.avatar_url} className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                        {msg.sender?.name?.[0] ?? "?"}
                      </div>
                    )}
                    <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                      {!isOwn && (
                        <p className="text-[10px] text-muted-foreground mb-0.5 px-1">{msg.sender?.name ?? "Attendee"}</p>
                      )}
                      <div className={`px-3 py-2 rounded-2xl text-sm leading-snug ${isOwn ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted text-foreground rounded-tl-sm"}`}>
                        {msg.content}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 px-1">{time}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            <div className="border-t border-border p-3 flex items-center gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Say something to your table…"
                className="flex-1 bg-muted rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <button
                onClick={handleSend}
                disabled={!text.trim() || isSending}
                className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center disabled:opacity-40 transition-all active:scale-95"
              >
                <Send size={15} className="text-primary-foreground" />
              </button>
            </div>
          </div>
        )}

        {/* Photos tab */}
        {activeTab === "photos" && (
          <div className="space-y-3 relative pb-16">
            {msgsLoading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Loading photos…</p>
            ) : photos.length === 0 ? (
              <div className="bg-card rounded-2xl p-8 shadow-soft text-center space-y-2">
                <ImageIcon size={32} className="text-muted-foreground/50 mx-auto mb-1" />
                <p className="text-sm font-medium text-foreground">No photos yet</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Share memories from this event with everyone at your table.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                {photos.map((p) => (
                  <img
                    key={p.id}
                    src={p.content.replace(IMG_PREFIX, "")}
                    className="w-full aspect-square object-cover rounded-xl"
                    alt="Event photo"
                  />
                ))}
              </div>
            )}
            <button
              onClick={handleUploadPhoto}
              disabled={isUploadingPhoto}
              className="fixed bottom-28 right-5 w-14 h-14 rounded-full shadow-floating flex items-center justify-center z-10 transition-transform active:scale-95 gradient-cta disabled:opacity-60"
              aria-label="Add photo"
            >
              {isUploadingPhoto ? (
                <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <Camera size={24} className="text-white" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
