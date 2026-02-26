import { useState, useRef, useEffect } from "react";
import { Users, Plus, ChevronRight, Lock, Send, MessageCircle, Check, X, UserPlus, CalendarDays, MapPin, Clock, Info, Camera, Shield } from "lucide-react";
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { useCircles, useJoinCircle, useLeaveCircle, useCreateCircle, useRequestJoinCircle, useMyJoinRequests, useCircleJoinRequests, useRespondToJoinRequest, useUpdateCircleEventPolicy, useUpdateCircleCover } from "@/hooks/useCircles";
import { useProfile } from "@/hooks/useProfile";
import { VerificationFlow } from "./VerificationFlow";
import { useCircleMessages, useSendMessage } from "@/hooks/useCircleMessages";
import { useCircleEvents, useCreateCircleEvent, useUpdateCircleEventStatus } from "@/hooks/useCircleEvents";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "./Logo";
import { supabase } from "@/lib/supabase";
import type { AppCircle } from "@/types/database";

// ─── Photo upload helpers ──────────────────────────────────────────────────────

async function uploadPhoto(base64: string, path: string): Promise<string> {
  const chars = atob(base64);
  const bytes = new Uint8Array(chars.length);
  for (let i = 0; i < chars.length; i++) bytes[i] = chars.charCodeAt(i);
  const blob = new Blob([bytes], { type: 'image/jpeg' });
  const { error } = await supabase.storage.from('Events').upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
  if (error) throw error;
  return supabase.storage.from('Events').getPublicUrl(path).data.publicUrl;
}

async function pickAndUpload(path: string): Promise<string | null> {
  try {
    const photo = await CapCamera.getPhoto({
      quality: 85,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Photos,
    });
    if (!photo.base64String) return null;
    return await uploadPhoto(photo.base64String, path);
  } catch {
    return null; // user cancelled or permission denied
  }
}

const EMOJIS = ["🌸", "🌿", "✨", "🎨", "🌊", "🍀", "🦋", "🌺", "💫", "🍃", "🌙", "🎋"];

const CIRCLE_EVENT_COLOR = "hsl(38, 82%, 62%)";

// Curated Unsplash placeholder images per category
const CATEGORY_IMAGES: Record<string, string> = {
  "Arts & Crafts":    "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop&auto=format",
  "Food & Dining":    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop&auto=format",
  "Fitness":          "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400&h=300&fit=crop&auto=format",
  "Wellness":         "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop&auto=format",
  "Culture":          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&auto=format",
  "Entrepreneurship": "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=400&h=300&fit=crop&auto=format",
  "General":          "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=300&fit=crop&auto=format",
};

function circlePlaceholder(category: string): string {
  return CATEGORY_IMAGES[category] ?? CATEGORY_IMAGES["General"];
}

// ─── Chat panel ───────────────────────────────────────────────────────────────

