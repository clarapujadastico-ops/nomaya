import { useState } from "react";
import { Users, Calendar, ChevronRight, Lock } from "lucide-react";
import { GROUPS, EVENTS } from "@/data/mockData";

export function GroupsScreen() {
  const [selected, setSelected] = useState<string | null>(null);

  const myGroups = GROUPS.filter((g) => g.joined);
  const discoverable = GROUPS.filter((g) => !g.joined);

  if (selected) {
    const group = GROUPS.find((g) => g.id === selected)!;
    return (
      <div className="mobile-container flex flex-col bg-background pb-24">
        {/* Hero */}
        <div className="relative h-56">
          <img src={group.image} alt={group.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
          <button
            onClick={() => setSelected(null)}
            className="absolute top-12 left-4 w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center text-foreground"
          >
            ←
          </button>
          <div className="absolute bottom-4 left-4 right-4">
            <h2 className="font-serif text-2xl font-medium text-card">{group.name}</h2>
            <p className="text-xs text-card/70 mt-0.5">{group.members} members</p>
          </div>
        </div>

        {/* Members */}
        <div className="px-5 py-5">
          <div className="bg-card rounded-2xl p-4 shadow-soft mb-4">
            <h3 className="font-serif text-base font-medium text-foreground mb-3">Members</h3>
            <div className="flex -space-x-2">
              {Array.from({ length: group.members }).map((_, i) => (
                <div
                  key={i}
                  className="w-9 h-9 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-sm"
                >
                  {["🌸", "🌿", "✨", "🎨", "🌊", "🍀", "🦋", "🌺", "💫", "🍃", "🌙", "🎋"][i % 12]}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-2xl p-4 shadow-soft mb-4">
            <h3 className="font-serif text-base font-medium text-foreground mb-3">Events together</h3>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                <Calendar size={14} className="text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Last: {group.lastEvent}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-secondary rounded-xl border border-border">
                <Calendar size={14} className="text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Next: {group.nextEvent}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Private messaging note */}
          <div className="bg-card rounded-2xl p-4 shadow-soft flex items-start gap-3 mb-4">
            <Lock size={16} className="text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Group conversations are only accessible after attending a shared event. This keeps the space safe and intentional.
            </p>
          </div>

          {group.joined ? (
            <button className="w-full py-4 rounded-2xl gradient-cta text-primary-foreground font-medium text-base shadow-soft">
              View upcoming event →
            </button>
          ) : (
            <button className="w-full py-4 rounded-2xl bg-secondary text-secondary-foreground font-medium text-base border border-border">
              Attend an event to join
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container flex flex-col bg-background pb-24">
      {/* Header */}
      <div className="px-5 pt-14 pb-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Your community</p>
        <h1 className="font-serif text-4xl font-normal text-foreground tracking-display">Circles</h1>
      </div>

      {/* Intro note */}
      <div className="mx-5 mb-5 bg-secondary rounded-2xl p-4 border border-border">
        <p className="text-sm text-muted-foreground leading-relaxed">
          ✦ Circles form naturally after shared events. Attend an experience to begin building yours.
        </p>
      </div>

      {/* My circles */}
      <div className="px-5 mb-6">
        <h2 className="font-serif text-lg font-medium text-foreground mb-3">My circles</h2>
        <div className="space-y-3">
          {myGroups.map((group) => (
            <button
              key={group.id}
              onClick={() => setSelected(group.id)}
              className="w-full bg-card rounded-2xl overflow-hidden shadow-soft flex gap-0 text-left transition-all active:scale-[0.98]"
            >
              <div className="w-20 flex-shrink-0">
                <img src={group.image} alt={group.name} className="w-full h-full object-cover" style={{ minHeight: 80 }} />
              </div>
              <div className="flex-1 px-4 py-3.5 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-base font-medium text-foreground">{group.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <Users size={11} />
                    {group.members} members
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Next: {group.nextEvent}
                </p>
              </div>
              <div className="flex items-center pr-3">
                <ChevronRight size={16} className="text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Discoverable */}
      <div className="px-5">
        <h2 className="font-serif text-lg font-medium text-foreground mb-1">Discover circles</h2>
        <p className="text-xs text-muted-foreground mb-3">
          Attend an event to gain access to these groups.
        </p>
        <div className="space-y-3">
          {discoverable.map((group) => (
            <button
              key={group.id}
              onClick={() => setSelected(group.id)}
              className="w-full bg-card rounded-2xl overflow-hidden shadow-soft flex gap-0 text-left opacity-70 transition-all active:scale-[0.98]"
            >
              <div className="w-20 flex-shrink-0 relative">
                <img src={group.image} alt={group.name} className="w-full h-full object-cover grayscale" style={{ minHeight: 80 }} />
                <div className="absolute inset-0 flex items-center justify-center bg-foreground/20">
                  <Lock size={14} className="text-card" />
                </div>
              </div>
              <div className="flex-1 px-4 py-3.5">
                <h3 className="font-serif text-base font-medium text-foreground">{group.name}</h3>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                  <Users size={11} />
                  {group.members} members
                </div>
                <p className="text-xs text-muted-foreground mt-1">Attend an event to join</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
