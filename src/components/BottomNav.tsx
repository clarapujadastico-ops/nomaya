import { Calendar, Map, Users, User } from "lucide-react";

type Tab = "events" | "map" | "groups" | "profile";

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const tabs = [
  { id: "events" as Tab, label: "Events", icon: Calendar },
  { id: "map" as Tab, label: "Map", icon: Map },
  { id: "groups" as Tab, label: "Circles", icon: Users },
  { id: "profile" as Tab, label: "Profile", icon: User },
];

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-card border-t border-border flex items-center justify-around px-2 pb-safe z-50"
      style={{ boxShadow: "0 -4px 20px hsl(252 30% 30% / 0.15)" }}>
      {tabs.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex flex-col items-center gap-0.5 py-3 px-4 relative transition-all duration-200 border-t-2 ${
              isActive ? "border-primary" : "border-transparent"
            }`}
          >
            <Icon
              size={22}
              className={isActive ? "text-primary" : "text-muted-foreground"}
              strokeWidth={isActive ? 2 : 1.5}
            />
            <span
              className={`text-[10px] font-medium tracking-wide transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
