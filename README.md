# Nomaya

A curated iOS community app for women in Madrid — discover events, join interest-based circles, and build real belonging.

---

## Overview

Nomaya is a mobile-first community platform for women living in or visiting Madrid. Members can discover and book curated experiences (workshops, dinners, wellness sessions, day trips), join interest-based Circles to connect with like-minded women, track their community standing through a badge and tier system, and refer friends via a built-in referral programme. The app is fully bilingual (English / Spanish).

**Target platform:** iOS (App Store)
**Bundle ID:** `com.nomaya.app`
**Backend:** Supabase (project: `jtoftrghfwdffrkqejlq`)

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Vite + React + TypeScript |
| UI | shadcn/ui + TailwindCSS |
| State | TanStack React Query |
| Native | Capacitor (iOS) |
| Database | Supabase — PostgreSQL + Auth + RLS |
| Storage | Supabase Storage (`Events` bucket) |
| Payments | Stripe (via Supabase Edge Functions) |
| Maps | Mapbox (react-map-gl v8) |
| Push notifications | APNs via Capacitor + Supabase Edge Function |

---

## High-level architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        iOS App (Capacitor)                  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │               React + Vite (WebView)                 │   │
│  │                                                      │   │
│  │  Screens                  Contexts                   │   │
│  │  ├── EventsScreen         ├── AuthContext            │   │
│  │  ├── CirclesScreen        └── LanguageContext        │   │
│  │  ├── GrowScreen (Community)                          │   │
│  │  └── ProfileScreen        Hooks (React Query)        │   │
│  │                           ├── useEvents              │   │
│  │  Flows                    ├── useBookings            │   │
│  │  ├── OnboardingFlow       ├── useCircles             │   │
│  │  └── VerificationFlow     ├── useProfile             │   │
│  │                           └── usePushNotifications   │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                 │
│              Capacitor plugins                              │
│              (@capacitor/camera, @capacitor/push-           │
│               notifications, @capacitor-community/stripe)   │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS
┌───────────────────────────▼─────────────────────────────────┐
│                        Supabase                             │
│                                                             │
│  PostgreSQL (RLS enabled)      Auth                         │
│  ├── profiles                  └── auth.users               │
│  ├── events                                                 │
│  ├── categories                Storage                      │
│  ├── bookings                  └── Events bucket            │
│  ├── circles                       (event images, avatars,  │
│  ├── circle_memberships             verification photos)    │
│  ├── circle_messages                                        │
│  ├── circle_join_requests      Edge Functions               │
│  ├── event_attendance          ├── create-payment-intent    │
│  └── device_tokens             ├── cancel-booking           │
│                                └── send-push                │
│  Views                                                      │
│  ├── events_with_spots             Stripe API               │
│  └── circles_with_members                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Project structure

```
src/
  components/
    AuthScreen.tsx          ← login / signup
    OnboardingFlow.tsx      ← language → interests → profile → verify
    EventsScreen.tsx        ← events list + detail + Stripe payment + map
    CirclesScreen.tsx       ← circles, chat, join requests, admin
    GrowScreen.tsx          ← community progress + referral/rewards
    ProfileScreen.tsx       ← profile, badges, member card, settings
    VerificationFlow.tsx    ← ID + selfie upload for identity check
    EventCard.tsx           ← reusable card (featured / grid / list)
    Logo.tsx                ← Nomaya logo asset
  contexts/
    AuthContext.tsx          ← Supabase session provider
    LanguageContext.tsx      ← EN / ES toggle + t() helper
  hooks/
    useEvents.ts            ← events_with_spots view
    useProfile.ts           ← profile read + update
    useBookings.ts          ← bookings CRUD
    useCircles.ts           ← circles + memberships
    useCircleMessages.ts    ← real-time circle chat
    useFoundingMember.ts    ← auto-badge on event attendance
    usePushNotifications.ts ← APNs token registration
  locales/
    translations.ts         ← ~230 EN / ES translation keys
  assets/
    eventImages.ts          ← resolves event image (local override or Supabase Storage)
  lib/
    supabase.ts             ← Supabase client singleton
  types/
    database.ts             ← DB types, AppEvent, AppCircle, toAppEvent()
  pages/
    Index.tsx               ← root: tab navigation + app shell
supabase/
  functions/
    create-payment-intent/  ← Stripe PaymentIntent creation
    cancel-booking/         ← refund (Stripe) or credits, then cancel
    send-push/              ← APNs push via device_tokens table
```

---

## Key data flows

**Event booking (paid)**
```
User taps "Reserve"
  → create-payment-intent edge fn → Stripe PaymentIntent
  → Stripe Payment Sheet (native, Capacitor plugin)
  → on success: bookEvent() upserts booking row (confirmed)
```

**Cancellation**
```
User cancels
  → cancel-booking edge fn
  → if paid: Stripe refund OR Nomaya credits (+10% bonus)
  → booking status → "cancelled"
```

**Identity verification**
```
VerificationFlow
  → captures ID photo + selfie (Capacitor Camera)
  → uploads to Supabase Storage: verification/{userId}_id.jpg / _selfie.jpg
  → sets profiles.verification_status = "pending"
  → manual admin review
```

**Circles**
```
Public circles  → join instantly (circle_memberships insert)
Private circles → send join request → admin approves / declines
Circle chat     → real-time via Supabase subscriptions on circle_messages
```

---

## Auth & onboarding flow

```
App launch
  └── AuthContext checks Supabase session
        ├── No session → AuthScreen (email / password)
        │     └── Sign up → OnboardingFlow
        │           language → welcome slides → interests
        │           → profile (name, city, bio, photo)
        │           → VerificationFlow (optional, can skip)
        │           → Main app
        └── Active session → Main app (skip onboarding)
```

---

## Badge system

| Badge | Trigger |
|---|---|
| 🌸 Founding Circle | 1+ event booked |
| ✨ Inner Circle | 3+ events booked |
| 🔮 Keeper of the Circle | 5+ events booked |
| 🏛️ Founding Member | Attended a founding event (`event_attendance`) |
| 🎤 Top host | Admin of a circle OR 8+ bookings |
| 🌱 Early member | Has Founding Member badge |
| 🤝 Community builder | Member of 2+ circles |

---

## Local development

```sh
git clone https://github.com/clarapujadastico-ops/nomaya.git
cd nomaya
npm install
```

Create `.env.local`:
```
VITE_SUPABASE_URL=https://jtoftrghfwdffrkqejlq.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_MAPBOX_TOKEN=your-mapbox-token
```

```sh
npm run dev   # → http://localhost:8080
```

---

## iOS build

```sh
npm run build
npx cap sync ios
xcodebuild -project ios/App/App.xcodeproj -scheme App \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro Max'
```

Requires Xcode. For App Store distribution an Apple Developer account is needed.

---

## Supabase Edge Functions

```sh
npx supabase functions deploy <function-name> --project-ref jtoftrghfwdffrkqejlq
```

Required secrets: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`
