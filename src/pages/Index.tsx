import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { AuthScreen } from "@/components/AuthScreen";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { BottomNav } from "@/components/BottomNav";
import { EventsScreen } from "@/components/EventsScreen";
import { MapScreen } from "@/components/MapScreen";
import { CirclesScreen } from "@/components/CirclesScreen";
import { ProfileScreen } from "@/components/ProfileScreen";

type Tab = "events" | "map" | "groups" | "profile";

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-foreground/10 flex items-center justify-center">
      <div className="text-muted-foreground text-sm tracking-wide">Loading…</div>
    </div>
  );
}

const Index = () => {
  const { session, loading: authLoading, signOut } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const [activeTab, setActiveTab] = useState<Tab>("events");

  if (authLoading) return <LoadingScreen />;
  if (!session) return <AuthScreen />;
  if (profileLoading) return <LoadingScreen />;

  if (!profile) {
    return (
      <div className="min-h-screen bg-foreground/10 flex items-center justify-center">
        <OnboardingFlow onComplete={() => {}} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-foreground/10 flex items-center justify-center">
      <div className="mobile-container relative overflow-hidden">
        {activeTab === "events" && <EventsScreen />}
        {activeTab === "map" && <MapScreen />}
        {activeTab === "groups" && <CirclesScreen />}
        {activeTab === "profile" && <ProfileScreen onLogout={signOut} />}
        <BottomNav active={activeTab} onChange={setActiveTab} />
      </div>
    </div>
  );
};

export default Index;
