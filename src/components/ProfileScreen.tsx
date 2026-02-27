import { useState } from "react";
import {
  ChevronRight, Globe, Bell, Heart, Star, Camera, Instagram,
  Linkedin, Music2, Edit2, Check, X, Shield, Pencil, Lock, MessageCircle,
  HelpCircle, Sparkles, FileText, ArrowLeft, CreditCard, Settings, LogOut,
  Copy,
} from "lucide-react";
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { useCircles } from "@/hooks/useCircles";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useBookings } from "@/hooks/useBookings";
import { useLang } from "@/contexts/LanguageContext";
import { INTERESTS } from "@/data/mockData";
import { Logo } from "./Logo";
import { VerificationFlow } from "./VerificationFlow";
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
  return supabase.storage.from('Events').getPublicUrl(path).data.publicUrl;
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

function getBotResponse(msg: string): string {
  const lower = msg.toLowerCase();
  if (/hello|hi|hey|hola/.test(lower)) return "Hi! I'm Nomaya's assistant. How can I help you today? 💜";
  if (/book|reserv|spot/.test(lower)) return "To book an event, tap any event card then 'Reserve your spot'. Having trouble with a specific event?";
  if (/cancel/.test(lower)) return "You can cancel a reservation from the event detail page. Cancellation policies vary per event.";
  if (/circle|chat|group/.test(lower)) return "Circles are private groups where Nomaya members connect and plan together. Join or create one from the Circles tab!";
  if (/payment|pay|card|stripe|price|precio/.test(lower)) return "We accept card payments via Stripe. If you have payment issues, email us at hola@nomaya.app.";
  if (/verify|verification|id/.test(lower)) return "To verify your ID, go to your Profile and tap the verification banner. It takes just a minute!";
  if (/event/.test(lower)) return "We host workshops, wellness sessions, dinners and more across Madrid. Browse them all in the Events tab!";
  if (/refund/.test(lower)) return "For refund requests, please email us at hola@nomaya.app with your booking details and we'll sort it out.";
  if (/badge|founding|member/.test(lower)) return "Founding Member badges are awarded to those who attended our very first events. Keep attending to unlock more badges!";
  if (/password|login|account/.test(lower)) return "For account issues, try logging out and back in. If the problem persists, email hola@nomaya.app.";
  return "Thanks for reaching out! Our team will get back to you soon. You can also email us at hola@nomaya.app 💜";
}

