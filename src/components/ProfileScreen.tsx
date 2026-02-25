import { useState } from "react";
import {
  ChevronRight, Globe, Bell, Heart, Star, LogOut, Camera, Instagram,
  Linkedin, Music2, Edit2, Check, X, Shield, Pencil, Lock, MessageCircle,
  HelpCircle, Sparkles, FileText, ArrowLeft, CreditCard, Settings,
} from "lucide-react";
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { useCircles } from "@/hooks/useCircles";
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

export function ProfileScreen({ onLogout, onOpenCircle }: ProfileScreenProps) {
  const { t, lang, setLang } = useLang();
  const { data: profile, refetch: refetchProfile } = useProfile();
  const { data: bookings = [] } = useBookings();
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
  const [selectedInterests, setSelectedInterests] = useState<string[]>(profile?.interests ?? []);
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

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

  function handleReferral() {
    const text = "Join me on Nomaya — curated experiences for women. Download the app: https://nomaya.app";
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    if (typeof window !== "undefined") {
      window.open(waUrl, "_blank");
    }
  }

  function handleNotifications() {
    setNotificationsOn((n) => !n);
  }

  const settingsItems = [
    {
      icon: Heart,
      label: t("profile.interests"),
      value: profile?.interests?.length ? `${profile.interests.length} selected` : "None",
      onPress: () => { setSelectedInterests(profile?.interests ?? []); setShowInterestsSheet(true); },
    },
    {
      icon: Globe,
      label: t("profile.language"),
      value: lang === "es" ? "Español" : "English",
      onPress: () => setShowLanguageSheet(true),
    },
    {
      icon: Bell,
      label: t("profile.notifications"),
      value: notificationsOn ? t("profile.on") : t("profile.off"),
      onPress: handleNotifications,
    },
    {
      icon: Star,
      label: t("profile.referrals"),
      value: t("profile.invite_friends"),
      onPress: handleReferral,
    },
  ];

  if (showVerification) {
    return (
      <VerificationFlow
        onComplete={() => { setShowVerification(false); refetchProfile(); }}
        onSkip={() => { setShowVerification(false); refetchProfile(); }}
      />
    );
  }

  if (showSettings) {
    const settingsSections = [
      {
        title: null,
        items: [
          { icon: Pencil,        label: "Edit Profile",       value: null,    onPress: () => setShowSettings(false) },
          { icon: Bell,          label: t("profile.notifications"), value: notificationsOn ? t("profile.on") : t("profile.off"), onPress: handleNotifications },
          { icon: Lock,          label: "Privacy settings",   value: null,    onPress: () => {} },
        ],
      },
      {
        title: "Plan and credits",
        items: [
          { icon: Sparkles,  label: "Subscription",  value: ritualBadge?.label ?? "Member", onPress: () => {} },
          { icon: CreditCard, label: "Credits",       value: `${bookings.length * 4}`,       onPress: () => {} },
        ],
      },
      {
        title: "Help and support",
        items: [
          { icon: MessageCircle, label: "Chat with support", value: null, onPress: () => window.open("mailto:hola@nomaya.app") },
          { icon: HelpCircle,    label: "Help Center",        value: null, onPress: () => {} },
          { icon: Sparkles,      label: "Give us feedback",   value: null, onPress: () => window.open("mailto:hola@nomaya.app?subject=Feedback") },
        ],
      },
      {
        title: "Legal",
        items: [
          { icon: FileText, label: "Terms of Service", value: null, onPress: () => {} },
          { icon: FileText, label: "Privacy Policy",   value: null, onPress: () => {} },
        ],
      },
    ];

    return (
      <div className="mobile-container flex flex-col bg-background pb-24">
        {/* Header */}
        <div className="px-5 pt-14 pb-4 flex items-center gap-3">
          <button onClick={() => setShowSettings(false)} className="w-9 h-9 rounded-full bg-card flex items-center justify-center">
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <h1 className="font-serif text-2xl font-normal text-foreground">{t("profile.settings")}</h1>
        </div>

        <div className="px-5 space-y-6">
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
              onClick={handleReferral}
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
            className="text-primary text-sm font-medium px-1"
          >
            {t("profile.sign_out")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container flex flex-col bg-background pb-24">
      {/* Header */}
      <div className="px-5 pt-14 pb-2 text-center">
        <Logo />
        <h1 className="font-serif text-4xl font-normal text-foreground tracking-display">{t("profile.heading")}</h1>
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
            <p className="text-sm font-medium text-foreground leading-snug">
              {t("profile.verification_banner")}
            </p>
          </div>
          <span className="text-xs font-medium text-primary flex-shrink-0">{t("profile.verify_now")}</span>
        </button>
      )}

      {/* Profile card */}
      <div className="mx-5 mt-4 bg-card rounded-2xl p-5 shadow-card">
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.name} className="w-16 h-16 rounded-full object-cover border-2 border-border" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-secondary border-2 border-border flex items-center justify-center text-2xl">🌸</div>
            )}
            <button
              disabled={isUploadingAvatar}
              onClick={async () => {
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
              }}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow disabled:opacity-60"
            >
              <Camera size={12} className="text-primary-foreground" />
            </button>
          </div>

          <div className="flex-1">
            <h2 className="font-serif text-xl font-medium text-foreground">{profile?.name || "Member"}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {profile?.city ? `${profile.city} · ` : ""}{t("profile.member_since")} {memberSince}
            </p>
            {profile?.horoscope && (
              <p className="text-xs text-muted-foreground mt-0.5">{profile.horoscope}</p>
            )}
          </div>
        </div>

        {/* Bio */}
        <div className="mt-4 pt-4 border-t border-border">
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
        </div>

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

      {/* Past events */}
      {bookings.length > 0 && (
        <div className="px-5 mt-5">
          <h2 className="font-serif text-lg font-medium text-foreground mb-3">{t("profile.events_attended")}</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {bookings.map((booking) => {
              const ev = booking.event;
              if (!ev) return null;
              return (
                <div key={booking.id} className="flex-shrink-0 w-32 rounded-xl overflow-hidden shadow-soft">
                  <div className="h-20 relative">
                    {ev.image_url ? (
                      <img src={ev.image_url} alt={ev.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full" style={{ background: ev.category?.color ?? "hsl(252 30% 45%)" }} />
                    )}
                    <div className="absolute inset-0 bg-foreground/30" />
                    <span className="absolute bottom-1.5 left-2 text-[9px] uppercase tracking-wider text-white font-medium">
                      {formatDate(ev.date)}
                    </span>
                  </div>
                  <div className="bg-card px-2.5 py-2">
                    <p className="text-xs font-medium text-foreground leading-snug line-clamp-2">{ev.title}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* My circles */}
      <div className="px-5 mt-5">
        <h2 className="font-serif text-lg font-medium text-foreground mb-3">{t("profile.my_circles")}</h2>
        {myCircles.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No circles yet.</p>
        ) : (
          <div className="flex gap-3 flex-wrap">
            {myCircles.map((circle) => (
              <button
                key={circle.id}
                onClick={() => onOpenCircle?.(circle.id)}
                className="flex-shrink-0 w-24 bg-card rounded-xl p-3 shadow-soft text-center active:scale-[0.97] transition-transform"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg mx-auto mb-1.5" style={{ background: circle.categoryColor }}>
                  {circle.name.charAt(0)}
                </div>
                <p className="text-xs font-medium text-foreground leading-tight line-clamp-2">{circle.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{circle.memberCount} {t("circles.member_count_many")}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Settings button */}
      <div className="px-5 mt-5">
        <div className="bg-card rounded-2xl overflow-hidden shadow-soft">
          <button
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center justify-between px-4 py-4 text-left active:bg-muted/30"
          >
            <div className="flex items-center gap-3">
              <Settings size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{t("profile.settings")}</span>
            </div>
            <ChevronRight size={14} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Horoscope sheet */}
      {showHoroscopeSheet && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowHoroscopeSheet(false)} />
          <div
            className="relative w-full max-w-sm bg-card rounded-t-3xl p-6"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 2.5rem)" }}
          >
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
            <div
              className="px-6 pt-4 border-t border-border flex-shrink-0"
              style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1.5rem)" }}
            >
              <button
                onClick={saveInterests}
                className="w-full py-4 rounded-2xl gradient-cta text-white font-medium text-base"
              >
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
          <div
            className="relative w-full max-w-sm bg-card rounded-t-3xl p-6 space-y-3"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 2rem)" }}
          >
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

      {/* Badge rewards modal */}
      {showBadgeModal && (() => {
        const TIERS = [
          { icon: "🌸", label: "Founding Circle",  perk: "Access to all Nomaya events",          events: 1 },
          { icon: "✨", label: "Inner Circle",      perk: "Priority booking + 1 guest pass",      events: 3 },
          { icon: "🔮", label: "Keeper",            perk: "Exclusive circles + Nomaya credits",   events: 5 },
          { icon: "👁️", label: "Circle Host",       perk: "Host your own Nomaya event",           events: 8 },
        ];
        const nextTier = TIERS.find((t) => bookings.length < t.events);
        const progressPct = nextTier
          ? Math.round((bookings.length / nextTier.events) * 100)
          : 100;
        return (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowBadgeModal(false)} />
            <div
              className="relative w-full max-w-sm bg-card rounded-t-3xl overflow-y-auto"
              style={{ maxHeight: "90vh", paddingBottom: "max(env(safe-area-inset-bottom), 2rem)" }}
            >
              <div className="w-10 h-1 bg-border rounded-full mx-auto mt-4" />

              {/* Header */}
              <div className="px-6 pt-4 pb-5 text-center border-b border-border">
                <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">Your Circle</p>
                <p className="font-serif text-xl text-foreground leading-snug">
                  The more you show up,<br />the more doors open
                </p>
              </div>

              {/* Progress bar */}
              <div className="px-6 py-4 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Events attended</span>
                  <span className="text-xs font-medium text-foreground">
                    {bookings.length}{nextTier ? ` / ${nextTier.events}` : ""}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${progressPct}%`, background: "hsl(252 75% 80%)" }}
                  />
                </div>
                {nextTier && (
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    {nextTier.events - bookings.length} more to unlock {nextTier.label}
                  </p>
                )}
              </div>

              {/* Tiers */}
              {TIERS.map((tier, i) => {
                const earned = bookings.length >= tier.events;
                return (
                  <div
                    key={tier.label}
                    className={`px-6 py-4 flex items-center gap-4 ${i < TIERS.length - 1 ? "border-b border-border" : ""} ${!earned ? "opacity-45" : ""}`}
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: earned ? "hsl(252 75% 93%)" : "hsl(252 20% 50% / 0.15)" }}
                    >
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
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowMemberCard(false)} />
          <div
            className="relative w-full max-w-sm bg-card rounded-t-3xl p-6"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 2.5rem)" }}
          >
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />
            <h2 className="font-serif text-xl font-medium text-foreground mb-4">{t("member_card.your_card")}</h2>

            {/* The card */}
            <div
              className="rounded-2xl overflow-hidden shadow-card mb-5"
              style={{ background: "#5f5095" }}
            >
              {/* Logo header */}
              <div className="px-6 pt-6 pb-4 border-b border-white/10 flex justify-center">
                <Logo className="h-14 w-auto object-contain opacity-95" />
              </div>

              {/* Card body */}
              <div className="px-6 py-5 space-y-4">
                <div>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-white/40 mb-1">Membership Number</p>
                  <p className="font-mono text-xl font-semibold text-white tracking-wider">{memberId}</p>
                </div>
                <div>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-white/40 mb-1">Member Name</p>
                  <p className="font-serif text-lg text-white">{profile?.name || "Member"}</p>
                </div>
                <div className="pt-1 border-t border-white/10">
                  <p className="text-xs text-white/40">
                    {profile?.city || "Madrid"} · Member since {memberSince}
                  </p>
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
