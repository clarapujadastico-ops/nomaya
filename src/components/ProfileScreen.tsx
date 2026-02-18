import { ChevronRight, Globe, Bell, Heart, Star, LogOut } from "lucide-react";
import { EVENTS, GROUPS } from "@/data/mockData";

interface ProfileScreenProps {
  onLogout?: () => void;
}

export function ProfileScreen({ onLogout }: ProfileScreenProps) {
  const attended = EVENTS.slice(0, 3);
  const myGroups = GROUPS.filter((g) => g.joined);

  const settingsItems = [
    { icon: Globe, label: "Language", value: "English" },
    { icon: Bell, label: "Notifications", value: "On" },
    { icon: Heart, label: "My interests", value: "6 selected" },
    { icon: Star, label: "Referrals", value: "Invite friends" },
  ];

  return (
    <div className="mobile-container flex flex-col bg-background pb-24">
      {/* Header */}
      <div className="px-5 pt-14 pb-2">
        <h1 className="font-serif text-4xl font-normal text-foreground tracking-display">Profile</h1>
      </div>

      {/* Profile card */}
      <div className="mx-5 mt-4 bg-card rounded-2xl p-5 shadow-card">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-secondary border-2 border-border flex items-center justify-center text-2xl flex-shrink-0">
            🌸
          </div>
          <div className="flex-1">
            <h2 className="font-serif text-xl font-medium text-foreground">Sofia M.</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Barcelona · Member since Feb 2026</p>
            <p className="text-sm text-muted-foreground mt-1 leading-snug">
              Designer. Ceramics enthusiast. Dog mum.
            </p>
          </div>
        </div>

        <div className="flex gap-4 mt-4 pt-4 border-t border-border">
          <div className="flex-1 text-center">
            <p className="font-serif text-2xl font-medium text-foreground">5</p>
            <p className="text-xs text-muted-foreground mt-0.5">Events</p>
          </div>
          <div className="w-px bg-border" />
          <div className="flex-1 text-center">
            <p className="font-serif text-2xl font-medium text-foreground">2</p>
            <p className="text-xs text-muted-foreground mt-0.5">Circles</p>
          </div>
          <div className="w-px bg-border" />
          <div className="flex-1 text-center">
            <p className="font-serif text-2xl font-medium text-foreground">18</p>
            <p className="text-xs text-muted-foreground mt-0.5">Connections</p>
          </div>
        </div>
      </div>

      {/* Past events */}
      <div className="px-5 mt-5">
        <h2 className="font-serif text-lg font-medium text-foreground mb-3">Events attended</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {attended.map((event) => (
            <div
              key={event.id}
              className="flex-shrink-0 w-32 rounded-xl overflow-hidden shadow-soft"
            >
              <div className="h-20 relative">
                <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-foreground/30" />
                <span className="absolute bottom-1.5 left-2 text-[9px] uppercase tracking-wider text-card font-medium">
                  {event.date}
                </span>
              </div>
              <div className="bg-card px-2.5 py-2">
                <p className="text-xs font-medium text-foreground leading-snug line-clamp-2">{event.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* My circles */}
      <div className="px-5 mt-5">
        <h2 className="font-serif text-lg font-medium text-foreground mb-3">My circles</h2>
        <div className="flex gap-3">
          {myGroups.map((group) => (
            <div key={group.id} className="flex-1 bg-card rounded-xl p-3 shadow-soft text-center">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg mx-auto mb-1.5">
                🎨
              </div>
              <p className="text-xs font-medium text-foreground leading-tight">{group.name}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{group.members} members</p>
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="px-5 mt-5">
        <h2 className="font-serif text-lg font-medium text-foreground mb-3">Settings</h2>
        <div className="bg-card rounded-2xl overflow-hidden shadow-soft">
          {settingsItems.map(({ icon: Icon, label, value }, i) => (
            <button
              key={label}
              className={`w-full flex items-center justify-between px-4 py-4 text-left transition-all ${
                i < settingsItems.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={16} className="text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{value}</span>
                <ChevronRight size={14} className="text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="px-5 mt-4">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-border text-muted-foreground text-sm font-medium bg-card shadow-soft"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </div>
  );
}
