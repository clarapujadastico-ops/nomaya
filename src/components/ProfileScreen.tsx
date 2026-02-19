import { useState } from "react";
import {
  ChevronRight, Globe, Bell, Heart, Star, LogOut, Camera, Instagram,
  Linkedin, Music2, Edit2, Check, X, Shield,
} from "lucide-react";
import { useCircles } from "@/hooks/useCircles";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useBookings } from "@/hooks/useBookings";
import { useLang } from "@/contexts/LanguageContext";
import { INTERESTS } from "@/data/mockData";
import { Logo } from "./Logo";
import { VerificationFlow } from "./VerificationFlow";

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
  const [selectedInterests, setSelectedInterests] = useState<string[]>(profile?.interests ?? []);
  const [notificationsOn, setNotificationsOn] = useState(true);

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : t("profile.recently");

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
    if (navigator.share) {
      navigator.share({ title: "Join Nomaya", text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => alert("Link copied!")).catch(() => {});
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
            <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow">
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

      {/* Settings */}
      <div className="px-5 mt-5">
        <h2 className="font-serif text-lg font-medium text-foreground mb-3">{t("profile.settings")}</h2>
        <div className="bg-card rounded-2xl overflow-hidden shadow-soft">
          {settingsItems.map(({ icon: Icon, label, value, onPress }, i) => (
            <button
              key={label}
              onClick={onPress}
              className={`w-full flex items-center justify-between px-4 py-4 text-left transition-all active:bg-muted/30 ${
                i < settingsItems.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={16} className="text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{value}</span>
                <ChevronRight size={14} className="text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="px-5 mt-4">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-border text-muted-foreground text-sm font-medium bg-card shadow-soft"
        >
          <LogOut size={14} />
          {t("profile.sign_out")}
        </button>
      </div>

      {/* Horoscope sheet */}
      {showHoroscopeSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowHoroscopeSheet(false)} />
          <div className="relative w-full max-w-sm bg-card rounded-t-3xl p-6 pb-10">
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
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowInterestsSheet(false)} />
          <div className="relative w-full max-w-sm bg-card rounded-t-3xl pt-6 pb-10 flex flex-col" style={{ maxHeight: "80vh" }}>
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />
            <h2 className="font-serif text-xl font-medium text-foreground mb-4 px-6">{t("profile.select_interests")}</h2>
            <div className="grid grid-cols-2 gap-3 px-6 overflow-y-auto flex-1 pb-4">
              {INTERESTS.map((interest) => {
                const isSelected = selectedInterests.includes(interest.id);
                return (
                  <button
                    key={interest.id}
                    onClick={() => setSelectedInterests((prev) =>
                      prev.includes(interest.id) ? prev.filter((i) => i !== interest.id) : [...prev, interest.id]
                    )}
                    className="relative rounded-2xl overflow-hidden text-left transition-all duration-200 active:scale-[0.97]"
                    style={{
                      height: 120,
                      background: interest.color,
                      outline: isSelected ? "3px solid hsl(38 82% 62%)" : "none",
                      outlineOffset: "2px",
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/90 flex items-center justify-center">
                        <Check size={14} style={{ color: interest.color }} />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 p-2.5">
                      <span style={{ fontSize: "1.75rem", lineHeight: 1 }}>{interest.emoji}</span>
                      <p className="text-xs font-medium text-white mt-0.5 leading-tight">{interest.label}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="px-6 pt-3 border-t border-border">
              <button
                onClick={saveInterests}
                className="w-full py-3.5 rounded-2xl gradient-cta text-white font-medium text-sm"
              >
                {t("profile.save")} · {selectedInterests.length} selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Language sheet */}
      {showLanguageSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLanguageSheet(false)} />
          <div className="relative w-full max-w-sm bg-card rounded-t-3xl p-6 pb-10 space-y-3">
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
    </div>
  );
}
