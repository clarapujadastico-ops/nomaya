import { Calendar, Sparkles, Users, User } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";

type Tab = "events" | "community" | "groups" | "profile";

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const tabs: { id: Tab; labelKey: string; icon: typeof Calendar }[] = [
  { id: "events",    labelKey: "nav.events",    icon: Calendar },
  { id: "community", labelKey: "nav.community", icon: Sparkles },
  { id: "groups",    labelKey: "nav.circles",   icon: Users },
  { id: "profile",   labelKey: "nav.profile",   icon: User },
];

export function BottomNav({ active, onChange }: BottomNavProps) {
  const { t } = useLang();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 w-full bg-card border-t border-border flex items-center justify-around px-2 z-[200]"
      style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 0px))' }}
      style={{ boxShadow: "0 -4px 20px hsl(252 30% 30% / 0.15)" }}
    >
      {tabs.map(({ id, labelKey, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex flex-col items-center gap-0.5 py-3 px-2 relative transition-all duration-200 border-t-2 ${
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
              {t(labelKey)}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
