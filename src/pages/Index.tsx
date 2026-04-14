import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthScreen } from "@/components/AuthScreen";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { BottomNav } from "@/components/BottomNav";
import { EventsScreen } from "@/components/EventsScreen";
import { GrowScreen } from "@/components/GrowScreen";
import { RewardsScreen } from "@/components/RewardsScreen";
import { CirclesScreen } from "@/components/CirclesScreen";
import { ProfileScreen } from "@/components/ProfileScreen";
import { BookingsScreen } from "@/components/BookingsScreen";
import { usePushNotifications, type NotificationDestination } from "@/hooks/usePushNotifications";

type Tab = "events" | "community" | "groups" | "rewards" | "profile";

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
  const [openCircleTab, setOpenCircleTab] = useState<'chat' | 'about' | undefined>(undefined);
  const [showAllBookings, setShowAllBookings] = useState(false);

  // Determine ONCE whether onboarding is needed.
  // We intentionally do NOT re-evaluate when profile updates mid-onboarding
  // so that saving the profile step doesn't unmount the verify step.
  const [inOnboarding, setInOnboarding] = useState<boolean | null>(null);
  useEffect(() => {
    if (!authLoading && !profileLoading && session && inOnboarding === null) {
      setInOnboarding(!profile?.name);
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

  function handleOpenCircle(id: string, tab?: 'chat' | 'about') {
    setOpenCircleId(id);
    setOpenCircleTab(tab);
    setActiveTab("groups");
  }

  function handleTabChange(tab: Tab) {
    if (tab !== "groups") { setOpenCircleId(undefined); setOpenCircleTab(undefined); }
    setActiveTab(tab);
  }

  if (authLoading) return <LoadingScreen />;
  if (!session) return <AuthScreen />;
  if (profileLoading || inOnboarding === null) return <LoadingScreen />;
  if (inOnboarding) return <OnboardingFlow onComplete={() => setInOnboarding(false)} />;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="mobile-container relative overflow-x-hidden">
        {activeTab === "events" && (
          <EventsScreen
            onOpenCircle={handleOpenCircle}
            onSeeAllBookings={() => setShowAllBookings(true)}
          />
        )}
        {activeTab === "community" && <GrowScreen onOpenCircle={handleOpenCircle} />}
        {activeTab === "rewards" && <RewardsScreen />}
        {activeTab === "groups" && <CirclesScreen initialCircleId={openCircleId} initialTab={openCircleTab} />}
        {activeTab === "profile" && (
          <ProfileScreen onLogout={signOut} onOpenCircle={handleOpenCircle} />
        )}
        {showAllBookings && (
          <div className="absolute inset-0 z-50 bg-background overflow-y-auto">
            <BookingsScreen onBack={() => setShowAllBookings(false)} />
          </div>
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
