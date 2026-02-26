import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthScreen } from "@/components/AuthScreen";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { BottomNav } from "@/components/BottomNav";
import { EventsScreen } from "@/components/EventsScreen";
import { MapScreen } from "@/components/MapScreen";
import { CirclesScreen } from "@/components/CirclesScreen";
import { ProfileScreen } from "@/components/ProfileScreen";
import { usePushNotifications, type NotificationDestination } from "@/hooks/usePushNotifications";

type Tab = "events" | "map" | "groups" | "profile";

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-muted-foreground text-sm tracking-wide">Loading…</div>
    </div>
  );
}

function AppShell() {
  const { session, loading: authLoading, signOut } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const [activeTab, setActiveTab] = useState<Tab>("events");
  const [openCircleId, setOpenCircleId] = useState<string | undefined>(undefined);

  function handlePushNavigate(dest: NotificationDestination) {
    if (dest.tab === 'groups' && 'circleId' in dest && dest.circleId) {
      setOpenCircleId(dest.circleId);
    } else if (dest.tab !== 'groups') {
      setOpenCircleId(undefined);
    }
    setActiveTab(dest.tab);
  }

  usePushNotifications(handlePushNavigate);

  if (authLoading) return <LoadingScreen />;
  if (!session) return <AuthScreen />;
  if (profileLoading) return <LoadingScreen />;

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <OnboardingFlow onComplete={() => {}} />
      </div>
    );
  }

  function handleOpenCircle(id: string) {
    setOpenCircleId(id);
    setActiveTab("groups");
  }

  function handleTabChange(tab: Tab) {
    if (tab !== "groups") setOpenCircleId(undefined);
    setActiveTab(tab);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="mobile-container relative overflow-hidden">
        {activeTab === "events" && <EventsScreen onOpenCircle={handleOpenCircle} />}
        {activeTab === "map" && <MapScreen />}
        {activeTab === "groups" && <CirclesScreen initialCircleId={openCircleId} />}
        {activeTab === "profile" && (
          <ProfileScreen onLogout={signOut} onOpenCircle={handleOpenCircle} />
        )}
        <BottomNav active={activeTab} onChange={handleTabChange} />
      </div>
    </div>
  );
}

const Index = () => (
  <LanguageProvider>
    <AppShell />
  </LanguageProvider>
);

export default Index;
