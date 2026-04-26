import { useState, useRef } from "react";
import {
  ChevronRight, Globe, Bell, Heart, Star, Camera, Instagram,
  Linkedin, Music2, Edit2, Check, X, Shield, Pencil, Lock, MessageCircle,
  Sparkles, FileText, ArrowLeft, Settings, LogOut, Copy,
} from "lucide-react";
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { useCircles } from "@/hooks/useCircles";
import { useEvents } from "@/hooks/useEvents";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useBookings } from "@/hooks/useBookings";
import { useLang } from "@/contexts/LanguageContext";
import { INTERESTS } from "@/data/mockData";
import { Logo } from "./Logo";
import { VerificationFlow } from "./VerificationFlow";
import { AdminVerificationPanel } from "./AdminVerificationPanel";
import { useFoundingMemberBadge } from "@/hooks/useFoundingMember";
import { supabase } from "@/lib/supabase";


async function uploadAvatar(base64: string, userId: string): Promise<string> {
  const chars = atob(base64);
  const bytes = new Uint8Array(chars.length);
  for (let i = 0; i < chars.length; i++) bytes[i] = chars.charCodeAt(i);
  const blob = new Blob([bytes], { type: 'image/jpeg' });
  const path = `avatars/${userId}.jpg`;
  const { error } = await supabase.storage.from('Events').upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
  if (error) throw error;
  const base64url = supabase.storage.from('Events').getPublicUrl(path).data.publicUrl;
  return `${base64url}?t=${Date.now()}`;
}

interface ProfileScreenProps {
  onLogout?: () => void;
  onOpenCircle?: (id: string) => void;
}

const STAR_SIGNS = [
  "Aries ♈", "Taurus ♉", "Gemini ♊", "Cancer ♋", "Leo ♌", "Virgo ♍",
  "Libra ♎", "Scorpio ♏", "Sagittarius ♐", "Capricorn ♑", "Aquarius ♒", "Pisces ♓",
];

