import { useState, useEffect } from "react";
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

  // Determine ONCE whether onboarding is needed.
  // We intentionally do NOT re-evaluate when profile updates mid-onboarding
  // so that saving the profile step doesn't unmount the verify step.
  const [inOnboarding, setInOnboarding] = useState<boolean | null>(null);
  useEffect(() => {
    if (!authLoading && !profileLoading && session && inOnboarding === null) {
      setInOnboarding(!profile);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, profileLoading, session]);

  function handlePushNavigate(dest: NotificationDestination) {
    if (dest.tab === 'groups' && 'circleId' in dest && dest.circleId) {
      setOpenCircleId(dest.circleId);
    } else if (dest.tab !== 'groups') {
      setOpenCircleId(undefined);
    }
    setActiveTab(dest.tab);
  }

  usePushNotifications(handlePushNavigate);

  function handleOpenCircle(id: string) {
    setOpenCircleId(id);
    setActiveTab("groups");
  }

  function handleTabChange(tab: Tab) {
    if (tab !== "groups") setOpenCircleId(undefined);
    setActiveTab(tab);
  }

  if (authLoading) return <LoadingScreen />;
  if (!session) return <AuthScreen />;
  if (profileLoading || inOnboarding === null) return <LoadingScreen />;
  if (inOnboarding) return <OnboardingFlow onComplete={() => setInOnboarding(false)} />;

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
