import { useState, useRef, useEffect } from "react";
import { Users, Plus, ChevronRight, Lock, Send, MessageCircle } from "lucide-react";
import { useCircles, useJoinCircle, useLeaveCircle, useCreateCircle } from "@/hooks/useCircles";
import { useCircleMessages, useSendMessage } from "@/hooks/useCircleMessages";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "./Logo";
import type { AppCircle } from "@/types/database";

const EMOJIS = ["🌸", "🌿", "✨", "🎨", "🌊", "🍀", "🦋", "🌺", "💫", "🍃", "🌙", "🎋"];

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
      {/* Messages */}
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
              {/* Avatar */}
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
                <div
                  className={`px-3 py-2 rounded-2xl text-sm leading-snug ${
                    isOwn ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted text-foreground rounded-tl-sm"
                  }`}
                >
                  {msg.content}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 px-1">{time}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
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

// ─── Detail view ──────────────────────────────────────────────────────────────

function CircleDetail({
  circle,
  onBack,
}: {
  circle: AppCircle;
  onBack: () => void;
}) {
  const { mutate: join, isPending: isJoining } = useJoinCircle();
  const { mutate: leave, isPending: isLeaving } = useLeaveCircle();
  const [activeTab, setActiveTab] = useState<"about" | "chat">("about");

  const isMember = circle.isMember || circle.isAdmin;

  return (
    <div className="mobile-container flex flex-col bg-background pb-24">
      {/* Hero */}
      <div className="relative h-56">
        {circle.coverUrl ? (
          <img src={circle.coverUrl} alt={circle.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{ background: circle.categoryColor }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
        <button
          onClick={onBack}
          className="absolute top-12 left-4 w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center text-foreground"
        >
          ←
        </button>
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
      <div className="flex border-b border-border mx-5 mt-4 gap-1">
        {(["about", "chat"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-all border-b-2 ${
              activeTab === tab
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground"
            }`}
          >
            {tab === "chat" && <MessageCircle size={14} />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="px-5 py-4 space-y-4">
        {activeTab === "about" ? (
          <>
            {/* About */}
            <div className="bg-card rounded-2xl p-4 shadow-soft">
              <h3 className="font-serif text-base font-medium text-foreground mb-2">About</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{circle.description}</p>
            </div>

            {/* Members */}
            <div className="bg-card rounded-2xl p-4 shadow-soft">
              <h3 className="font-serif text-base font-medium text-foreground mb-3">Members</h3>
              <div className="flex -space-x-2">
                {Array.from({ length: Math.min(circle.memberCount, 8) }).map((_, i) => (
                  <div
                    key={i}
                    className="w-9 h-9 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-sm"
                  >
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

            {/* Private note */}
            {circle.isPrivate && (
              <div className="bg-card rounded-2xl p-4 shadow-soft flex items-start gap-3">
                <Lock size={16} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  This is a private circle. Only members can see its contents.
                </p>
              </div>
            )}

            {/* Action */}
            {circle.isAdmin ? (
              <div className="w-full py-4 rounded-2xl bg-secondary text-secondary-foreground font-medium text-base border border-border text-center">
                You admin this circle
              </div>
            ) : circle.isMember ? (
              <button
                onClick={() => leave(circle.id)}
                disabled={isLeaving}
                className="w-full py-4 rounded-2xl bg-secondary text-secondary-foreground font-medium text-base border border-border transition-all active:scale-[0.98] disabled:opacity-60"
              >
                {isLeaving ? "Leaving…" : "Leave circle"}
              </button>
            ) : (
              <button
                onClick={() => join(circle.id)}
                disabled={isJoining}
                className="w-full py-4 rounded-2xl gradient-cta text-primary-foreground font-medium text-base shadow-soft transition-all active:scale-[0.98] disabled:opacity-60"
              >
                {isJoining ? "Joining…" : "Join circle"}
              </button>
            )}
          </>
        ) : (
          <ChatPanel circleId={circle.id} isMember={isMember} />
        )}
      </div>
    </div>
  );
}

// ─── Create form ──────────────────────────────────────────────────────────────

function CreateCircleSheet({ onClose }: { onClose: () => void }) {
  const { mutate: create, isPending } = useCreateCircle();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("Madrid");
  const [isPrivate, setIsPrivate] = useState(false);

  function handleSubmit() {
    if (!name.trim()) return;
    create(
      { name: name.trim(), description: description.trim(), city: city.trim(), is_private: isPrivate },
      { onSuccess: onClose }
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-card rounded-t-3xl p-6 pb-10 space-y-4">
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-2" />
        <h2 className="font-serif text-xl font-medium text-foreground">New circle</h2>

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

        <button
          onClick={() => setIsPrivate((p) => !p)}
          className="flex items-center gap-3 w-full"
        >
          <div
            className={`w-10 h-6 rounded-full transition-colors ${isPrivate ? "bg-primary" : "bg-border"} relative`}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${isPrivate ? "left-5" : "left-1"}`}
            />
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

function CircleCard({
  circle,
  onClick,
  dimmed = false,
}: {
  circle: AppCircle;
  onClick: () => void;
  dimmed?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full bg-card rounded-2xl overflow-hidden shadow-soft flex text-left transition-all active:scale-[0.98] ${dimmed ? "opacity-70" : ""}`}
    >
      <div className="w-20 flex-shrink-0 relative">
        {circle.coverUrl ? (
          <img
            src={circle.coverUrl}
            alt={circle.name}
            className={`w-full h-full object-cover ${dimmed ? "grayscale" : ""}`}
            style={{ minHeight: 80 }}
          />
        ) : (
          <div
            className="w-full h-full"
            style={{ minHeight: 80, background: circle.categoryColor, opacity: dimmed ? 0.5 : 1 }}
          />
        )}
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

interface CirclesScreenProps {
  initialCircleId?: string;
}

export function CirclesScreen({ initialCircleId }: CirclesScreenProps) {
  const [selectedId, setSelectedId] = useState<string | null>(initialCircleId ?? null);
  const [showCreate, setShowCreate] = useState(false);
  const { data: circles = [], isLoading } = useCircles();

  if (selectedId) {
    const circle = circles.find((c) => c.id === selectedId);
    if (!circle) return null;
    return <CircleDetail circle={circle} onBack={() => setSelectedId(null)} />;
  }

  const myCircles = circles.filter((c) => c.isMember || c.isAdmin);
  const discover = circles.filter((c) => !c.isMember && !c.isAdmin);

  return (
    <div className="mobile-container flex flex-col bg-background pb-24">
      {/* Header */}
      <div className="px-5 pt-14 pb-4">
        <div className="flex justify-end mb-1">
          <button
            onClick={() => setShowCreate(true)}
            className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-soft"
          >
            <Plus size={18} className="text-primary-foreground" />
          </button>
        </div>
        <div className="text-center">
          <Logo />
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Your community</p>
          <h1 className="font-serif text-4xl font-normal text-foreground tracking-display">Circles</h1>
        </div>
      </div>

      {/* Intro note */}
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
          {/* My circles */}
          {myCircles.length > 0 && (
            <div className="px-5 mb-6">
              <h2 className="font-serif text-lg font-medium text-foreground mb-3">My circles</h2>
              <div className="space-y-3">
                {myCircles.map((circle) => (
                  <CircleCard
                    key={circle.id}
                    circle={circle}
                    onClick={() => setSelectedId(circle.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Discover */}
          {discover.length > 0 && (
            <div className="px-5">
              <h2 className="font-serif text-lg font-medium text-foreground mb-1">Discover circles</h2>
              <p className="text-xs text-muted-foreground mb-3">Open circles you can join now.</p>
              <div className="space-y-3">
                {discover.map((circle) => (
                  <CircleCard
                    key={circle.id}
                    circle={circle}
                    onClick={() => setSelectedId(circle.id)}
                    dimmed={circle.isPrivate}
                  />
                ))}
              </div>
            </div>
          )}

          {circles.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center px-10 gap-3">
              <Users size={36} className="text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground text-center leading-relaxed">
                No circles yet. Be the first to create one.
              </p>
            </div>
          )}
        </>
      )}

      {showCreate && <CreateCircleSheet onClose={() => setShowCreate(false)} />}
    </div>
  );
}