function ChatPanel({ circleId, isMember }: { circleId: string; isMember: boolean }) {
  const { user } = useAuth();
  const { data: messages = [], isLoading } = useCircleMessages(isMember ? circleId : null);
  const { mutate: send, isPending: isSending } = useSendMessage();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isMember) {
    return (
      <div className="bg-card rounded-2xl p-6 shadow-soft flex flex-col items-center gap-3 text-center">
        <Lock size={24} className="text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Join the circle to access the chat</p>
      </div>
    );
  }

  function handleSend() {
    if (!text.trim()) return;
    send({ circleId, content: text.trim() });
    setText("");
  }

  return (
    <div className="bg-card rounded-2xl shadow-soft overflow-hidden flex flex-col" style={{ minHeight: 320 }}>
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: 320 }}>
        {isLoading && <p className="text-xs text-muted-foreground text-center">Loading…</p>}
        {!isLoading && messages.length === 0 && (
          <p className="text-xs text-muted-foreground text-center">No messages yet. Say hello 👋</p>
        )}
        {messages.map((msg) => {
          const isOwn = msg.user_id === user?.id;
          const time = new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
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
                  <p className="text-[10px] text-muted-foreground mb-0.5 px-1">{msg.sender?.name ?? "Member"}</p>
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
          placeholder="Say something…"
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
  );
}

// ─── Events tab ───────────────────────────────────────────────────────────────

function EventsTab({ circle, onCreateEvent }: { circle: AppCircle; onCreateEvent: () => void }) {
  const { user } = useAuth();
  const { data: events = [], isLoading } = useCircleEvents(circle.id);
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateCircleEventStatus();
  const isMember = circle.isMember || circle.isAdmin;

  const pendingEvents = events.filter((e) => e.status === 'pending');
  const approvedEvents = events.filter((e) => e.status === 'approved');

  function formatEventDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  return (
    <div className="space-y-3 relative pb-16">
      {/* Info banner for members in review-mode circles */}
      {!circle.isAdmin && circle.eventPolicy === 'review' && (
        <div className="flex items-start gap-2 bg-card rounded-2xl p-3 shadow-soft">
          <Info size={14} className="text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Event proposals are reviewed by the admin before they appear to all members.
          </p>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-4">Loading events…</p>
      ) : (
        <>
          {/* Pending events — admin review queue */}
          {circle.isAdmin && pendingEvents.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground px-1 uppercase tracking-wide">
                Pending review ({pendingEvents.length})
              </p>
              {pendingEvents.map((ev) => (
                <div key={ev.id} className="bg-card rounded-2xl p-4 shadow-soft space-y-2 border border-dashed border-border">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground leading-snug">{ev.title}</p>
                    <span className="text-[10px] font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                      Pending
                    </span>
                  </div>
                  {ev.location && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin size={11} /> {ev.location}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock size={11} /> {formatEventDate(ev.date)}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => updateStatus({ eventId: ev.id, circleId: circle.id, status: 'rejected' })}
                      disabled={isUpdating}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-border text-muted-foreground text-xs font-medium"
                    >
                      <X size={12} /> Decline
                    </button>
                    <button
                      onClick={() => updateStatus({ eventId: ev.id, circleId: circle.id, status: 'approved' })}
                      disabled={isUpdating}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-white text-xs font-medium"
                      style={{ background: CIRCLE_EVENT_COLOR }}
                    >
                      <Check size={12} /> Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Member's own pending events (non-admin) */}
          {!circle.isAdmin && pendingEvents.filter((e) => e.created_by === user?.id).map((ev) => (
            <div key={ev.id} className="bg-card rounded-2xl p-4 shadow-soft space-y-1.5 border border-dashed border-border opacity-80">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-foreground leading-snug">{ev.title}</p>
                <span className="text-[10px] font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                  Pending review
                </span>
              </div>
              {ev.location && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin size={11} /> {ev.location}
                </div>
              )}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock size={11} /> {formatEventDate(ev.date)}
              </div>
            </div>
          ))}

          {/* Approved events */}
          {approvedEvents.length === 0 && pendingEvents.length === 0 ? (
            <div className="bg-card rounded-2xl p-6 shadow-soft text-center space-y-1">
              <CalendarDays size={28} className="text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isMember
                  ? "No events yet. Be the first to propose a gathering!"
                  : "No events yet."}
              </p>
            </div>
          ) : (
            approvedEvents.map((ev) => (
              <div key={ev.id} className="bg-card rounded-2xl p-4 shadow-soft space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-foreground leading-snug">{ev.title}</p>
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0"
                    style={{ background: CIRCLE_EVENT_COLOR + "33", color: "#8a5f1a" }}
                  >
                    {formatEventDate(ev.date)}
                  </span>
                </div>
                {ev.location && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin size={11} /> {ev.location}
                  </div>
                )}
                {ev.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{ev.description}</p>
                )}
                {ev.max_spots && (
                  <p className="text-[10px] text-muted-foreground">{ev.max_spots} spots</p>
                )}
              </div>
            ))
          )}
        </>
      )}

      {/* FAB — all members can propose events */}
      {isMember && (
        <button
          onClick={onCreateEvent}
          className="fixed bottom-28 right-5 w-14 h-14 rounded-full shadow-floating flex items-center justify-center z-10 transition-transform active:scale-95"
          style={{ background: CIRCLE_EVENT_COLOR }}
          aria-label="Add event"
        >
          <Plus size={26} className="text-white" />
        </button>
      )}
    </div>
  );
}

// ─── Create circle event sheet ────────────────────────────────────────────────

function CreateCircleEventSheet({
  circleId, isAdmin, eventPolicy, onClose,
}: {
  circleId: string; isAdmin: boolean; eventPolicy: 'open' | 'review'; onClose: () => void;
}) {
  const { mutate: create, isPending } = useCreateCircleEvent();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [maxSpots, setMaxSpots] = useState("");

  const willBePending = !isAdmin && eventPolicy === 'review';

  function handleSubmit() {
    if (!title.trim() || !date) return;
    const status = isAdmin || eventPolicy === 'open' ? 'approved' : 'pending';
    create(
      {
        circle_id: circleId,
        title: title.trim(),
        description: description.trim() || undefined,
        date,
        location: location.trim() || undefined,
        max_spots: maxSpots ? parseInt(maxSpots, 10) : null,
        status,
      },
      { onSuccess: onClose }
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-sm bg-card rounded-t-3xl p-6 space-y-4"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 2.5rem)" }}
      >
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-2" />
        <div>
          <h2 className="font-serif text-xl font-medium text-foreground">Propose a gathering</h2>
          {willBePending && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Clock size={11} /> Will be sent to the admin for approval
            </p>
          )}
        </div>

        <div className="space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title"
            maxLength={80}
            className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none"
          />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location (optional)"
            className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={3}
            maxLength={300}
            className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
          />
          <input
            type="number"
            value={maxSpots}
            onChange={(e) => setMaxSpots(e.target.value)}
            placeholder="Max spots (optional)"
            min={1}
            className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!title.trim() || !date || isPending}
          className="w-full py-4 rounded-2xl font-medium text-base shadow-soft transition-all active:scale-[0.98] disabled:opacity-50 text-white"
          style={{ background: CIRCLE_EVENT_COLOR }}
        >
          {isPending ? "Submitting…" : willBePending ? "Submit for review" : "Add gathering"}
        </button>
      </div>
    </div>
  );
}

