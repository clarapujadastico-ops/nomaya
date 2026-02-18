import { useState } from "react";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { BottomNav } from "@/components/BottomNav";
import { EventsScreen } from "@/components/EventsScreen";
import { MapScreen } from "@/components/MapScreen";
import { GroupsScreen } from "@/components/GroupsScreen";
import { ProfileScreen } from "@/components/ProfileScreen";

type Tab = "events" | "map" | "groups" | "profile";

const Index = () => {
  const [onboarded, setOnboarded] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("events");

  if (!onboarded) {
    return (
      <div className="min-h-screen bg-foreground/10 flex items-center justify-center">
        <OnboardingFlow onComplete={() => setOnboarded(true)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-foreground/10 flex items-center justify-center">
      <div className="mobile-container relative overflow-hidden">
        {activeTab === "events" && <EventsScreen />}
        {activeTab === "map" && <MapScreen />}
        {activeTab === "groups" && <GroupsScreen />}
        {activeTab === "profile" && (
          <ProfileScreen onLogout={() => setOnboarded(false)} />
        )}
        <BottomNav active={activeTab} onChange={setActiveTab} />
      </div>
    </div>
  );
};

export default Index;
