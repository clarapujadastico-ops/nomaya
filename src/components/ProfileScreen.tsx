import { useState } from "react";
import { ChevronRight, Globe, Bell, Heart, Star, LogOut, Camera, Instagram, Linkedin, Music2, Edit2, Check, X } from "lucide-react";
import { GROUPS } from "@/data/mockData";
import { useProfile } from "@/hooks/useProfile";
import { useUpdateProfile } from "@/hooks/useProfile";
import { useBookings } from "@/hooks/useBookings";
import { Logo } from "./Logo";

interface ProfileScreenProps {
  onLogout?: () => void;
}

const STAR_SIGNS = [
  "Aries ♈", "Taurus ♉", "Gemini ♊", "Cancer ♋", "Leo ♌", "Virgo ♍",
  "Libra ♎", "Scorpio ♏", "Sagittarius ♐", "Capricorn ♑", "Aquarius ♒", "Pisces ♓",
];

function formatDate(dateStr: string): string {
  const [, month, day] = dateStr.split('-')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[parseInt(month) - 1]} ${parseInt(day)}`
}

export function ProfileScreen({ onLogout }: ProfileScreenProps) {
  const { data: profile } = useProfile();
  const { data: bookings = [] } = useBookings();
  const { mutate: updateProfile } = useUpdateProfile();
  const myGroups = GROUPS.filter((g) => g.joined);

  const [editingBio, setEditingBio] = useState(false);
  const [bioValue, setBioValue] = useState("");
  const [editingLinks, setEditingLinks] = useState(false);
  const [links, setLinks] = useState({ instagram_url: "", linkedin_url: "", tiktok_url: "" });
  const [editingBirthday, setEditingBirthday] = useState(false);
  const [birthdayValue, setBirthdayValue] = useState("");
  const [showHoroscopeSheet, setShowHoroscopeSheet] = useState(false);

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Recently';

  const settingsItems = [
    { icon: Globe, label: "Language", value: profile?.language === 'es' ? 'Español' : 'English' },
    { icon: Bell, label: "Notifications", value: "On" },
    { icon: Heart, label: "My interests", value: profile?.interests?.length ? `${profile.interests.length} selected` : "None" },
    { icon: Star, label: "Referrals", value: "Invite friends" },
  ];

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

  return (
    <div className="mobile-container flex flex-col bg-background pb-24">
      {/* Header */}
      <div className="px-5 pt-14 pb-2">
        <Logo />
        <h1 className="font-serif text-4xl font-normal text-foreground tracking-display mt-3">Profile</h1>
      </div>

      {/* Profile card */}
      <div className="mx-5 mt-4 bg-card rounded-2xl p-5 shadow-card">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-border"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-secondary border-2 border-border flex items-center justify-center text-2xl">
                🌸
              </div>
            )}
            <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow">
              <Camera size={12} className="text-primary-foreground" />
            </button>
          </div>

          <div className="flex-1">
            <h2 className="font-serif text-xl font-medium text-foreground">
              {profile?.name || 'Member'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {profile?.city ? `${profile.city} · ` : ''}Member since {memberSince}
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
                  <Check size={12} /> Save
                </button>
                <button onClick={() => setEditingBio(false)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs">
                  <X size={12} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              className="w-full text-left flex items-start justify-between gap-2"
              onClick={() => { setBioValue(profile?.bio ?? ""); setEditingBio(true); }}
            >
              <p className="text-sm text-muted-foreground leading-snug flex-1">
                {profile?.bio || <span className="italic">Add a short bio…</span>}
              </p>
              <Edit2 size={13} className="text-muted-foreground flex-shrink-0 mt-0.5" />
            </button>
          )}
        </div>

        <div className="flex gap-4 mt-4 pt-4 border-t border-border">
          <div className="flex-1 text-center">
            <p className="font-serif text-2xl font-medium text-foreground">{bookings.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Events</p>
          </div>
          <div className="w-px bg-border" />
          <div className="flex-1 text-center">
            <p className="font-serif text-2xl font-medium text-foreground">{myGroups.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Circles</p>
          </div>
          <div className="w-px bg-border" />
          <div className="flex-1 text-center">
            <p className="font-serif text-2xl font-medium text-foreground">0</p>
            <p className="text-xs text-muted-foreground mt-0.5">Connections</p>
          </div>
        </div>
      </div>

      {/* About me section */}
      <div className="mx-5 mt-4 bg-card rounded-2xl p-4 shadow-soft">
        <h3 className="font-serif text-base font-medium text-foreground mb-3">About me</h3>

        {/* Birthday */}
        <div className="flex items-center justify-between py-2 border-b border-border">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Birthday</p>
            {editingBirthday ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="date"
                  value={birthdayValue}
                  onChange={(e) => setBirthdayValue(e.target.value)}
                  className="bg-muted rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none"
                />
                <button onClick={saveBirthday} className="text-primary text-xs font-medium">Save</button>
                <button onClick={() => setEditingBirthday(false)} className="text-muted-foreground text-xs">Cancel</button>
              </div>
            ) : (
              <p className="text-sm text-foreground mt-0.5">
                {profile?.birthday ? new Date(profile.birthday).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : <span className="text-muted-foreground italic text-xs">Add birthday</span>}
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
        <button
          onClick={() => setShowHoroscopeSheet(true)}
          className="w-full flex items-center justify-between py-2 border-b border-border"
        >
          <div className="text-left">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Star sign</p>
            <p className="text-sm text-foreground mt-0.5">
              {profile?.horoscope || <span className="text-muted-foreground italic text-xs">Select your sign</span>}
            </p>
          </div>
          <Edit2 size={13} className="text-muted-foreground" />
        </button>

        {/* Social links */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Social</p>
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
                  <Check size={12} /> Save
                </button>
                <button onClick={() => setEditingLinks(false)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs">
                  <X size={12} /> Cancel
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
                <div
                  key={label}
                  className={`flex items-center gap-1.5 text-xs ${url ? "text-foreground" : "text-muted-foreground"}`}
                >
                  <Icon size={13} />
                  {url ? <span className="truncate max-w-[80px]">{url.replace(/^https?:\/\//, '')}</span> : <span className="italic">{label}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Past events */}
      {bookings.length > 0 && (
        <div className="px-5 mt-5">
          <h2 className="font-serif text-lg font-medium text-foreground mb-3">Events attended</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {bookings.map((booking) => {
              const ev = booking.event;
              if (!ev) return null;
              return (
                <div
                  key={booking.id}
                  className="flex-shrink-0 w-32 rounded-xl overflow-hidden shadow-soft"
                >
                  <div className="h-20 relative">
                    {ev.image_url ? (
                      <img src={ev.image_url} alt={ev.title} className="w-full h-full object-cover" />
                    ) : (
                      <div
                        className="w-full h-full"
                        style={{ background: ev.category?.color ?? 'hsl(252 30% 45%)' }}
                      />
                    )}
                    <div className="absolute inset-0 bg-foreground/30" />
                    <span className="absolute bottom-1.5 left-2 text-[9px] uppercase tracking-wider text-card font-medium">
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
        <h2 className="font-serif text-lg font-medium text-foreground mb-3">My circles</h2>
        <div className="flex gap-3">
          {myGroups.map((group) => (
            <div key={group.id} className="flex-1 bg-card rounded-xl p-3 shadow-soft text-center">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg mx-auto mb-1.5">
                🎨
              </div>
              <p className="text-xs font-medium text-foreground leading-tight">{group.name}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{group.members} members</p>
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="px-5 mt-5">
        <h2 className="font-serif text-lg font-medium text-foreground mb-3">Settings</h2>
        <div className="bg-card rounded-2xl overflow-hidden shadow-soft">
          {settingsItems.map(({ icon: Icon, label, value }, i) => (
            <button
              key={label}
              className={`w-full flex items-center justify-between px-4 py-4 text-left transition-all ${
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
          Sign out
        </button>
      </div>

      {/* Horoscope sheet */}
      {showHoroscopeSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => setShowHoroscopeSheet(false)} />
          <div className="relative w-full max-w-sm bg-card rounded-t-3xl p-6 pb-10">
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />
            <h2 className="font-serif text-xl font-medium text-foreground mb-4">Your star sign</h2>
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
    </div>
  );
}