// ─── Edit cover sheet ─────────────────────────────────────────────────────────

function EditCoverSheet({ circle, onClose }: { circle: AppCircle; onClose: () => void }) {
  const { mutate: updateCover, isPending } = useUpdateCircleCover();
  const [previewUrl, setPreviewUrl] = useState(circle.coverUrl ?? '');
  const [isUploading, setIsUploading] = useState(false);

  async function handlePickPhoto() {
    setIsUploading(true);
    const url = await pickAndUpload(`circles/${circle.id}.jpg`);
    setIsUploading(false);
    if (url) setPreviewUrl(url);
  }

  function handleSave() {
    updateCover(
      { circleId: circle.id, coverUrl: previewUrl || null },
      { onSuccess: onClose }
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-sm bg-card rounded-t-3xl p-6 space-y-4"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 2.5rem)" }}
      >
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-2" />
        <h2 className="font-serif text-xl font-medium text-foreground">Change cover photo</h2>

        {/* Preview */}
        <div className="w-full h-36 rounded-2xl overflow-hidden bg-muted">
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-xs text-muted-foreground">No photo selected</p>
            </div>
          )}
        </div>

        <button
          onClick={handlePickPhoto}
          disabled={isUploading || isPending}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-border bg-muted text-sm font-medium text-foreground disabled:opacity-50"
        >
          <Camera size={16} />
          {isUploading ? "Uploading…" : previewUrl ? "Change photo" : "Choose from camera roll"}
        </button>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl bg-muted text-foreground text-sm font-medium border border-border">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isPending || isUploading}
            className="flex-1 py-3 rounded-2xl gradient-cta text-white text-sm font-medium shadow-soft disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail view ──────────────────────────────────────────────────────────────

