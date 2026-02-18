# Nomaya

A curated community app for women — discover events, join circles, and build real belonging.

## Stack

- **Frontend** — Vite + React + TypeScript + shadcn/ui + TailwindCSS
- **Backend** — Supabase (PostgreSQL + Auth + RLS)
- **Native** — Capacitor (iOS)
- **State** — TanStack React Query

## Local development

```sh
git clone https://github.com/clarapujadastico-ops/nomaya.git
cd nomaya
npm install
```

Create `.env.local` in the project root:

```
VITE_SUPABASE_URL=https://jtoftrghfwdffrkqejlq.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Then run:

```sh
npm run dev
# → http://localhost:8080
```

## Database setup

Run `supabase/schema.sql` once in the Supabase SQL editor.
It creates all tables, the `events_with_spots` view, RLS policies, and seeds 5 sample events.

## Architecture

```
Supabase
  ├── auth.users        ← Supabase built-in auth
  ├── profiles          ← extended user data (linked to auth.users)
  ├── events            ← curated events
  ├── categories        ← event categories
  ├── bookings          ← user ↔ event reservations
  └── events_with_spots ← view (events + category + spots_left)

React App
  ├── AuthContext       ← global session state
  ├── TanStack Query    ← server state (events, profile, bookings)
  └── Supabase SDK      ← DB + auth calls
```

## Auth flow

```
App start
  ↓
AuthContext checks Supabase session
  ├── No session → AuthScreen (login / signup)
  │     ↓ (signup)
  │   OnboardingFlow → saves profile to Supabase
  │     ↓
  │   Main app
  └── Session + profile → Main app (skip onboarding)
```

## iOS build

Requires Xcode (download from the Mac App Store).

```sh
npm run build
npx cap sync ios
open ios/App/App.xcodeproj
# → Select simulator or device → Run ▶
```

## Project structure

```
src/
  components/
    AuthScreen.tsx       ← login / signup UI
    OnboardingFlow.tsx   ← language → interests → profile
    EventsScreen.tsx     ← events list + detail + reserve
    MapScreen.tsx        ← simulated map with event pins
    ProfileScreen.tsx    ← user profile + bookings
    GroupsScreen.tsx     ← circles (mock, backend TBD)
  contexts/
    AuthContext.tsx       ← session provider + hooks
  hooks/
    useEvents.ts         ← fetch events from Supabase
    useProfile.ts        ← fetch + update user profile
    useBookings.ts       ← fetch + create + cancel bookings
  lib/
    supabase.ts          ← Supabase client singleton
  types/
    database.ts          ← TypeScript types + AppEvent + toAppEvent()
supabase/
  schema.sql             ← full schema, RLS, seed data
```

## Roadmap

- [ ] Xcode installed → first iOS simulator run
- [ ] Event images via Supabase Storage
- [ ] Circles backend (groups, memberships)
- [ ] Push notifications (Capacitor)
- [ ] Apple Developer account + App Store submission