function formatDate(dateStr: string): string {
  const [, month, day] = dateStr.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(month) - 1]} ${parseInt(day)}`;
}

interface BotEvent { title: string; date: string; price: string; isTbc: boolean; spotsLeft: number }

function getBotResponse(msg: string, events: BotEvent[] = [], bookings: string[] = []): string {
  const lower = msg.toLowerCase();

  // Greetings
  if (/^(hello|hi|hey|hola|buenas|good morning|good afternoon)[\s!]*$/.test(lower))
    return "Hi! I'm Nomaya's assistant 💜 I can help you with events, bookings, circles, payments and more. What do you need?";

  // List events
  if (/what event|which event|list.*event|event.*list|show.*event|what.*on|what.*happening|upcoming/.test(lower)) {
    if (events.length === 0) return "I couldn't load the events right now. Head to the Experiences tab to browse them all!";
    const lines = events.map(e =>
      e.isTbc
        ? `• ${e.title} — Coming soon (join waitlist)`
        : `• ${e.title} — ${e.date} · ${e.price}${e.spotsLeft <= 3 && e.spotsLeft > 0 ? ` (only ${e.spotsLeft} spots left!)` : e.spotsLeft === 0 ? ' (fully booked)' : ''}`
    );
    return `Here's what's coming up in Madrid:\n\n${lines.join('\n')}\n\nTap any event in the Experiences tab to book your spot 🎨`;
  }

  // Booking help
  if (/how.*book|how.*reserv|can i.*book|want to.*book|sign up.*event/.test(lower)) {
    if (events.length > 0) {
      const available = events.filter(e => !e.isTbc && e.spotsLeft > 0);
      if (available.length > 0) return `To book, go to Experiences tab → tap any event → "Reserve my spot". These events still have spaces:\n\n${available.map(e => `• ${e.title} (${e.spotsLeft} spots)`).join('\n')}`;
    }
    return "Go to the Experiences tab, tap any event and hit 'Reserve my spot'. Paid events use Stripe for secure payment.";
  }

  // My bookings
  if (/my booking|my reserv|what.*booked|did i book|have i registered/.test(lower)) {
    if (bookings.length === 0) return "You don't have any confirmed bookings yet. Head to Experiences to find an event you love! 💜";
    return `You have ${bookings.length} confirmed booking${bookings.length > 1 ? 's' : ''}. You can see them all in your Profile under "My events".`;
  }

  // Cancel
  if (/cancel|leave waitlist|withdraw|remove.*booking/.test(lower))
    return "To cancel a booking, open the event in the Experiences tab and tap 'Cancel reservation'. Cancellations more than 48h before the event are eligible for a refund or credits.";

  // Refund
  if (/refund|money back|charged|paid/.test(lower))
    return "For paid events cancelled 48h+ in advance you can get a full refund or Nomaya credits (+10% bonus). Cancel from the event page. Still need help? Email hola@nomaya.app.";

  // Payment
  if (/payment|pay|card|stripe|price|cost|how much|precio/.test(lower)) {
    if (events.length > 0) {
      const paid = events.filter(e => !e.isTbc && e.price !== 'Free');
      if (paid.length > 0) return `We use Stripe for secure payments. Current event prices:\n\n${paid.map(e => `• ${e.title}: ${e.price}`).join('\n')}\n\nProblems paying? Email hola@nomaya.app.`;
    }
    return "We accept card payments via Stripe. All transactions are secure. For payment issues email hola@nomaya.app.";
  }

  // Circles
  if (/circle|group|chat|community/.test(lower))
    return "Circles are private groups where members connect and plan together 💜 Browse them in the Circles tab. Some circles are open to join, others require a request.";

  // Verification
  if (/verify|verification|id|identity/.test(lower))
    return "Nomaya is a verified women-only space. To verify, go to Profile → tap the verification banner → follow the steps. It only takes a minute!";

  // Badges / levels
  if (/badge|founding|level|tier|inner circle|keeper/.test(lower))
    return "Badges are earned by attending events:\n• 🌸 Founding Circle — 1 event\n• ✨ Inner Circle — 3 events\n• 🔮 Keeper of the Circle — 5 events\n• 🏛️ Founding Member — attended our very first event";

  // Credits / referral
  if (/credit|referral|refer|code|discount/.test(lower))
    return "Your Nomaya credits show in the Community tab. You earn credits by referring friends (€10 per referral). Your friend gets €7.50 welcome credit when they sign up with your code!";

  // Account / login
  if (/password|login|sign in|account|log out/.test(lower))
    return "For login issues, try signing out and back in from the Profile tab. Still stuck? Email hola@nomaya.app and we'll help right away.";

  // Contact / human
  if (/human|person|speak to|talk to|contact|email|support team/.test(lower))
    return "You can reach the Nomaya team directly at hola@nomaya.app 💜 We reply within 24h.";

  // Waitlist / TBC
  if (/waitlist|wait list|tbc|coming soon|notify/.test(lower)) {
    const tbc = events.filter(e => e.isTbc);
    if (tbc.length > 0) return `These events are coming soon — join the waitlist to get notified:\n\n${tbc.map(e => `• ${e.title}`).join('\n')}\n\nTap them in the Experiences tab to join!`;
    return "Join the waitlist on any 'Coming soon' event in the Experiences tab to be the first to know when it opens!";
  }

  return "Happy to help! Could you tell me a bit more? You can also reach us at hola@nomaya.app 💜";
}

export function ProfileScreen({ onLogout, onOpenCircle }: ProfileScreenProps) {
  const { t, lang, setLang } = useLang();
  const { data: profile, refetch: refetchProfile } = useProfile();
  const { data: bookings = [] } = useBookings();
  const { user } = useAuth();
  const { data: allCircles = [] } = useCircles();
  const { data: allEvents = [] } = useEvents();
  const { mutate: updateProfile } = useUpdateProfile();

  const myCircles = allCircles.filter((c) => c.isMember || c.isAdmin);
  const botEvents: BotEvent[] = allEvents.map(e => ({
    title: e.title,
    date: e.date ?? 'TBC',
    price: e.price ?? 'Free',
    isTbc: e.isTbc ?? false,
    spotsLeft: e.spotsLeft ?? 0,
  }));
  const bookedEventIds = bookings.map(b => b.event_id);

  const [editingBio, setEditingBio] = useState(false);
  const [bioValue, setBioValue] = useState("");
  const [editingLinks, setEditingLinks] = useState(false);
  const [links, setLinks] = useState({ instagram_url: "", linkedin_url: "", tiktok_url: "" });
  const [editingBirthday, setEditingBirthday] = useState(false);
  const [birthdayValue, setBirthdayValue] = useState("");
  const [showHoroscopeSheet, setShowHoroscopeSheet] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [showInterestsSheet, setShowInterestsSheet] = useState(false);
  const [showLanguageSheet, setShowLanguageSheet] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [showMemberCard, setShowMemberCard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotificationsSheet, setShowNotificationsSheet] = useState(false);
  const [showSubscriptionSheet, setShowSubscriptionSheet] = useState(false);
  const [showReferralSheet, setShowReferralSheet] = useState(false);
  const [referralCopied, setReferralCopied] = useState(false);
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [legalDoc, setLegalDoc] = useState<'terms' | 'privacy' | 'guidelines' | 'refunds' | null>(null);
  const [showContactSheet, setShowContactSheet] = useState(false);
  const [showReportSheet, setShowReportSheet] = useState<'user' | 'event' | null>(null);
  const [reportStep, setReportStep] = useState<'select' | 'describe'>('select');
  const [reportSelectedUser, setReportSelectedUser] = useState<{ id: string; name: string; avatar_url: string | null } | null>(null);
  const [reportSelectedEvent, setReportSelectedEvent] = useState<{ id: string; title: string } | null>(null);
  const [reportUserQuery, setReportUserQuery] = useState('');
  const [reportUserResults, setReportUserResults] = useState<{ id: string; name: string; avatar_url: string | null }[]>([]);
  const [reportDescription, setReportDescription] = useState('');
  const [walletLoading, setWalletLoading] = useState(false);
  const [showSupportChat, setShowSupportChat] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [supportMessages, setSupportMessages] = useState<Array<{ role: 'user' | 'bot'; content: string }>>([
    { role: 'bot', content: "Hi! I'm Nomaya's assistant. How can I help you today? 💜" },
  ]);
  const [supportInput, setSupportInput] = useState("");
  const [isSendingSupport, setIsSendingSupport] = useState(false);

  async function sendSupportMessage(msg: string) {
    if (!msg || isSendingSupport) return;
    setIsSendingSupport(true);
    setSupportInput("");
    setSupportMessages(prev => [...prev, { role: 'user', content: msg }]);
    supabase.from('support_messages').insert({ user_id: user?.id, content: msg, role: 'user' });

    let reply: string;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/support-chat`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: msg,
            context: { events: botEvents, bookingsCount: bookedEventIds.length },
          }),
        }
      );
      const json = await res.json();
      reply = json.reply || getBotResponse(msg, botEvents, bookedEventIds);
    } catch {
      reply = getBotResponse(msg, botEvents, bookedEventIds);
    }

    setSupportMessages(prev => [...prev, { role: 'bot', content: reply }]);
    supabase.from('support_messages').insert({ user_id: user?.id, content: reply, role: 'bot' });
    setIsSendingSupport(false);
  }
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(profile?.interests ?? []);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const [notifSettings, setNotifSettings] = useState({
    newEvents: true,
    bookingReminders: true,
    circleMessages: true,
    joinUpdates: true,
  });

  useFoundingMemberBadge();

  const badges: string[] = (profile as { badges?: string[] } | null)?.badges ?? [];
  const isFoundingMember = badges.includes('founding_member');

  const isTopHost = allCircles.some(c => c.isAdmin) || bookings.length >= 8;
  const isEarlyMember = isFoundingMember;
  const isCommunityBuilder = myCircles.length >= 2;

  const recognitionBadges = [
    ...(isTopHost ? [{ label: "Top host", icon: "🎤" }] : []),
    ...(isEarlyMember ? [{ label: "Early member", icon: "🌱" }] : []),
    ...(isCommunityBuilder ? [{ label: "Community builder", icon: "🤝" }] : []),
  ];

  const ritualBadge = bookings.length >= 5
    ? { label: "Keeper of the Circle", icon: "🔮" }
    : bookings.length >= 3
    ? { label: "Inner Circle", icon: "✨" }
    : bookings.length >= 1
    ? { label: "Founding Circle", icon: "🌸" }
    : null;

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : t("profile.recently");

  const memberId = (profile as any)?.member_number != null
    ? `NM-MAD-${String((profile as any).member_number).padStart(4, '0')}`
    : 'NM-MAD-????';

  // Treat "Member" or empty as no name set — they're onboarding artifacts
  const displayName = (profile?.name && profile.name !== "Member" && profile.name.trim())
    ? profile.name.trim()
    : null;

  async function handleAddToWallet() {
    setWalletLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('https://jtoftrghfwdffrkqejlq.supabase.co/functions/v1/generate-pass', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const text = await res.text();
      let json: any = {};
      try { json = JSON.parse(text); } catch { /* not json */ }
      if (!res.ok) {
        alert(`HTTP ${res.status}: ${json?.detail || json?.error || text.slice(0, 200)}`);
        return;
      }
      if (json?.url) {
        window.location.href = json.url;
      } else if (json?.error === 'not_configured') {
        alert(lang === 'es' ? "Apple Wallet estará disponible próximamente." : "Apple Wallet support is coming soon.");
      } else {
        alert(`Wallet error: ${json?.detail || json?.error || text.slice(0, 200)}`);
      }
    } catch (err) {
      alert(`Wallet error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setWalletLoading(false);
    }
  }

  async function handleAvatarUpload() {
    if (!profile?.id) return;
    let photo;
    try {
      photo = await CapCamera.getPhoto({
        quality: 85,
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
      });
    } catch {
      // Capacitor camera unavailable (simulator/web) — fall back to file input
      avatarFileInputRef.current?.click();
      return;
    }
    if (!photo.base64String) return;
    setIsUploadingAvatar(true);
    setLocalAvatarUrl(`data:image/jpeg;base64,${photo.base64String}`);
    try {
      const url = await uploadAvatar(photo.base64String, profile.id);
      setLocalAvatarUrl(url);
      updateProfile({ avatar_url: url });
    } catch (err) {
      console.error('Avatar upload failed:', err);
      alert('Could not save photo. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  async function handleAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;
    setIsUploadingAvatar(true);

    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => resolve(ev.target?.result as string);
      reader.readAsDataURL(file);
    });
    setLocalAvatarUrl(dataUrl);

    try {
      const base64 = dataUrl.split(",")[1];
      const url = await uploadAvatar(base64, profile.id!);
      setLocalAvatarUrl(url);
      updateProfile({ avatar_url: url });
    } catch (err) {
      console.error('Avatar upload failed:', err);
      alert('Could not save photo. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
    }
    e.target.value = "";
  }

  function saveBio() {
    updateProfile({ bio: bioValue || null });
    setEditingBio(false);
  }

  function saveLinks() {
    updateProfile({
      instagram_url: links.instagram_url || null,
      linkedin_url: links.linkedin_url || null,
      tiktok_url: links.tiktok_url || null,
    });
    setEditingLinks(false);
  }

  function saveBirthday() {
    updateProfile({ birthday: birthdayValue || null });
    setEditingBirthday(false);
  }

  function saveHoroscope(sign: string) {
    updateProfile({ horoscope: sign });
    setShowHoroscopeSheet(false);
  }

  function saveInterests() {
    updateProfile({ interests: selectedInterests });
    setShowInterestsSheet(false);
  }

  function saveLanguage(l: "en" | "es") {
    setLang(l);
    updateProfile({ language: l });
    setShowLanguageSheet(false);
  }

  if (showVerification) {
    return (
      <VerificationFlow
        onComplete={() => { setShowVerification(false); refetchProfile(); }}
        onSkip={() => { setShowVerification(false); refetchProfile(); }}
      />
    );
  }

  // ── Settings screen ──────────────────────────────────────────────────────────
  if (showSettings) {
    const settingsSections = [
      {
        title: null,
        items: [
          { icon: Pencil, label: t("settings.edit_profile"), value: null, onPress: () => setShowSettings(false) },
          { icon: Bell, label: t("profile.notifications"), value: null, onPress: () => setShowNotificationsSheet(true) },
          { icon: Lock, label: t("settings.privacy"), value: null, onPress: () => window.open("https://nomaya.app/privacy", "_blank") },
        ],
      },
      {
        title: t("settings.plan_credits"),
        items: [
          { icon: Sparkles, label: t("settings.subscription"), value: ritualBadge?.label ?? "Member", onPress: () => setShowSubscriptionSheet(true) },
        ],
      },
      {
        title: t("settings.help_support"),
        items: [
          { icon: MessageCircle, label: t("settings.chat_support"), value: null, onPress: () => setShowSupportChat(true) },
          { icon: Sparkles, label: t("settings.feedback"), value: null, onPress: () => { setFeedbackRating(0); setFeedbackMessage(""); setFeedbackSubmitted(false); setShowFeedbackForm(true); } },
          { icon: Bell, label: t("settings.contact_us"), value: "hola.nomaya@gmail.com", onPress: () => setShowContactSheet(true) },
        ],
      },
      {
        title: t("settings.safety"),
        items: [
          { icon: Shield, label: t("settings.report_user"), value: null, onPress: () => { setReportStep('select'); setReportSelectedUser(null); setReportUserQuery(''); setReportUserResults([]); setReportDescription(''); setShowReportSheet('user'); } },
          { icon: Shield, label: t("settings.report_event"), value: null, onPress: () => { setReportStep('select'); setReportSelectedEvent(null); setReportDescription(''); setShowReportSheet('event'); } },
        ],
      },
      {
        title: "Legal",
        items: [
          { icon: FileText, label: t("settings.terms"), value: null, onPress: () => setLegalDoc('terms') },
          { icon: FileText, label: t("settings.privacy_policy"), value: null, onPress: () => setLegalDoc('privacy') },
          { icon: FileText, label: t("settings.guidelines"), value: null, onPress: () => setLegalDoc('guidelines') },
          { icon: FileText, label: t("settings.refunds"), value: null, onPress: () => setLegalDoc('refunds') },
        ],
      },
    ];

    return (
      <div className="mobile-container flex flex-col bg-background pb-screen-bottom">
        <div className="px-5 pt-screen-top pb-4 flex items-center gap-3">
          <button onClick={() => setShowSettings(false)} className="w-9 h-9 rounded-full bg-card flex items-center justify-center">
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <h1 className="font-serif text-2xl font-normal text-foreground">{t("profile.settings")}</h1>
        </div>

        <div className="px-5 space-y-6 overflow-y-auto">
          {settingsSections.map((section) => (
            <div key={section.title ?? "top"}>
              {section.title && (
                <p className="text-sm font-semibold text-foreground mb-2 px-1">{section.title}</p>
              )}
              <div className="bg-card rounded-2xl overflow-hidden shadow-soft">
                {section.items.map(({ icon: Icon, label, value, onPress }, i) => (
                  <button
                    key={label}
                    onClick={onPress}
                    className={`w-full flex items-center justify-between px-4 py-4 text-left active:bg-muted/30 transition-all ${
                      i < section.items.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={16} className="text-muted-foreground" />
                      <span className="text-sm text-foreground">{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {value && <span className="text-sm text-muted-foreground">{value}</span>}
                      <ChevronRight size={14} className="text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Language picker inline */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-2 px-1">{t("profile.language")}</p>
            <div className="bg-card rounded-2xl overflow-hidden shadow-soft">
              {[
                { code: "en" as const, label: "English", flag: "🇬🇧" },
                { code: "es" as const, label: "Español", flag: "🇪🇸" },
              ].map((l, i) => (
                <button
                  key={l.code}
                  onClick={() => saveLanguage(l.code)}
                  className={`w-full flex items-center justify-between px-4 py-4 text-left active:bg-muted/30 ${
                    i === 0 ? "border-b border-border" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{l.flag}</span>
                    <span className="text-sm text-foreground">{l.label}</span>
                  </div>
                  {lang === l.code && <Check size={15} className="text-primary" />}
                </button>
              ))}
            </div>
          </div>

          {/* Referrals */}
          <div className="bg-card rounded-2xl overflow-hidden shadow-soft">
            <button
              onClick={() => setShowReferralSheet(true)}
              className="w-full flex items-center justify-between px-4 py-4 text-left active:bg-muted/30"
            >
              <div className="flex items-center gap-3">
                <Star size={16} className="text-muted-foreground" />
                <span className="text-sm text-foreground">{t("profile.invite_friends")}</span>
              </div>
              <ChevronRight size={14} className="text-muted-foreground" />
            </button>
          </div>

          {/* Admin: verification panel */}
          {user && (
            <div className="bg-card rounded-2xl overflow-hidden">
              <p className="text-xs uppercase tracking-widest text-muted-foreground px-4 pt-3 pb-1">Admin</p>
              <AdminVerificationPanel />
            </div>
          )}

          {/* Log out */}
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-primary text-sm font-medium px-1"
          >
            <LogOut size={15} />
            {t("profile.sign_out")}
          </button>

          {/* Delete account */}
          <button
            onClick={() => setShowDeleteSheet(true)}
            className="flex items-center gap-2 text-red-400 text-sm font-medium px-1"
          >
            <X size={15} />
            {t("settings.delete_account")}
          </button>
        </div>

        {/* Notifications sheet */}
        {showNotificationsSheet && (
          <div className="fixed inset-0 z-[300] flex items-end justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowNotificationsSheet(false)} />
            <div className="relative w-full max-w-sm bg-card rounded-t-3xl p-6 space-y-5" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 2.5rem)" }}>
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-2" />
              <h2 className="font-serif text-xl font-medium text-foreground">{t("profile.notifications")}</h2>
              <div className="space-y-0 bg-muted rounded-2xl overflow-hidden">
                {[
                  { key: "newEvents" as const, label: t("settings.notif_new_events"), desc: t("settings.notif_new_events_desc") },
                  { key: "bookingReminders" as const, label: t("settings.notif_reminders"), desc: t("settings.notif_reminders_desc") },
                  { key: "circleMessages" as const, label: t("settings.notif_circle"), desc: t("settings.notif_circle_desc") },
                  { key: "joinUpdates" as const, label: t("settings.notif_join"), desc: t("settings.notif_join_desc") },
                ].map(({ key, label, desc }, i, arr) => (
                  <div key={key} className={`flex items-center justify-between px-4 py-3.5 ${i < arr.length - 1 ? "border-b border-border" : ""}`}>
                    <div>
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                    <button
                      onClick={() => setNotifSettings((s) => ({ ...s, [key]: !s[key] }))}
                      className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 relative ml-4 ${notifSettings[key] ? "bg-primary" : "bg-border"}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${notifSettings[key] ? "left-6" : "left-1"}`} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowNotificationsSheet(false)}
                className="w-full py-3.5 rounded-2xl gradient-cta text-white font-medium text-sm"
              >
                {t("settings.save_prefs")}
              </button>
            </div>
          </div>
        )}

        {/* Referral sheet */}
        {showReferralSheet && (() => {
          const code = profile?.id ? profile.id.replace(/-/g, '').substring(0, 8).toUpperCase() : '········';
          function copyCode() {
            navigator.clipboard?.writeText(code);
            setReferralCopied(true);
            setTimeout(() => setReferralCopied(false), 2000);
          }
          function shareWhatsApp() {
            const text = `I'd love to see you at my table 💜 Join Nomaya — a curated community for women in Madrid. Use my code ${code} for 15% off your first event + early access. https://nomaya.app`;
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
          }
          return (
            <div className="fixed inset-0 z-[300] flex items-end justify-center">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowReferralSheet(false)} />
              <div className="relative w-full max-w-sm bg-card rounded-t-3xl p-6 space-y-5" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 2.5rem)" }}>
                <div className="w-10 h-1 bg-border rounded-full mx-auto mb-2" />
                <h2 className="font-serif text-xl font-medium text-foreground">{t("settings.invite_friend")}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{t("settings.invite_desc")}</p>
                <div className="bg-muted rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{t("grow.your_code")}</p>
                    <p className="font-mono text-2xl font-bold text-foreground tracking-wider">{code}</p>
                  </div>
                  <button
                    onClick={copyCode}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border text-sm font-medium active:scale-95 transition-all"
                    style={{ color: referralCopied ? "hsl(252 50% 65%)" : undefined }}
                  >
                    {referralCopied ? <Check size={14} /> : <Copy size={14} />}
                    {referralCopied ? t("grow.copied") : t("grow.copy")}
                  </button>
                </div>
                <button
                  onClick={shareWhatsApp}
                  className="w-full py-3.5 rounded-2xl gradient-cta text-white font-medium text-sm flex items-center justify-center gap-2"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  {t("grow.share_whatsapp")}
                </button>
              </div>
            </div>
          );
        })()}

        {/* Delete account sheet */}
        {showDeleteSheet && (
          <div className="fixed inset-0 z-[300] flex items-end justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteSheet(false)} />
            <div className="relative w-full max-w-sm bg-card rounded-t-3xl p-6 space-y-4" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 2.5rem)" }}>
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-2" />
              <h2 className="font-serif text-xl font-medium text-foreground">{t("settings.delete_title")}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{t("settings.delete_desc")}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {lang === 'es' ? 'También puedes enviarnos un correo a ' : 'You can also email us at '}
                <span className="text-foreground font-medium">hola.nomaya@gmail.com</span>
                {lang === 'es' ? ' para solicitar la eliminación.' : ' to request deletion.'}
              </p>
              <button
                onClick={async () => {
                  setDeletingAccount(true);
                  try {
                    const { data: { session } } = await supabase.auth.getSession();
                    await fetch(
                      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
                      {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${session?.access_token}`,
                          'Content-Type': 'application/json',
                        },
                      }
                    );
                  } catch {
                    // best-effort — sign out regardless
                  }
                  await supabase.auth.signOut();
                  setDeletingAccount(false);
                  setShowDeleteSheet(false);
                  onLogout?.();
                }}
                disabled={deletingAccount}
                className="w-full py-3.5 rounded-2xl bg-red-500/90 text-white font-medium text-sm"
              >
                {deletingAccount ? t("settings.deleting") : t("settings.delete_confirm")}
              </button>
              <button
                onClick={() => setShowDeleteSheet(false)}
                className="w-full py-3 text-sm text-muted-foreground"
              >
                {t("profile.cancel")}
              </button>
            </div>
          </div>
        )}

        {/* Contact sheet */}
        {showContactSheet && (
          <div className="fixed inset-0 z-[300] flex items-end justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowContactSheet(false)} />
            <div className="relative w-full max-w-sm bg-card rounded-t-3xl p-6 space-y-3" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 2.5rem)" }}>
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-2" />
              <h2 className="font-serif text-xl font-medium text-foreground">{t("settings.contact_us")}</h2>
              <p className="text-sm text-muted-foreground">hola.nomaya@gmail.com</p>
              {[
                { label: "Mail", onPress: () => { window.location.href = "mailto:hola.nomaya@gmail.com"; setShowContactSheet(false); } },
                { label: "Gmail", onPress: () => { window.location.href = "googlegmail://co?to=hola.nomaya@gmail.com"; setShowContactSheet(false); } },
                { label: "Outlook", onPress: () => { window.location.href = "ms-outlook://compose?to=hola.nomaya@gmail.com"; setShowContactSheet(false); } },
              ].map(({ label, onPress }) => (
                <button key={label} onClick={onPress} className="w-full py-3.5 rounded-2xl bg-muted text-foreground font-medium text-sm active:opacity-70">
                  {label}
                </button>
              ))}
              <button onClick={() => setShowContactSheet(false)} className="w-full py-3 text-sm text-muted-foreground">{t("profile.cancel")}</button>
            </div>
          </div>
        )}

        {/* Report sheet */}
        {showReportSheet && (
          <div className="fixed inset-0 z-[300] flex items-end justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowReportSheet(null)} />
            <div className="relative w-full max-w-sm bg-card rounded-t-3xl p-6 flex flex-col gap-4" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 2.5rem)", maxHeight: '88dvh' }}>
              <div className="w-10 h-1 bg-border rounded-full mx-auto" />

              {/* Header */}
              <div className="flex items-center gap-3">
                {reportStep === 'describe' && (
                  <button onClick={() => setReportStep('select')} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <ArrowLeft size={15} className="text-foreground" />
                  </button>
                )}
                <h2 className="font-serif text-xl font-medium text-foreground">
                  {showReportSheet === 'user' ? t("settings.report_user") : t("settings.report_event")}
                </h2>
              </div>

              {/* Step 1 — select user */}
              {reportStep === 'select' && showReportSheet === 'user' && (
                <>
                  <input
                    value={reportUserQuery}
                    onChange={async (e) => {
                      const q = e.target.value;
                      setReportUserQuery(q);
                      if (!q.trim()) { setReportUserResults([]); return; }
                      const { data } = await supabase.from('profiles').select('id, name, avatar_url').ilike('name', `%${q}%`).limit(10);
                      setReportUserResults(data ?? []);
                    }}
                    placeholder={lang === 'es' ? "Buscar miembro por nombre…" : "Search member by name…"}
                    className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                    autoFocus
                  />
                  <div className="overflow-y-auto space-y-2 flex-1">
                    {reportUserResults.map(u => (
                      <button
                        key={u.id}
                        onClick={() => { setReportSelectedUser(u); setReportStep('describe'); }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl text-left bg-muted active:opacity-70 transition-all"
                      >
                        {u.avatar_url
                          ? <img src={u.avatar_url} alt={u.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                          : <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-base">🌸</div>
                        }
                        <span className="text-sm font-medium text-foreground">{u.name}</span>
                      </button>
                    ))}
                    {reportUserQuery.trim() && reportUserResults.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-6">{lang === 'es' ? "Sin resultados" : "No results found"}</p>
                    )}
                    {!reportUserQuery.trim() && (
                      <p className="text-xs text-muted-foreground text-center py-6">{lang === 'es' ? "Escribe el nombre para buscar" : "Type a name to search"}</p>
                    )}
                  </div>
                </>
              )}

              {/* Step 1 — select event */}
              {reportStep === 'select' && showReportSheet === 'event' && (
                <div className="overflow-y-auto space-y-2 flex-1">
                  {allEvents.map(ev => (
                    <button
                      key={ev.id}
                      onClick={() => { setReportSelectedEvent({ id: ev.id, title: ev.title }); setReportStep('describe'); }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl text-left bg-muted active:opacity-70 transition-all"
                    >
                      {ev.image
                        ? <img src={ev.image} alt={ev.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        : <div className="w-10 h-10 rounded-lg flex-shrink-0" style={{ background: ev.categoryColor }} />
                      }
                      <span className="text-sm font-medium text-foreground leading-snug">{ev.title}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Step 2 — describe */}
              {reportStep === 'describe' && (
                <>
                  <div className="bg-muted rounded-xl p-3 flex items-center gap-3">
                    {showReportSheet === 'user' && reportSelectedUser && (
                      <>
                        {reportSelectedUser.avatar_url
                          ? <img src={reportSelectedUser.avatar_url} alt={reportSelectedUser.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                          : <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-base flex-shrink-0">🌸</div>
                        }
                        <span className="text-sm font-semibold text-foreground">{reportSelectedUser.name}</span>
                      </>
                    )}
                    {showReportSheet === 'event' && reportSelectedEvent && (
                      <>
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-xl flex-shrink-0">🗓️</div>
                        <span className="text-sm font-semibold text-foreground">{reportSelectedEvent.title}</span>
                      </>
                    )}
                  </div>
                  <textarea
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder={lang === 'es' ? "Describe lo que ocurrió…" : "Describe what happened…"}
                    rows={4}
                    className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
                  />
                  <button
                    onClick={() => {
                      const subject = showReportSheet === 'user'
                        ? `Report a user: ${reportSelectedUser?.name ?? ''}`
                        : `Report an event: ${reportSelectedEvent?.title ?? ''}`;
                      window.location.href = `mailto:hola.nomaya@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(reportDescription)}`;
                      setShowReportSheet(null);
                    }}
                    disabled={!reportDescription.trim()}
                    className="w-full py-3.5 rounded-2xl gradient-cta text-white font-medium text-sm disabled:opacity-50"
                  >
                    {lang === 'es' ? "Enviar informe" : "Send report"}
                  </button>
                </>
              )}

              <button onClick={() => setShowReportSheet(null)} className="w-full py-2 text-sm text-muted-foreground">{t("profile.cancel")}</button>
            </div>
          </div>
        )}

        {/* Legal doc overlay */}
        {legalDoc && (() => {
          type LegalSection = { heading: string | null; body: string };
          type LegalDoc = { title: string; sections: LegalSection[] };
          type LegalDocs = Record<string, { en: LegalDoc; es: LegalDoc }>;
          const docs: LegalDocs = {
            terms: {
              en: {
                title: "Terms of Service",
                sections: [
                  { heading: null, body: "Welcome to Nomaya.\n\nNomaya is a community platform designed to help women connect through shared experiences, events, and interest-based circles.\n\nBy creating an account or using the Nomaya app, you agree to the following terms." },
                  { heading: "1. Eligibility", body: "Nomaya is a women-only community.\n\nUsers must be at least 18 years old to create an account.\n\nNomaya may require identity verification to confirm eligibility and maintain a safe community environment." },
                  { heading: "2. User Accounts", body: "Users are responsible for maintaining the confidentiality of their account credentials.\n\nYou agree to provide accurate information and to keep your profile information up to date.\n\nNomaya reserves the right to suspend or terminate accounts that violate these terms or compromise the safety of the community." },
                  { heading: "3. Community Conduct", body: "Nomaya is a respectful and supportive environment.\n\nUsers agree not to engage in:\n• Harassment or abusive behavior\n• Discrimination\n• Spam or promotional abuse\n• Impersonation or identity misrepresentation\n\nViolations may result in removal from the platform." },
                  { heading: "4. Events and Experiences", body: "Nomaya may host events directly or facilitate events hosted by third parties or community hosts.\n\nParticipation in events is voluntary and users assume responsibility for their own participation.\n\nNomaya is not liable for personal injury, damages, or disputes occurring during third-party hosted events." },
                  { heading: "5. Payments and Credits", body: "Certain experiences may require payment.\n\nNomaya credits may be issued through participation, referrals, or promotions and can be applied to future bookings within the platform.\n\nCredits have no cash value." },
                  { heading: "6. Account Termination", body: "Users may delete their account at any time through the app settings.\n\nNomaya reserves the right to suspend or terminate accounts that violate community standards." },
                  { heading: "7. Changes to Terms", body: "Nomaya may update these terms periodically. Continued use of the app constitutes acceptance of the updated terms." },
                  { heading: "Contact", body: "hola.nomaya@gmail.com" },
                ],
              },
              es: {
                title: "Términos de Servicio",
                sections: [
                  { heading: null, body: "Bienvenida a Nomaya.\n\nNomaya es una plataforma comunitaria diseñada para ayudar a las mujeres a conectar a través de experiencias compartidas, eventos y círculos de intereses.\n\nAl crear una cuenta o usar la app de Nomaya, aceptas los siguientes términos." },
                  { heading: "1. Elegibilidad", body: "Nomaya es una comunidad exclusiva para mujeres.\n\nLas usuarias deben tener al menos 18 años para crear una cuenta.\n\nNomaya puede requerir verificación de identidad para confirmar la elegibilidad y mantener un entorno seguro." },
                  { heading: "2. Cuentas de usuario", body: "Las usuarias son responsables de mantener la confidencialidad de sus credenciales.\n\nAceptas proporcionar información precisa y mantener tu perfil actualizado.\n\nNomaya se reserva el derecho de suspender o eliminar cuentas que incumplan estos términos o comprometan la seguridad de la comunidad." },
                  { heading: "3. Conducta en la comunidad", body: "Nomaya es un entorno respetuoso y de apoyo.\n\nLas usuarias se comprometen a no incurrir en:\n• Acoso o comportamiento abusivo\n• Discriminación\n• Spam o abuso promocional\n• Suplantación de identidad\n\nLas infracciones pueden resultar en la eliminación de la plataforma." },
                  { heading: "4. Eventos y experiencias", body: "Nomaya puede organizar eventos directamente o facilitar eventos de terceros o anfitrionas de la comunidad.\n\nLa participación es voluntaria y las usuarias asumen la responsabilidad de su propia participación.\n\nNomaya no se hace responsable de lesiones, daños o disputas ocurridas en eventos organizados por terceros." },
                  { heading: "5. Pagos y créditos", body: "Algunas experiencias pueden requerir pago.\n\nLos créditos Nomaya pueden otorgarse por participación, referencias o promociones y aplicarse a futuras reservas.\n\nLos créditos no tienen valor monetario." },
                  { heading: "6. Cancelación de cuenta", body: "Las usuarias pueden eliminar su cuenta en cualquier momento desde los ajustes de la app.\n\nNomaya se reserva el derecho de suspender cuentas que incumplan los estándares de la comunidad." },
                  { heading: "7. Cambios en los términos", body: "Nomaya puede actualizar estos términos periódicamente. El uso continuado de la app implica la aceptación de los términos actualizados." },
                  { heading: "Contacto", body: "hola.nomaya@gmail.com" },
                ],
              },
            },
            privacy: {
              en: {
                title: "Privacy Policy",
                sections: [
                  { heading: null, body: "Nomaya respects your privacy and is committed to protecting your personal data." },
                  { heading: "Information We Collect", body: "We may collect the following information:\n• Name and profile information\n• Email address\n• Event participation activity\n• Circle membership activity\n• Identity verification data (when applicable)" },
                  { heading: "Identity Verification", body: "To maintain a safe women-only community, Nomaya may request identity verification.\n\nThis may include:\n• A photo of a government-issued ID\n• A selfie for facial matching\n\nVerification images are used only for identity confirmation and are deleted after the review process. Nomaya does not store ID documents long-term." },
                  { heading: "How We Use Your Data", body: "We use your data to:\n• Operate the Nomaya platform\n• Verify user eligibility\n• Facilitate events and community interactions\n• Improve the user experience" },
                  { heading: "Data Sharing", body: "Nomaya does not sell personal data.\n\nInformation may be shared only with trusted service providers necessary to operate the platform (such as payment processors or identity verification tools)." },
                  { heading: "Data Security", body: "We take reasonable measures to protect user data from unauthorized access." },
                  { heading: "Your Rights", body: "Users may request access, modification, or deletion of their data at any time.\n\nRequests can be sent to:\nhola.nomaya@gmail.com" },
                ],
              },
              es: {
                title: "Política de Privacidad",
                sections: [
                  { heading: null, body: "Nomaya respeta tu privacidad y se compromete a proteger tus datos personales." },
                  { heading: "Información que recopilamos", body: "Podemos recopilar la siguiente información:\n• Nombre e información de perfil\n• Dirección de correo electrónico\n• Actividad de participación en eventos\n• Actividad de membresía en círculos\n• Datos de verificación de identidad (cuando aplique)" },
                  { heading: "Verificación de identidad", body: "Para mantener una comunidad segura exclusiva para mujeres, Nomaya puede solicitar verificación de identidad.\n\nEsto puede incluir:\n• Una foto de un documento de identidad oficial\n• Un selfie para verificación facial\n\nLas imágenes de verificación se usan únicamente para confirmar la identidad y se eliminan tras la revisión. Nomaya no almacena documentos de identidad a largo plazo." },
                  { heading: "Cómo usamos tus datos", body: "Usamos tus datos para:\n• Operar la plataforma Nomaya\n• Verificar la elegibilidad de las usuarias\n• Facilitar eventos e interacciones comunitarias\n• Mejorar la experiencia de usuario" },
                  { heading: "Compartición de datos", body: "Nomaya no vende datos personales.\n\nLa información solo puede compartirse con proveedores de servicios de confianza necesarios para operar la plataforma (como procesadores de pago o herramientas de verificación de identidad)." },
                  { heading: "Seguridad de los datos", body: "Tomamos medidas razonables para proteger los datos de las usuarias frente a accesos no autorizados." },
                  { heading: "Tus derechos", body: "Las usuarias pueden solicitar acceso, modificación o eliminación de sus datos en cualquier momento.\n\nLas solicitudes pueden enviarse a:\nhola.nomaya@gmail.com" },
                ],
              },
            },
            guidelines: {
              en: {
                title: "Community Guidelines",
                sections: [
                  { heading: null, body: "Nomaya exists to help women build meaningful connections through shared experiences.\n\nTo keep this space safe and welcoming, all members are expected to follow these guidelines." },
                  { heading: "Respect", body: "Treat all members with kindness and respect.\n\nHarassment, discrimination, or aggressive behavior will not be tolerated." },
                  { heading: "Authentic Participation", body: "Nomaya is designed for genuine connection.\n\nFake profiles, impersonation, or misleading identities are not allowed." },
                  { heading: "Safe Community", body: "Members should respect personal boundaries and maintain a supportive environment.\n\nAny behavior that compromises safety may result in removal from the platform." },
                  { heading: "Reporting", body: "If you encounter behavior that violates these guidelines, you may report it through the app or by contacting support." },
                ],
              },
              es: {
                title: "Normas de la Comunidad",
                sections: [
                  { heading: null, body: "Nomaya existe para ayudar a las mujeres a construir conexiones significativas a través de experiencias compartidas.\n\nPara mantener este espacio seguro y acogedor, todas las miembros deben seguir estas normas." },
                  { heading: "Respeto", body: "Trata a todas las miembros con amabilidad y respeto.\n\nNo se tolerará el acoso, la discriminación ni el comportamiento agresivo." },
                  { heading: "Participación auténtica", body: "Nomaya está diseñada para la conexión genuina.\n\nNo se permiten perfiles falsos, suplantación de identidad ni identidades engañosas." },
                  { heading: "Comunidad segura", body: "Las miembros deben respetar los límites personales y mantener un entorno de apoyo.\n\nCualquier comportamiento que comprometa la seguridad puede resultar en la expulsión de la plataforma." },
                  { heading: "Reportes", body: "Si encuentras un comportamiento que incumple estas normas, puedes reportarlo a través de la app o contactando con soporte." },
                ],
              },
            },
            refunds: {
              en: {
                title: "Refund & Cancellation Policy",
                sections: [
                  { heading: "Event Cancellation", body: "Users may cancel participation in an event according to the cancellation window specified in the event details." },
                  { heading: "Refunds", body: "If a cancellation occurs within the allowed window, users may receive:\n• A refund\n• Or Nomaya credits for future bookings" },
                  { heading: "Host Cancellations", body: "If an event is cancelled by the host or by Nomaya, participants will receive a full refund or credit." },
                  { heading: "Credits", body: "Nomaya credits can be used for future experiences within the platform and cannot be exchanged for cash." },
                ],
              },
              es: {
                title: "Política de Cancelación y Reembolso",
                sections: [
                  { heading: "Cancelación de evento", body: "Las usuarias pueden cancelar su participación en un evento según el período de cancelación especificado en los detalles del evento." },
                  { heading: "Reembolsos", body: "Si la cancelación se realiza dentro del período permitido, las usuarias pueden recibir:\n• Un reembolso\n• O créditos Nomaya para futuras reservas" },
                  { heading: "Cancelaciones por parte del anfitrión", body: "Si un evento es cancelado por el anfitrión o por Nomaya, los participantes recibirán un reembolso completo o un crédito." },
                  { heading: "Créditos", body: "Los créditos Nomaya pueden utilizarse para futuras experiencias en la plataforma y no pueden canjearse por dinero en efectivo." },
                ],
              },
            },
          };
          const doc = docs[legalDoc][lang] ?? docs[legalDoc]['en'];
          return (
            <div className="fixed inset-0 z-[300] flex flex-col" style={{ background: '#fff' }}>
              <div className="px-5 pt-screen-top pb-4 flex items-center gap-3 flex-shrink-0 border-b border-gray-100">
                <button onClick={() => setLegalDoc(null)} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                  <ArrowLeft size={18} className="text-gray-700" />
                </button>
                <h1 className="font-serif text-xl font-medium text-gray-900">{doc.title}</h1>
              </div>
              <div className="flex-1 overflow-y-auto px-5 pb-10 space-y-5 pt-5">
                {doc.sections.map((s, i) => (
                  <div key={i}>
                    {s.heading && <p className="text-sm font-semibold text-gray-900 mb-1.5">{s.heading}</p>}
                    {s.body.split('\n').map((line, j) => (
                      <p key={j} className={`text-sm text-gray-600 leading-relaxed ${line === '' ? 'mt-2' : ''}`}>{line || '\u00A0'}</p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Subscription sheet */}
        {showSubscriptionSheet && (
          <div className="fixed inset-0 z-[300] flex items-end justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowSubscriptionSheet(false)} />
            <div className="relative w-full max-w-sm bg-card rounded-t-3xl p-6 space-y-4" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 2.5rem)" }}>
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-2" />
              <h2 className="font-serif text-xl font-medium text-foreground">Your community tier</h2>
              <div className="bg-muted rounded-2xl p-5 text-center space-y-1">
                <p className="text-3xl">{ritualBadge?.icon ?? "🌸"}</p>
                <p className="font-serif text-lg font-medium text-foreground mt-2">{ritualBadge?.label ?? "Founding Circle"}</p>
                <p className="text-xs text-muted-foreground">Member since {memberSince}</p>
              </div>
              <div className="bg-muted rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Events attended</span>
                  <span className="font-medium text-foreground">{bookings.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Refund credits</span>
                  <span className="font-medium text-foreground">€{((profile?.credits_cents ?? 0) / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Circles joined</span>
                  <span className="font-medium text-foreground">{myCircles.length}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Your tier is earned by attending events — it's free and updates automatically.{" "}
                To delete your account, go to{" "}
                <button onClick={() => setShowSubscriptionSheet(false)} className="text-primary underline">Settings → Delete account</button>.
              </p>
            </div>
          </div>
        )}

        {/* Support chat sheet */}
        {showSupportChat && (
          <div className="fixed inset-0 z-[300] flex flex-col">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowSupportChat(false)} />
            <div className="relative flex flex-col bg-card rounded-t-3xl mt-auto w-full max-w-sm mx-auto" style={{ height: "80dvh", paddingBottom: "max(env(safe-area-inset-bottom), 1rem)" }}>
              {/* Header */}
              <div className="px-5 pt-4 pb-3 border-b border-border flex items-center gap-3 flex-shrink-0">
                <div className="w-9 h-9 rounded-full gradient-cta flex items-center justify-center text-white text-sm font-bold">N</div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Nomaya Support</p>
                  <p className="text-[10px] text-muted-foreground">Usually replies instantly</p>
                </div>
                <button onClick={() => setShowSupportChat(false)}>
                  <X size={18} className="text-muted-foreground" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {supportMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-snug ${
                        m.role === 'user'
                          ? 'gradient-cta text-white rounded-br-sm'
                          : 'bg-muted text-foreground rounded-bl-sm'
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
                {isSendingSupport && (
                  <div className="flex justify-start">
                    <div className="bg-muted px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm text-muted-foreground">…</div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="px-4 pt-3 border-t border-border flex gap-2 flex-shrink-0">
                <input
                  value={supportInput}
                  onChange={(e) => setSupportInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isSendingSupport) {
                      sendSupportMessage(supportInput.trim());
                    }
                  }}
                  placeholder="Message Nomaya support…"
                  className="flex-1 bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <button
                  disabled={isSendingSupport || !supportInput.trim()}
                  onClick={() => sendSupportMessage(supportInput.trim())}
                  className="w-10 h-10 rounded-xl gradient-cta flex items-center justify-center disabled:opacity-40"
                >
                  <MessageCircle size={16} className="text-white" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Feedback form sheet */}
        {showFeedbackForm && (
          <div className="fixed inset-0 z-[300] flex items-end justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowFeedbackForm(false)} />
            <div className="relative w-full max-w-sm bg-card rounded-t-3xl p-6 space-y-5" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 2.5rem)" }}>
              <div className="w-10 h-1 bg-border rounded-full mx-auto" />
              {feedbackSubmitted ? (
                <div className="text-center py-6 space-y-3">
                  <p className="text-3xl">💜</p>
                  <p className="font-serif text-xl font-medium text-foreground">Thank you!</p>
                  <p className="text-sm text-muted-foreground">Your feedback helps us make Nomaya better for everyone.</p>
                  <button onClick={() => setShowFeedbackForm(false)} className="mt-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium">
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <h2 className="font-serif text-xl font-medium text-foreground mb-1">Give us feedback</h2>
                    <p className="text-xs text-muted-foreground">Your thoughts help us improve Nomaya.</p>
                  </div>

                  {/* Star rating */}
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">How are we doing?</p>
                    <div className="flex gap-3 justify-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setFeedbackRating(star)}
                          className={`text-3xl transition-transform active:scale-110 ${star <= feedbackRating ? 'opacity-100' : 'opacity-30'}`}
                        >
                          ⭐
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Tell us more</p>
                    <textarea
                      value={feedbackMessage}
                      onChange={(e) => setFeedbackMessage(e.target.value)}
                      placeholder="What could we do better? What do you love?"
                      rows={4}
                      className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
                    />
                  </div>

                  <button
                    disabled={feedbackRating === 0 || isSubmittingFeedback}
                    onClick={async () => {
                      setIsSubmittingFeedback(true);
                      const { error } = await supabase.from('feedback').insert({
                        user_id: user?.id,
                        rating: feedbackRating,
                        message: feedbackMessage,
                      });
                      if (!error) setFeedbackSubmitted(true);
                      setIsSubmittingFeedback(false);
                    }}
                    className="w-full py-4 rounded-2xl gradient-cta text-white font-medium text-base disabled:opacity-50"
                  >
                    {isSubmittingFeedback ? "Sending…" : "Send feedback"}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Main profile view ────────────────────────────────────────────────────────
  return (
    <div className="mobile-container flex flex-col bg-background pb-screen-bottom">

      {/* Hidden file input — fallback for simulator/web */}
      <input
        ref={avatarFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarFileChange}
      />

      {/* ── Hero photo ── */}
      <div className="relative w-full" style={{ height: 300 }}>
        {/* Entire photo area is tappable to change avatar */}
        <button
          disabled={isUploadingAvatar}
          onClick={handleAvatarUpload}
          className="w-full h-full block disabled:opacity-70 active:opacity-80 transition-opacity"
        >
          {(localAvatarUrl ?? profile?.avatar_url) ? (
            <img src={localAvatarUrl ?? profile!.avatar_url!} alt={profile?.name ?? ""} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-secondary flex flex-col items-center justify-center gap-2">
              <span className="text-8xl opacity-40">🌸</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Camera size={12} /> Tap to add photo
              </span>
            </div>
          )}
        </button>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent pointer-events-none" />

        {/* Settings button */}
        <button
          onClick={() => setShowSettings(true)}
          className="absolute top-12 right-4 w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center"
        >
          <Settings size={16} className="text-foreground" />
        </button>

        {/* Camera badge — visible when photo already set */}
        {(localAvatarUrl ?? profile?.avatar_url) && (
          <button
            disabled={isUploadingAvatar}
            onClick={handleAvatarUpload}
            className="absolute top-12 left-4 w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center disabled:opacity-50"
          >
            <Camera size={16} className="text-foreground" />
          </button>
        )}

        {/* Name overlay */}
        <div className="absolute bottom-4 left-5 right-5">
          <h1 className="font-serif text-3xl font-medium text-foreground leading-tight">{displayName ?? (lang === 'es' ? 'Miembro' : 'Member')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {profile?.city ? `${profile.city} · ` : ""}{t("profile.member_since")} {memberSince}
          </p>
        </div>
      </div>

      {/* Verification banner */}
      {profile?.verification_status === "unverified" && (
        <button
          onClick={() => setShowVerification(true)}
          className="mx-5 mt-4 bg-card rounded-2xl p-4 shadow-soft flex items-center gap-3 text-left border border-primary/30"
        >
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Shield size={18} className="text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground leading-snug">{t("profile.verification_banner")}</p>
          </div>
          <span className="text-xs font-medium text-primary flex-shrink-0">{t("profile.verify_now")}</span>
        </button>
      )}

      {profile?.verification_status === "pending" && (
        <div className="mx-5 mt-4 bg-card rounded-2xl p-4 shadow-soft flex items-center gap-3 border border-yellow-400/30">
          <div className="w-9 h-9 rounded-full bg-yellow-400/10 flex items-center justify-center flex-shrink-0 text-lg">
            ⏳
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground leading-snug">
              {lang === 'es' ? "Verificación en revisión" : "Verification under review"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {lang === 'es'
                ? "Estamos revisando tu ID. Te notificaremos en menos de 24h."
                : "We're reviewing your ID. You'll be notified within 24 hours."}
            </p>
          </div>
        </div>
      )}

      {/* ── Profile card ── */}
      <div className="mx-5 mt-4 bg-card rounded-2xl p-5 shadow-card">

        {/* Bio */}
        {editingBio ? (
          <div className="space-y-2">
            <textarea
              value={bioValue}
              onChange={(e) => setBioValue(e.target.value)}
              placeholder="Designer. Ceramics enthusiast. Dog mum."
              rows={2}
              maxLength={160}
              className="w-full bg-muted rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
            />
            <div className="flex gap-2">
              <button onClick={saveBio} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
                <Check size={12} /> {t("profile.save")}
              </button>
              <button onClick={() => setEditingBio(false)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs">
                <X size={12} /> {t("profile.cancel")}
              </button>
            </div>
          </div>
        ) : (
          <button className="w-full text-left flex items-start justify-between gap-2" onClick={() => { setBioValue(profile?.bio ?? ""); setEditingBio(true); }}>
            <p className="text-sm text-muted-foreground leading-snug flex-1">
              {profile?.bio || <span className="italic">{t("profile.add_bio")}</span>}
            </p>
            <Edit2 size={13} className="text-muted-foreground flex-shrink-0 mt-0.5" />
          </button>
        )}

        {/* Stats */}
        <div className="flex gap-4 mt-4 pt-4 border-t border-border">
          <div className="flex-1 text-center">
            <p className="font-serif text-2xl font-medium text-foreground">{bookings.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t("profile.events")}</p>
          </div>
          <div className="w-px bg-border" />
          <div className="flex-1 text-center">
            <p className="font-serif text-2xl font-medium text-foreground">{myCircles.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t("profile.circles")}</p>
          </div>
        </div>

        {/* Badges */}
        {(ritualBadge || isFoundingMember || recognitionBadges.length > 0) && (
          <button
            onClick={() => setShowBadgeModal(true)}
            className="mt-4 pt-4 border-t border-border w-full text-left active:opacity-80"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {lang === 'es' ? "Insignias" : "Badges"}
              </p>
              <ChevronRight size={12} className="text-muted-foreground" />
            </div>
            <div className="flex flex-wrap gap-2">
              {isFoundingMember && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                  style={{ background: "rgba(255,195,30,0.28)", border: "1px solid rgba(255,195,30,0.45)" }}>
                  🏛️ Founding Member
                </span>
              )}
              {ritualBadge && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                  style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.32)" }}>
                  {ritualBadge.icon} {ritualBadge.label}
                </span>
              )}
              {recognitionBadges.map(b => (
                <span key={b.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                  style={{ background: "rgba(255,255,255,0.13)", border: "1px solid rgba(255,255,255,0.22)" }}>
                  {b.icon} {b.label}
                </span>
              ))}
            </div>
          </button>
        )}

        {/* Member card */}
        <button
          onClick={() => setShowMemberCard(true)}
          className="mt-4 pt-4 border-t border-border w-full flex items-center gap-3 active:opacity-70 transition-opacity"
        >
          {/* Mini card thumbnail */}
          <div className="relative w-16 h-10 rounded-lg flex-shrink-0 overflow-hidden"
            style={{ background: "linear-gradient(135deg, #2e235a 0%, #7058c8 100%)" }}>
            <div className="absolute -right-2 -top-2 w-10 h-10 rounded-full bg-white/10" />
            <div className="absolute -right-1 -top-1 w-6 h-6 rounded-full bg-white/8" />
            <div className="absolute bottom-1.5 left-2">
              <p className="text-white/60 text-[6px] tracking-[0.2em] uppercase font-medium">Nomaya</p>
            </div>
          </div>
          {/* Text */}
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-foreground leading-tight">
              {displayName ?? (lang === 'es' ? "Tu tarjeta de miembro" : "Your member card")}
            </p>
            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{memberId}</p>
          </div>
          <ChevronRight size={14} className="text-muted-foreground flex-shrink-0" />
        </button>
      </div>

      {/* About me */}
      <div className="mx-5 mt-4 bg-card rounded-2xl p-4 shadow-soft">
        <h3 className="font-serif text-base font-medium text-foreground mb-3">{t("profile.about_me")}</h3>

        {/* Birthday */}
        <div className="flex items-center justify-between py-2 border-b border-border">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{t("profile.birthday")}</p>
            {editingBirthday ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="date"
                  value={birthdayValue}
                  onChange={(e) => setBirthdayValue(e.target.value)}
                  className="bg-muted rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none"
                />
                <button onClick={saveBirthday} className="text-primary text-xs font-medium">{t("profile.save")}</button>
                <button onClick={() => setEditingBirthday(false)} className="text-muted-foreground text-xs">{t("profile.cancel")}</button>
              </div>
            ) : (
              <p className="text-sm text-foreground mt-0.5">
                {profile?.birthday
                  ? new Date(profile.birthday).toLocaleDateString("en-US", { month: "long", day: "numeric" })
                  : <span className="text-muted-foreground italic text-xs">{t("profile.add_birthday")}</span>
                }
              </p>
            )}
          </div>
          {!editingBirthday && (
            <button onClick={() => { setBirthdayValue(profile?.birthday ?? ""); setEditingBirthday(true); }}>
              <Edit2 size={13} className="text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Horoscope */}
        <button onClick={() => setShowHoroscopeSheet(true)} className="w-full flex items-center justify-between py-2 border-b border-border">
          <div className="text-left">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{t("profile.star_sign")}</p>
            <p className="text-sm text-foreground mt-0.5">
              {profile?.horoscope || <span className="text-muted-foreground italic text-xs">{t("profile.select_sign")}</span>}
            </p>
          </div>
          <Edit2 size={13} className="text-muted-foreground" />
        </button>

        {/* Social links */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{t("profile.social")}</p>
            <button onClick={() => { setLinks({ instagram_url: profile?.instagram_url ?? "", linkedin_url: profile?.linkedin_url ?? "", tiktok_url: profile?.tiktok_url ?? "" }); setEditingLinks(true); }}>
              <Edit2 size={13} className="text-muted-foreground" />
            </button>
          </div>
          {editingLinks ? (
            <div className="space-y-2">
              {[
                { key: "instagram_url" as const, icon: Instagram, placeholder: "instagram.com/yourhandle" },
                { key: "linkedin_url" as const, icon: Linkedin, placeholder: "linkedin.com/in/yourname" },
                { key: "tiktok_url" as const, icon: Music2, placeholder: "tiktok.com/@yourhandle" },
              ].map(({ key, icon: Icon, placeholder }) => (
                <div key={key} className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
                  <Icon size={14} className="text-muted-foreground flex-shrink-0" />
                  <input
                    value={links[key]}
                    onChange={(e) => setLinks((l) => ({ ...l, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <button onClick={saveLinks} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
                  <Check size={12} /> {t("profile.save")}
                </button>
                <button onClick={() => setEditingLinks(false)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs">
                  <X size={12} /> {t("profile.cancel")}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              {[
                { url: profile?.instagram_url, icon: Instagram, label: "Instagram" },
                { url: profile?.linkedin_url, icon: Linkedin, label: "LinkedIn" },
                { url: profile?.tiktok_url, icon: Music2, label: "TikTok" },
              ].map(({ url, icon: Icon, label }) => (
                <div key={label} className={`flex items-center gap-1.5 text-xs ${url ? "text-foreground" : "text-muted-foreground"}`}>
                  <Icon size={13} />
                  {url ? <span className="truncate max-w-[80px]">{url.replace(/^https?:\/\//, "")}</span> : <span className="italic">{label}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Interests */}
      <div className="px-5 mt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-lg font-medium text-foreground">{t("profile.interests")}</h2>
          <button onClick={() => { setSelectedInterests(profile?.interests ?? []); setShowInterestsSheet(true); }} className="text-xs text-primary font-medium">Edit</button>
        </div>
        {profile?.interests && profile.interests.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((id) => {
              const interest = INTERESTS.find((i) => i.id === id);
              if (!interest) return null;
              return (
                <span key={id} className="px-3 py-1.5 rounded-full text-xs font-medium bg-card border border-border text-foreground">
                  {interest.emoji} {interest.label}
                </span>
              );
            })}
          </div>
        ) : (
          <button onClick={() => { setSelectedInterests([]); setShowInterestsSheet(true); }} className="text-sm text-muted-foreground italic">
            Add your interests →
          </button>
        )}
      </div>

      {/* ── Sign out ── */}
      <div className="px-5 mt-6 mb-2">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-card border border-border text-muted-foreground text-sm font-medium shadow-soft active:bg-muted/30 transition-all"
        >
          <LogOut size={15} />
          {t("profile.sign_out")}
        </button>
      </div>

      {/* ── Sheets ── */}

      {/* Horoscope sheet */}
      {showHoroscopeSheet && (
        <div className="fixed inset-0 z-[300] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowHoroscopeSheet(false)} />
          <div className="relative w-full max-w-sm bg-card rounded-t-3xl p-6" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 2.5rem)" }}>
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />
            <h2 className="font-serif text-xl font-medium text-foreground mb-4">{t("profile.your_star_sign")}</h2>
            <div className="grid grid-cols-3 gap-2">
              {STAR_SIGNS.map((sign) => (
                <button
                  key={sign}
                  onClick={() => saveHoroscope(sign)}
                  className={`py-2.5 rounded-xl text-xs font-medium border transition-all ${
                    profile?.horoscope === sign
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-foreground border-border"
                  }`}
                >
                  {sign}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Interests sheet */}
      {showInterestsSheet && (
        <div className="fixed inset-0 z-[300] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowInterestsSheet(false)} />
          <div className="relative w-full max-w-sm bg-card rounded-t-3xl pt-6 flex flex-col" style={{ maxHeight: "88dvh" }}>
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-3" />
            <h2 className="font-serif text-xl font-medium text-foreground mb-3 px-6">{t("profile.select_interests")}</h2>
            <div className="flex flex-wrap gap-2 px-6 overflow-y-auto flex-1 pb-4">
              {INTERESTS.map((interest) => {
                const isSelected = selectedInterests.includes(interest.id);
                return (
                  <button
                    key={interest.id}
                    onClick={() => setSelectedInterests((prev) =>
                      prev.includes(interest.id) ? prev.filter((i) => i !== interest.id) : [...prev, interest.id]
                    )}
                    className={`px-4 py-2.5 rounded-full text-sm font-medium border transition-all duration-200 active:scale-[0.97] ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-foreground border-border"
                    }`}
                  >
                    {interest.label}
                  </button>
                );
              })}
            </div>
            <div className="px-6 pt-4 border-t border-border flex-shrink-0" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1.5rem)" }}>
              <button onClick={saveInterests} className="w-full py-4 rounded-2xl gradient-cta text-white font-medium text-base">
                {t("profile.save")} · {selectedInterests.length} selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Language sheet */}
      {showLanguageSheet && (
        <div className="fixed inset-0 z-[300] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLanguageSheet(false)} />
          <div className="relative w-full max-w-sm bg-card rounded-t-3xl p-6 space-y-3" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 2rem)" }}>
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-2" />
            <h2 className="font-serif text-xl font-medium text-foreground">{t("settings.choose_language")}</h2>
            {[
              { code: "en" as const, label: "English", flag: "🇬🇧" },
              { code: "es" as const, label: "Español", flag: "🇪🇸" },
            ].map((l) => (
              <button
                key={l.code}
                onClick={() => saveLanguage(l.code)}
                className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl border transition-all ${
                  lang === l.code
                    ? "bg-primary/10 border-primary text-foreground"
                    : "bg-muted border-border text-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{l.flag}</span>
                  <span className="font-medium text-sm">{l.label}</span>
                </div>
                {lang === l.code && <Check size={15} className="text-primary" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Badge modal */}
      {showBadgeModal && (() => {
        const TIERS = [
          { icon: "🌸", label: "Founding Circle",  perk: "Access to all Nomaya events",          events: 1 },
          { icon: "✨", label: "Inner Circle",      perk: "Priority booking + 1 guest pass",      events: 3 },
          { icon: "🔮", label: "Keeper",            perk: "Exclusive circles + Nomaya credits",   events: 5 },
          { icon: "👁️", label: "Circle Host",       perk: "Host your own Nomaya event",           events: 8 },
        ];
        const nextTier = TIERS.find((t) => bookings.length < t.events);
        const progressPct = nextTier ? Math.round((bookings.length / nextTier.events) * 100) : 100;
        return (
          <div className="fixed inset-0 z-[300] flex items-end justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowBadgeModal(false)} />
            <div className="relative w-full max-w-sm bg-card rounded-t-3xl overflow-y-auto" style={{ maxHeight: "90dvh", paddingBottom: "max(env(safe-area-inset-bottom), 2rem)" }}>
              <div className="w-10 h-1 bg-border rounded-full mx-auto mt-4" />
              <div className="px-6 pt-4 pb-5 text-center border-b border-border">
                <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">Your Circle</p>
                <p className="font-serif text-xl text-foreground leading-snug">The more you show up,<br />the more doors open</p>
              </div>
              <div className="px-6 py-4 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Events attended</span>
                  <span className="text-xs font-medium text-foreground">{bookings.length}{nextTier ? ` / ${nextTier.events}` : ""}</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${progressPct}%`, background: "hsl(252 75% 80%)" }} />
                </div>
                {nextTier && <p className="text-[10px] text-muted-foreground mt-1.5">{nextTier.events - bookings.length} more to unlock {nextTier.label}</p>}
              </div>
              {TIERS.map((tier, i) => {
                const earned = bookings.length >= tier.events;
                return (
                  <div key={tier.label} className={`px-6 py-4 flex items-center gap-4 ${i < TIERS.length - 1 ? "border-b border-border" : ""} ${!earned ? "opacity-45" : ""}`}>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0" style={{ background: earned ? "hsl(252 75% 93%)" : "hsl(252 20% 50% / 0.15)" }}>
                      {tier.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{tier.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{tier.perk}</p>
                    </div>
                    {earned ? (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <Check size={11} className="text-primary-foreground" />
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground flex-shrink-0 whitespace-nowrap">{tier.events} events</p>
                    )}
                  </div>
                );
              })}
              {isFoundingMember && (
                <div className="px-6 py-4 border-t border-border flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">🏛️</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Founding Member</p>
                    <p className="text-xs text-muted-foreground mt-0.5">You joined Nomaya in the very first cohort.</p>
                  </div>
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Check size={11} className="text-primary-foreground" />
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Member card modal */}
      {showMemberCard && (
        <div className="fixed inset-0 z-[300] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowMemberCard(false)} />
          <div className="relative w-full max-w-sm bg-card rounded-t-3xl p-6" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 2.5rem)" }}>
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />

            {/* Heading */}
            <h2 className="font-serif text-xl font-medium text-foreground">
              {lang === 'es' ? "Tu tarjeta Nomaya" : "Your Nomaya member card"}
            </h2>
            <p className="text-xs text-muted-foreground mt-1 mb-5 leading-relaxed">
              {lang === 'es'
                ? "Tu pase personal a la comunidad Nomaya. Muéstralo en los eventos para hacer check-in y acceder a experiencias exclusivas para miembros."
                : "Your personal pass to the Nomaya community. Show it at events to check in and access member-only experiences."}
            </p>

            {/* Card visual */}
            <div className="rounded-2xl overflow-hidden shadow-card mb-4" style={{ background: "#5f5095" }}>
              <div className="px-6 pt-6 pb-4 border-b border-white/10 flex justify-center">
                <Logo className="h-20 w-auto mx-auto object-contain opacity-95" />
              </div>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-white/40 mb-1">Membership Number</p>
                  <p className="font-mono text-xl font-semibold text-white tracking-wider">{memberId}</p>
                </div>
                <div>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-white/40 mb-1">Full Name</p>
                  <p className="font-serif text-lg text-white">{displayName ?? (lang === 'es' ? 'Miembro' : 'Member')}</p>
                </div>
                <div className="pt-1 border-t border-white/10">
                  <p className="text-xs text-white/40">{profile?.city || "Madrid"} · Member since {memberSince}</p>
                </div>
              </div>
            </div>

            {/* Apple Wallet button */}
            <button
              onClick={handleAddToWallet}
              disabled={walletLoading}
              className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm text-white disabled:opacity-60"
              style={{ background: "#000" }}
            >
              {walletLoading ? (
                <svg className="animate-spin" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              )}
              {walletLoading
                ? (lang === 'es' ? "Generando pase..." : "Generating pass...")
                : (lang === 'es' ? "Guardar en Apple Wallet" : "Add to Apple Wallet")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