export function ProfileScreen({ onLogout, onOpenCircle }: ProfileScreenProps) {
  const { t, lang, setLang } = useLang();
  const { data: profile, refetch: refetchProfile } = useProfile();
  const { data: bookings = [] } = useBookings();
  const { user } = useAuth();
  const { data: allCircles = [] } = useCircles();
  const { mutate: updateProfile } = useUpdateProfile();

  const myCircles = allCircles.filter((c) => c.isMember || c.isAdmin);

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
  const [showCreditsSheet, setShowCreditsSheet] = useState(false);
  const [showReferralSheet, setShowReferralSheet] = useState(false);
  const [referralCopied, setReferralCopied] = useState(false);
  const [showSupportChat, setShowSupportChat] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [supportMessages, setSupportMessages] = useState<Array<{ role: 'user' | 'bot'; content: string }>>([
    { role: 'bot', content: "Hi! I'm Nomaya's assistant. How can I help you today? 💜" },
  ]);
  const [supportInput, setSupportInput] = useState("");
  const [isSendingSupport, setIsSendingSupport] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(profile?.interests ?? []);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [notifSettings, setNotifSettings] = useState({
    newEvents: true,
    bookingReminders: true,
    circleMessages: true,
    joinUpdates: true,
  });

  useFoundingMemberBadge();

  const badges: string[] = (profile as { badges?: string[] } | null)?.badges ?? [];
  const isFoundingMember = badges.includes('founding_member');

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

  const memberId = profile?.id
    ? `NM-MAD-${String(parseInt(profile.id.replace(/-/g, '').substring(0, 6), 16) % 9000 + 1000).padStart(4, '0')}`
    : 'NM-MAD-????';

  const referralCode = profile?.id
    ? profile.id.replace(/-/g, '').substring(0, 8).toUpperCase()
    : '........';

  function copyReferralCode() {
    navigator.clipboard?.writeText(referralCode);
    setReferralCopied(true);
    setTimeout(() => setReferralCopied(false), 2000);
  }

  function shareReferral() {
    const text = `I'd love to see you at my table 💜 Join Nomaya — a curated community for women in Madrid. Use my code ${referralCode} for 20% off your first event + early access. https://nomaya.app`;
    if (navigator.share) {
      navigator.share({ title: 'Join Nomaya', text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text);
    }
  }

  function shareOnWhatsApp() {
    const text = `I'd love to see you at my table 💜 Join Nomaya — a curated community for women in Madrid. Use my code ${referralCode} for 20% off your first event + early access. https://nomaya.app`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  async function handleAvatarUpload() {
    if (!profile?.id) return;
    try {
      const photo = await CapCamera.getPhoto({
        quality: 85,
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
      });
      if (!photo.base64String) return;
      setIsUploadingAvatar(true);
      const url = await uploadAvatar(photo.base64String, profile.id);
      updateProfile({ avatar_url: url });
    } catch {
      // cancelled
    } finally {
      setIsUploadingAvatar(false);
    }
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
          { icon: Pencil, label: "Edit Profile", value: null, onPress: () => setShowSettings(false) },
          { icon: Bell, label: t("profile.notifications"), value: null, onPress: () => setShowNotificationsSheet(true) },
          { icon: Lock, label: "Privacy settings", value: null, onPress: () => window.open("https://nomaya.app/privacy", "_blank") },
        ],
      },
      {
        title: "Plan and credits",
        items: [
          { icon: Sparkles, label: "Subscription", value: ritualBadge?.label ?? "Member", onPress: () => setShowSubscriptionSheet(true) },
          { icon: CreditCard, label: "Credits", value: `${bookings.length * 4} credits`, onPress: () => setShowCreditsSheet(true) },
        ],
      },
      {
        title: "Help and support",
        items: [
          { icon: MessageCircle, label: "Chat with support", value: null, onPress: () => setShowSupportChat(true) },
          { icon: HelpCircle, label: "Help Center", value: null, onPress: () => window.open("mailto:hola@nomaya.app?subject=Help") },
          { icon: Sparkles, label: "Give us feedback", value: null, onPress: () => { setFeedbackRating(0); setFeedbackMessage(""); setFeedbackSubmitted(false); setShowFeedbackForm(true); } },
        ],
      },
      {
        title: "Legal",
        items: [
          { icon: FileText, label: "Terms of Service", value: null, onPress: () => window.open("https://nomaya.app/terms", "_blank") },
          { icon: FileText, label: "Privacy Policy", value: null, onPress: () => window.open("https://nomaya.app/privacy", "_blank") },
        ],
      },
    ];

    return (
      <div className="mobile-container flex flex-col bg-background pb-24">
        <div className="px-5 pt-14 pb-4 flex items-center gap-3">
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

          {/* Log out */}
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-primary text-sm font-medium px-1"
          >
            <LogOut size={15} />
            {t("profile.sign_out")}
          </button>
        </div>

        {/* Notifications sheet */}
        {showNotificationsSheet && (
          <div className="fixed inset-0 z-[200] flex items-end justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowNotificationsSheet(false)} />
            <div className="relative w-full max-w-sm bg-card rounded-t-3xl p-6 space-y-5" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 2.5rem)" }}>
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-2" />
              <h2 className="font-serif text-xl font-medium text-foreground">Notifications</h2>
              <div className="space-y-0 bg-muted rounded-2xl overflow-hidden">
                {[
                  { key: "newEvents" as const, label: "New events", desc: "When a new event is published" },
                  { key: "bookingReminders" as const, label: "Booking reminders", desc: "24h before an event you've joined" },
                  { key: "circleMessages" as const, label: "Circle messages", desc: "New messages in your circles" },
                  { key: "joinUpdates" as const, label: "Join request updates", desc: "When your circle request is reviewed" },
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
                Save preferences
              </button>
            </div>
          </div>
        )}

        {/* Subscription sheet */}
        {showSubscriptionSheet && (
          <div className="fixed inset-0 z-[200] flex items-end justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowSubscriptionSheet(false)} />
            <div className="relative w-full max-w-sm bg-card rounded-t-3xl p-6 space-y-4" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 2.5rem)" }}>
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-2" />
              <h2 className="font-serif text-xl font-medium text-foreground">Your membership</h2>
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
                  <span className="text-muted-foreground">Credits earned</span>
                  <span className="font-medium text-foreground">{bookings.length * 4}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Circles joined</span>
                  <span className="font-medium text-foreground">{myCircles.length}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                To update or cancel your membership, contact us at{" "}
                <button onClick={() => window.open("mailto:hola@nomaya.app")} className="text-primary underline">hola@nomaya.app</button>
              </p>
            </div>
          </div>
        )}

        {/* Support chat sheet */}
        {showSupportChat && (
          <div className="fixed inset-0 z-[200] flex flex-col">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowSupportChat(false)} />
            <div className="relative flex flex-col bg-card rounded-t-3xl mt-auto w-full max-w-sm mx-auto" style={{ height: "80vh", paddingBottom: "max(env(safe-area-inset-bottom), 1rem)" }}>
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
                      const msg = supportInput.trim();
                      if (!msg) return;
                      setIsSendingSupport(true);
                      setSupportInput("");
                      setSupportMessages(prev => [...prev, { role: 'user', content: msg }]);
                      supabase.from('support_messages').insert({ user_id: user?.id, content: msg, role: 'user' });
                      setTimeout(() => {
                        const reply = getBotResponse(msg);
                        setSupportMessages(prev => [...prev, { role: 'bot', content: reply }]);
                        supabase.from('support_messages').insert({ user_id: user?.id, content: reply, role: 'bot' });
                        setIsSendingSupport(false);
                      }, 900);
                    }
                  }}
                  placeholder="Message Nomaya support…"
                  className="flex-1 bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <button
                  disabled={isSendingSupport || !supportInput.trim()}
                  onClick={() => {
                    const msg = supportInput.trim();
                    if (!msg) return;
                    setIsSendingSupport(true);
                    setSupportInput("");
                    setSupportMessages(prev => [...prev, { role: 'user', content: msg }]);
                    supabase.from('support_messages').insert({ user_id: user?.id, content: msg, role: 'user' });
                    setTimeout(() => {
                      const reply = getBotResponse(msg);
                      setSupportMessages(prev => [...prev, { role: 'bot', content: reply }]);
                      supabase.from('support_messages').insert({ user_id: user?.id, content: reply, role: 'bot' });
                      setIsSendingSupport(false);
                    }, 900);
                  }}
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
          <div className="fixed inset-0 z-[200] flex items-end justify-center">
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
    <div className="mobile-container flex flex-col bg-background pb-24">

      {/* ── Hero photo ── */}
      <div className="relative w-full" style={{ height: 300 }}>
        {/* Entire photo area is tappable to change avatar */}
        <button
          disabled={isUploadingAvatar}
          onClick={handleAvatarUpload}
          className="w-full h-full block disabled:opacity-70 active:opacity-80 transition-opacity"
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={profile?.name ?? ""} className="w-full h-full object-cover" />
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
        {profile?.avatar_url && (
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
          <h1 className="font-serif text-3xl font-medium text-foreground leading-tight">{profile?.name || "Member"}</h1>
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
          <div className="w-px bg-border" />
          <div className="flex-1 text-center">
            <p className="font-serif text-2xl font-medium text-foreground">0</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t("profile.connections")}</p>
          </div>
        </div>

        {/* Badges */}
        {(ritualBadge || isFoundingMember) && (
          <button
            onClick={() => setShowBadgeModal(true)}
            className="mt-4 pt-4 border-t border-border flex items-center justify-center gap-3 flex-wrap w-full active:opacity-70"
          >
            {isFoundingMember && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-primary tracking-wide">
                <span>🏛️</span> Founding Member
              </span>
            )}
            {ritualBadge && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-primary tracking-wide">
                <span>{ritualBadge.icon}</span> {ritualBadge.label}
              </span>
            )}
            <ChevronRight size={12} className="text-muted-foreground ml-auto" />
          </button>
        )}

        {/* Member card */}
        <button
          onClick={() => setShowMemberCard(true)}
          className="mt-4 pt-4 border-t border-border flex items-center justify-between w-full"
        >
          <span className="text-xs font-medium text-muted-foreground">{t("member_card.your_card")}</span>
          <ChevronRight size={12} className="text-muted-foreground" />
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

      {/* ── Referral banner ── */}
      <button
        onClick={() => setShowReferralSheet(true)}
        className="mx-5 mt-5 rounded-2xl overflow-hidden shadow-card active:scale-[0.98] transition-all duration-200 w-[calc(100%-2.5rem)]"
        style={{ background: "hsl(252 30% 40%)" }}
      >
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex-1">
            <p className="text-[10px] text-white/50 uppercase tracking-widest mb-1">Grow the circle</p>
            <p className="font-serif text-white text-base leading-snug">Invite a woman you'd love<br />to see at your table.</p>
            <p className="text-xs text-white/60 mt-1.5">10€ credit · 20% off for her →</p>
          </div>
          <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center ml-3 flex-shrink-0">
            <span className="text-2xl">🎁</span>
          </div>
        </div>
      </button>

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
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
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
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowInterestsSheet(false)} />
          <div className="relative w-full max-w-sm bg-card rounded-t-3xl pt-6 flex flex-col" style={{ maxHeight: "88vh" }}>
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
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
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
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowBadgeModal(false)} />
            <div className="relative w-full max-w-sm bg-card rounded-t-3xl overflow-y-auto" style={{ maxHeight: "90vh", paddingBottom: "max(env(safe-area-inset-bottom), 2rem)" }}>
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

      {/* Credits sheet */}
      {showCreditsSheet && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreditsSheet(false)} />
          <div className="relative w-full max-w-sm bg-card rounded-t-3xl p-6 space-y-4" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 2.5rem)" }}>
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-2" />
            <h2 className="font-serif text-xl font-medium text-foreground">Your Credits</h2>
            <div className="bg-muted rounded-2xl p-5 text-center space-y-1">
              <p className="font-mono text-4xl font-bold text-foreground">{bookings.length * 4}</p>
              <p className="text-sm text-muted-foreground">credits available</p>
            </div>
            <div className="bg-muted rounded-2xl p-4 space-y-3">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">How to earn credits</p>
              {[
                { icon: "🎟️", label: "Attend an event", value: "+4 credits" },
                { icon: "🎁", label: "Refer a friend", value: "+10 credits" },
                { icon: "⭐", label: "Leave a review", value: "+2 credits" },
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{icon}</span>
                    <span className="text-sm text-foreground">{label}</span>
                  </div>
                  <span className="text-sm font-medium text-primary">{value}</span>
                </div>
              ))}
            </div>
            <div className="bg-muted rounded-2xl p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">How to use credits</p>
              <p className="text-sm text-foreground">Credits can be used as discounts on future event bookings. Coming soon!</p>
            </div>
            <button
              onClick={() => { setShowCreditsSheet(false); setShowReferralSheet(true); }}
              className="w-full py-4 rounded-2xl gradient-cta text-white font-medium text-sm"
            >
              Earn credits — Grow the circle
            </button>
          </div>
        </div>
      )}

      {/* Referral sheet */}
      {showReferralSheet && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowReferralSheet(false)} />
          <div className="relative w-full max-w-sm bg-card rounded-t-3xl p-6 space-y-4" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 2.5rem)" }}>
            <div className="w-10 h-1 bg-border rounded-full mx-auto" />
            <div className="pt-1 space-y-4">
              <h2 className="font-serif text-2xl font-normal text-foreground leading-snug">
                Invite a woman you'd love to see at your table.
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">She receives</p>
                  <div className="space-y-1.5">
                    {["20% off her first event", "Early access"].map((item) => (
                      <div key={item} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "hsl(var(--primary-foreground))" }} />
                        <span className="text-sm text-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">You receive</p>
                  <div className="space-y-1.5">
                    {["10€ Nomaya credit once she attends", "+1 Circle Point"].map((item) => (
                      <div key={item} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "hsl(var(--primary-foreground))" }} />
                        <span className="text-sm text-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground italic">Growing the circle has its privileges.</p>
            </div>

            {/* Referral code */}
            <div className="bg-muted rounded-2xl p-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Your referral code</p>
              <div className="flex items-center justify-between">
                <p className="font-mono text-2xl font-bold text-foreground tracking-wider">{referralCode}</p>
                <button
                  onClick={copyReferralCode}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border text-sm font-medium transition-all active:scale-95"
                  style={{ color: referralCopied ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))" }}
                >
                  {referralCopied ? <Check size={14} /> : <Copy size={14} />}
                  {referralCopied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            {/* WhatsApp */}
            <button
              onClick={shareOnWhatsApp}
              className="w-full py-4 rounded-2xl gradient-cta text-white font-medium text-sm flex items-center justify-center gap-2"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Share on WhatsApp
            </button>
          </div>
        </div>
      )}

      {/* Member card modal */}
      {showMemberCard && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowMemberCard(false)} />
          <div className="relative w-full max-w-sm bg-card rounded-t-3xl p-6" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 2.5rem)" }}>
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />
            <h2 className="font-serif text-xl font-medium text-foreground mb-4">{t("member_card.your_card")}</h2>
            <div className="rounded-2xl overflow-hidden shadow-card mb-5" style={{ background: "#5f5095" }}>
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
                  <p className="font-serif text-lg text-white">{profile?.name || "Member"}</p>
                </div>
                <div className="pt-1 border-t border-white/10">
                  <p className="text-xs text-white/40">{profile?.city || "Madrid"} · Member since {memberSince}</p>
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground mb-4">{t("member_card.wallet_soon")}</p>
            <button
              onClick={() => {
                const text = `Nomaya Member — ${profile?.name || "Member"}\n${ritualBadge ? ritualBadge.label : "Member"}\nMember since ${memberSince}\nnomaya.app`;
                if (navigator.share) { navigator.share({ title: "Nomaya Member Card", text }); }
                else { navigator.clipboard?.writeText(text); }
              }}
              className="w-full py-3.5 rounded-2xl gradient-cta text-white font-medium text-sm"
            >
              {t("member_card.share")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