function CircleDetail({ circle, onBack }: { circle: AppCircle; onBack: () => void }) {
  const { mutate: join, isPending: isJoining } = useJoinCircle();
  const { mutate: leave, isPending: isLeaving } = useLeaveCircle();
  const { mutate: requestJoin, isPending: isRequesting } = useRequestJoinCircle();
  const { mutate: respond } = useRespondToJoinRequest();
  const { mutate: updatePolicy } = useUpdateCircleEventPolicy();
  const { data: myRequests = [] } = useMyJoinRequests();
  const { data: pendingRequests = [] } = useCircleJoinRequests(circle.isAdmin ? circle.id : null);
  const { data: circleEventsForBadge = [] } = useCircleEvents(circle.isAdmin ? circle.id : null);
  const pendingEventsCount = circleEventsForBadge.filter((e) => e.status === 'pending').length;
  const [activeTab, setActiveTab] = useState<"about" | "chat" | "events" | "requests">("about");
  const [showJoinRequest, setShowJoinRequest] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [showInviteSheet, setShowInviteSheet] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showEditCover, setShowEditCover] = useState(false);
  const [showVerifyGate, setShowVerifyGate] = useState(false);
  const [showVerifyFlow, setShowVerifyFlow] = useState(false);

  const { data: profile } = useProfile();
  const isUnverified = profile?.verification_status !== 'verified';
  const isMember = circle.isMember || circle.isAdmin;

  if (showVerifyFlow) {
    return (
      <VerificationFlow
        onComplete={() => setShowVerifyFlow(false)}
        onSkip={() => setShowVerifyFlow(false)}
      />
    );
  }
  const hasPendingRequest = myRequests.some((r) => r.circle_id === circle.id && r.status === "pending");
  const coverImage = circle.coverUrl || circlePlaceholder(circle.category);

  function handleJoinPress() {
    if (isUnverified) { setShowVerifyGate(true); return; }
    if (circle.isPrivate) { setShowJoinRequest(true); }
    else { join(circle.id); }
  }

  function submitJoinRequest() {
    requestJoin(
      { circleId: circle.id, message: requestMessage.trim() },
      { onSuccess: () => { setShowJoinRequest(false); setRequestMessage(""); } }
    );
  }

  return (
    <div className="mobile-container flex flex-col bg-background pb-24">
      {/* Hero */}
      <div className="relative h-56">
        <img src={coverImage} alt={circle.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
        <button
          onClick={onBack}
          className="absolute top-12 left-4 w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center text-foreground"
        >
          ←
        </button>
        {circle.isAdmin && (
          <button
            onClick={() => setShowEditCover(true)}
            className="absolute top-12 right-4 w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center text-foreground"
          >
            <Camera size={16} />
          </button>
        )}
        <div className="absolute bottom-4 left-4 right-4">
          {circle.category !== "General" && (
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full mb-2 inline-block text-white"
              style={{ background: circle.categoryColor }}
            >
              {circle.category}
            </span>
          )}
          <h2 className="font-serif text-2xl font-medium text-card">{circle.name}</h2>
          <p className="text-xs text-card/70 mt-0.5">
            {circle.city} · {circle.memberCount} {circle.memberCount === 1 ? "member" : "members"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mx-5 mt-4 gap-1 overflow-x-auto">
        {(["about", "chat", ...(isMember ? ["events"] : []), ...(circle.isAdmin ? ["requests"] : [])] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as "about" | "chat" | "events" | "requests")}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab ? "border-primary text-foreground" : "border-transparent text-muted-foreground"
            }`}
          >
            {tab === "chat" && <MessageCircle size={14} />}
            {tab === "events" && <CalendarDays size={14} />}
            {tab === "requests" && <UserPlus size={14} />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === "events" && pendingEventsCount > 0 && (
              <span className="ml-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                {pendingEventsCount}
              </span>
            )}
            {tab === "requests" && pendingRequests.length > 0 && (
              <span className="ml-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                {pendingRequests.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="px-5 py-4 space-y-4">
        {activeTab === "about" ? (
          <>
            <div className="bg-card rounded-2xl p-4 shadow-soft">
              <h3 className="font-serif text-base font-medium text-foreground mb-2">About</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{circle.description}</p>
            </div>

            <div className="bg-card rounded-2xl p-4 shadow-soft">
              <h3 className="font-serif text-base font-medium text-foreground mb-3">Members</h3>
              <div className="flex -space-x-2">
                {Array.from({ length: Math.min(circle.memberCount, 8) }).map((_, i) => (
                  <div key={i} className="w-9 h-9 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-sm">
                    {EMOJIS[i % EMOJIS.length]}
                  </div>
                ))}
                {circle.memberCount > 8 && (
                  <div className="w-9 h-9 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] text-muted-foreground">
                    +{circle.memberCount - 8}
                  </div>
                )}
                {circle.memberCount === 0 && (
                  <p className="text-sm text-muted-foreground">Be the first to join.</p>
                )}
              </div>
            </div>

            {/* Admin: event submission policy toggle */}
            {circle.isAdmin && (
              <div className="bg-card rounded-2xl p-4 shadow-soft">
                <h3 className="font-serif text-base font-medium text-foreground mb-3">Event settings</h3>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-foreground">Members can propose events</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {circle.eventPolicy === 'open'
                        ? "Events post directly without approval"
                        : "Events require your approval first"}
                    </p>
                  </div>
                  <button
                    onClick={() => updatePolicy({ circleId: circle.id, policy: circle.eventPolicy === 'open' ? 'review' : 'open' })}
                    className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 relative ${circle.eventPolicy === 'open' ? "bg-primary" : "bg-border"}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${circle.eventPolicy === 'open' ? "left-6" : "left-1"}`} />
                  </button>
                </div>
              </div>
            )}

            {circle.isPrivate && (
              <div className="bg-card rounded-2xl p-4 shadow-soft flex items-start gap-3">
                <Lock size={16} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">This is a private circle. Only members can see its contents.</p>
              </div>
            )}

            {circle.isAdmin ? (
              <div className="flex gap-2">
                <div className="flex-1 py-3 rounded-2xl bg-secondary text-secondary-foreground font-medium text-sm border border-border text-center flex items-center justify-center">
                  You admin this circle
                </div>
                <button
                  onClick={() => { if (isUnverified) { setShowVerifyGate(true); return; } setShowInviteSheet(true); }}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-2xl gradient-cta text-white text-sm font-medium"
                >
                  <UserPlus size={15} /> Invite
                </button>
              </div>
            ) : circle.isMember ? (
              <button
                onClick={() => leave(circle.id)}
                disabled={isLeaving}
                className="w-full py-4 rounded-2xl bg-secondary text-secondary-foreground font-medium text-base border border-border transition-all active:scale-[0.98] disabled:opacity-60"
              >
                {isLeaving ? "Leaving…" : "Leave circle"}
              </button>
            ) : hasPendingRequest ? (
              <div className="w-full py-4 rounded-2xl bg-muted text-muted-foreground font-medium text-base border border-border text-center">
                Request pending…
              </div>
            ) : (
              <button
                onClick={handleJoinPress}
                disabled={isJoining || isRequesting}
                className="w-full py-4 rounded-2xl gradient-cta text-primary-foreground font-medium text-base shadow-soft transition-all active:scale-[0.98] disabled:opacity-60"
              >
                {isJoining || isRequesting ? "Sending…" : circle.isPrivate ? "Request to join" : "Join circle"}
              </button>
            )}
          </>
        ) : activeTab === "events" ? (
          <EventsTab circle={circle} onCreateEvent={() => {
          if (isUnverified) { setShowVerifyGate(true); return; }
          setShowCreateEvent(true);
        }} />
        ) : activeTab === "requests" ? (
          <div className="space-y-3">
            {pendingRequests.length === 0 ? (
              <div className="bg-card rounded-2xl p-6 shadow-soft text-center">
                <p className="text-sm text-muted-foreground">No pending requests.</p>
              </div>
            ) : pendingRequests.map((req) => (
              <div key={req.id} className="bg-card rounded-2xl p-4 shadow-soft space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm flex-shrink-0">
                    {req.profile?.name?.[0] ?? "?"}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{req.profile?.name ?? "Member"}</p>
                    <p className="text-xs text-muted-foreground">{req.profile?.city ?? ""}</p>
                    {req.profile?.bio && (
                      <p className="text-xs text-muted-foreground mt-1 leading-snug line-clamp-2">{req.profile.bio}</p>
                    )}
                  </div>
                </div>
                {req.message && (
                  <p className="text-sm text-foreground leading-relaxed bg-muted rounded-xl px-3 py-2 italic">"{req.message}"</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => respond({ requestId: req.id, circleId: circle.id, userId: req.user_id, approve: false })}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-border text-muted-foreground text-sm font-medium"
                  >
                    <X size={14} /> Decline
                  </button>
                  <button
                    onClick={() => respond({ requestId: req.id, circleId: circle.id, userId: req.user_id, approve: true })}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl gradient-cta text-white text-sm font-medium"
                  >
                    <Check size={14} /> Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ChatPanel circleId={circle.id} isMember={isMember} />
        )}
      </div>

      {/* Edit cover sheet */}
      {showEditCover && (
        <EditCoverSheet circle={circle} onClose={() => setShowEditCover(false)} />
      )}

      {/* Create event sheet */}
      {showCreateEvent && (
        <CreateCircleEventSheet
          circleId={circle.id}
          isAdmin={circle.isAdmin}
          eventPolicy={circle.eventPolicy}
          onClose={() => setShowCreateEvent(false)}
        />
      )}

      {/* Invite sheet */}
      {showInviteSheet && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowInviteSheet(false)} />
          <div className="relative w-full max-w-sm bg-card rounded-t-3xl p-6 space-y-4" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 2.5rem)" }}>
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-2" />
            <h2 className="font-serif text-xl font-medium text-foreground">Invite to circle</h2>
            <p className="text-sm text-muted-foreground">Share this link to invite members directly.</p>
            <div className="flex items-center gap-2 bg-muted rounded-xl px-4 py-3">
              <p className="text-sm text-foreground flex-1 truncate">nomaya.app/circles/{circle.id}</p>
              <button onClick={() => navigator.clipboard?.writeText(`https://nomaya.app/circles/${circle.id}`)} className="text-xs font-medium text-primary flex-shrink-0">
                Copy
              </button>
            </div>
            <button
              onClick={() => {
                const url = `https://nomaya.app/circles/${circle.id}`;
                const text = `Join me in the ${circle.name} circle on Nomaya!`;
                if (navigator.share) { navigator.share({ title: circle.name, text, url }); }
                else { navigator.clipboard?.writeText(`${text}\n${url}`); }
                setShowInviteSheet(false);
              }}
              className="w-full py-3.5 rounded-2xl gradient-cta text-white font-medium text-sm"
            >
              Share invite link
            </button>
          </div>
        </div>
      )}

      {/* Verification gate */}
      {showVerifyGate && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowVerifyGate(false)} />
          <div
            className="relative w-full max-w-sm bg-card rounded-t-3xl p-6 space-y-4"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 2.5rem)" }}
          >
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-2" />
            <div className="flex flex-col items-center text-center gap-3 py-2">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <Shield size={28} className="text-primary-foreground" />
              </div>
              <h2 className="font-serif text-xl font-medium text-foreground">Verification required</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Nomaya circles are a verified community for women. Verify your identity to join, chat, and propose events.
              </p>
            </div>
            <button
              onClick={() => { setShowVerifyGate(false); setShowVerifyFlow(true); }}
              className="w-full py-4 rounded-2xl gradient-cta text-white font-medium text-base shadow-soft"
            >
              Verify my identity
            </button>
            <button
              onClick={() => setShowVerifyGate(false)}
              className="w-full py-2 text-sm text-muted-foreground text-center"
            >
              Not now
            </button>
          </div>
        </div>
      )}

      {/* Join request sheet */}
      {showJoinRequest && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowJoinRequest(false)} />
          <div className="relative w-full max-w-sm bg-card rounded-t-3xl p-6 space-y-4" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 2.5rem)" }}>
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-2" />
            <div>
              <h2 className="font-serif text-xl font-medium text-foreground">Request to join</h2>
              <p className="text-sm text-muted-foreground mt-1">This is a private circle. Tell the admin a bit about yourself.</p>
            </div>
            <textarea
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              placeholder="Hi! I'd love to join because…"
              rows={4}
              maxLength={300}
              className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowJoinRequest(false)} className="flex-1 py-3 rounded-2xl bg-muted text-foreground text-sm font-medium border border-border">
                Cancel
              </button>
              <button
                onClick={submitJoinRequest}
                disabled={isRequesting}
                className="flex-1 py-3 rounded-2xl gradient-cta text-primary-foreground text-sm font-medium shadow-soft disabled:opacity-50"
              >
                {isRequesting ? "Sending…" : "Send request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Create circle sheet ──────────────────────────────────────────────────────

function CreateCircleSheet({ onClose }: { onClose: () => void }) {
  const { mutate: create, isPending } = useCreateCircle();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("Madrid");
  const [coverUrl, setCoverUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);

  async function handlePickCover() {
    setIsUploading(true);
    const url = await pickAndUpload(`circles/cover-${Date.now()}.jpg`);
    setIsUploading(false);
    if (url) setCoverUrl(url);
  }

  function handleSubmit() {
    if (!name.trim()) return;
    create(
      { name: name.trim(), description: description.trim(), city: city.trim(), cover_url: coverUrl || null, is_private: isPrivate },
      { onSuccess: onClose }
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-card rounded-t-3xl p-6 pb-10 space-y-4">
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-2" />
        <h2 className="font-serif text-xl font-medium text-foreground">New circle</h2>

        {/* Cover image picker */}
        {coverUrl ? (
          <div className="relative w-full h-32 rounded-2xl overflow-hidden">
            <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
            <button onClick={() => setCoverUrl("")} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center">
              <X size={12} className="text-white" />
            </button>
          </div>
        ) : null}
        <button
          onClick={handlePickCover}
          disabled={isUploading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-border bg-muted text-sm text-muted-foreground disabled:opacity-50"
        >
          <Camera size={15} />
          {isUploading ? "Uploading…" : coverUrl ? "Change cover photo" : "Add cover photo"}
        </button>

        <div className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Circle name"
            maxLength={60}
            className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this circle about?"
            rows={3}
            maxLength={280}
            className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
          />
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
            className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>

        <button onClick={() => setIsPrivate((p) => !p)} className="flex items-center gap-3 w-full">
          <div className={`w-10 h-6 rounded-full transition-colors ${isPrivate ? "bg-primary" : "bg-border"} relative`}>
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${isPrivate ? "left-5" : "left-1"}`} />
          </div>
          <span className="text-sm text-foreground">Private circle</span>
        </button>

        <button
          onClick={handleSubmit}
          disabled={!name.trim() || isPending}
          className="w-full py-4 rounded-2xl gradient-cta text-primary-foreground font-medium text-base shadow-soft transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {isPending ? "Creating…" : "Create circle"}
        </button>
      </div>
    </div>
  );
}

// ─── Circle card ──────────────────────────────────────────────────────────────

function CircleCard({ circle, onClick, dimmed = false }: { circle: AppCircle; onClick: () => void; dimmed?: boolean }) {
  const image = circle.coverUrl || circlePlaceholder(circle.category);
  return (
    <button
      onClick={onClick}
      className={`w-full bg-card rounded-2xl overflow-hidden shadow-soft flex text-left transition-all active:scale-[0.98] ${dimmed ? "opacity-70" : ""}`}
    >
      <div className="w-20 flex-shrink-0 relative">
        <img
          src={image}
          alt={circle.name}
          className={`w-full h-full object-cover ${dimmed ? "grayscale" : ""}`}
          style={{ minHeight: 80 }}
        />
        {dimmed && (
          <div className="absolute inset-0 flex items-center justify-center bg-foreground/20">
            <Lock size={14} className="text-card" />
          </div>
        )}
      </div>
      <div className="flex-1 px-4 py-3.5 flex flex-col justify-between">
        <div>
          <h3 className="font-serif text-base font-medium text-foreground">{circle.name}</h3>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
            <Users size={11} />
            {circle.memberCount} {circle.memberCount === 1 ? "member" : "members"}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{circle.city}</p>
      </div>
      <div className="flex items-center pr-3">
        <ChevronRight size={16} className="text-muted-foreground" />
      </div>
    </button>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

interface CirclesScreenProps { initialCircleId?: string; }

export function CirclesScreen({ initialCircleId }: CirclesScreenProps) {
  const [selectedId, setSelectedId] = useState<string | null>(initialCircleId ?? null);
  const [showCreate, setShowCreate] = useState(false);
  const [showVerifyGate, setShowVerifyGate] = useState(false);
  const { data: circles = [], isLoading } = useCircles();
  const { data: profile } = useProfile();
  const isUnverified = profile?.verification_status !== 'verified';

  if (selectedId) {
    const circle = circles.find((c) => c.id === selectedId);
    if (!circle) return null;
    return <CircleDetail circle={circle} onBack={() => setSelectedId(null)} />;
  }

  const myCircles = circles.filter((c) => c.isMember || c.isAdmin);
  const discover = circles.filter((c) => !c.isMember && !c.isAdmin);

  return (
    <div className="mobile-container flex flex-col bg-background pb-24">
      <div className="px-5 pt-14 pb-4">
        <div className="flex justify-end mb-1">
          <button onClick={() => { if (isUnverified) { setShowVerifyGate(true); return; } setShowCreate(true); }} className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-soft">
            <Plus size={18} className="text-primary-foreground" />
          </button>
        </div>
        <div className="text-center">
          <Logo />
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Your community</p>
          <h1 className="font-serif text-4xl font-normal text-foreground tracking-display">Circles</h1>
        </div>
      </div>

      <div className="mx-5 mb-5 bg-secondary rounded-2xl p-4 border border-border">
        <p className="text-sm text-muted-foreground leading-relaxed">
          ✦ Circles are intimate groups built around shared interests. Join one or start your own.
        </p>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading circles…</p>
        </div>
      ) : (
        <>
          {myCircles.length > 0 && (
            <div className="px-5 mb-6">
              <h2 className="font-serif text-lg font-medium text-foreground mb-3">My circles</h2>
              <div className="space-y-3">
                {myCircles.map((circle) => (
                  <CircleCard key={circle.id} circle={circle} onClick={() => setSelectedId(circle.id)} />
                ))}
              </div>
            </div>
          )}
          {discover.length > 0 && (
            <div className="px-5">
              <h2 className="font-serif text-lg font-medium text-foreground mb-1">Discover circles</h2>
              <p className="text-xs text-muted-foreground mb-3">Open circles you can join now.</p>
              <div className="space-y-3">
                {discover.map((circle) => (
                  <CircleCard key={circle.id} circle={circle} onClick={() => setSelectedId(circle.id)} dimmed={circle.isPrivate} />
                ))}
              </div>
            </div>
          )}
          {circles.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center px-10 gap-3">
              <Users size={36} className="text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground text-center leading-relaxed">No circles yet. Be the first to create one.</p>
            </div>
          )}
        </>
      )}

      {showCreate && <CreateCircleSheet onClose={() => setShowCreate(false)} />}

      {/* Verification gate for creating circles */}
      {showVerifyGate && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowVerifyGate(false)} />
          <div
            className="relative w-full max-w-sm bg-card rounded-t-3xl p-6 space-y-4"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 2.5rem)" }}
          >
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-2" />
            <div className="flex flex-col items-center text-center gap-3 py-2">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <Shield size={28} className="text-primary-foreground" />
              </div>
              <h2 className="font-serif text-xl font-medium text-foreground">Verification required</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Nomaya circles are a verified community for women. Verify your identity to create and join circles.
              </p>
            </div>
            <button
              onClick={() => setShowVerifyGate(false)}
              className="w-full py-2 text-sm text-muted-foreground text-center"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
