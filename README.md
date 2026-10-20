# Telugu Panchangam - తెలుగు పంచాంగం

A beautiful Telugu Hindu calendar application with daily tithis, nakshatras, festivals, and temple events from important temples across India.

## Overview

This application provides:
- **Daily Panchang**: Tithi (lunar day), Nakshatra (lunar mansion), Paksha (lunar fortnight), sunrise/sunset times
- **Telugu Calendar**: Full month calendar with Telugu date overlays and special day indicators
- **Festivals**: Curated list of major Hindu festivals with Telugu and English descriptions
- **Temple Events**: Important temple activities from famous temples like Tirumala, Srisailam, Bhadrachalam, etc.
- **Push Notifications**: Background push notifications for special tithis (Ekadashi, Chaturthi, Shashthi, Ashtami, Purnima, Amavasya) - works even when app is closed on iOS 16.4+ and all Android devices
- **Timezone Support**: Users can select their timezone to see localized times for tithi, nakshatra, sunrise/sunset
- **Language Toggle**: Switch between Telugu and English for users who can't read Telugu script
- **No sign-in**: notification preferences and push subscriptions are scoped to the browser via a device id in localStorage (`client/src/lib/device-id.ts`), sent as the `X-Device-Id` header
- **iPhone Installable (PWA)**: Can be installed on iPhone home screen for app-like experience with background notifications

## Architecture

### Frontend (React + Vite)
- `client/src/pages/home.tsx` - Main calendar page with tabs
- `client/src/components/today-panchang.tsx` - Today's panchang display
- `client/src/components/calendar-grid.tsx` - Monthly calendar with Telugu dates
- `client/src/components/festivals-list.tsx` - Upcoming festivals list
- `client/src/components/temple-events.tsx` - Temple events section
- `client/src/components/notification-settings.tsx` - Notification preferences
- `client/src/components/day-detail-modal.tsx` - Day detail popup
- `client/src/components/moon-phase.tsx` - SVG moon phase visualization
- `client/src/components/timezone-selector.tsx` - Timezone selection dropdown
- `client/src/lib/device-id.ts` - Per-browser device id used to scope notifications

### Backend (Express)
- `server/panchang.ts` - Panchang calculation algorithms (tithi, nakshatra, moon phase)
- `server/data.ts` - Curated festival and temple event data
- `server/routes.ts` - API endpoints
- `server/push-service.ts` - Web Push notification service and scheduler
- `server/storage.ts` - Database operations for push subscriptions and preferences
- `server/seo.ts` - Server-rendered meta/JSON-LD for crawlers, plus /sitemap.xml

### Shared
- `shared/schema.ts` - TypeScript interfaces and constants for tithis, nakshatras, Telugu months

## API Endpoints

All endpoints are public. The notification endpoints identify the caller by an
`X-Device-Id` header (see `client/src/lib/device-id.ts`); requests without a
well-formed id get a 400.

- `GET /api/panchang/today?timezone=Asia/Kolkata` - Today's panchang data (timezone optional)
- `GET /api/panchang/:date?timezone=Asia/Kolkata` - Panchang for specific date
- `GET /api/calendar/:year/:month?timezone=Asia/Kolkata` - Calendar days with festivals and events
- `GET /api/festivals/upcoming` - Upcoming festivals
- `GET /api/temple-events/upcoming` - Upcoming temple events
- `GET /api/notifications/preferences` - Get notification preferences
- `POST /api/notifications/preferences` - Save notification preferences
- `GET /api/push/vapid-public-key` - Get VAPID public key for push subscription
- `POST /api/push/subscribe` - Subscribe to push notifications
- `POST /api/push/unsubscribe` - Unsubscribe from push notifications
- `GET /sitemap.xml` - Generated sitemap

## Push Notifications

### How It Works
1. User enables notifications in Settings tab
2. Browser requests permission and creates a push subscription
3. Subscription is saved to the database against this browser's device id
4. Server scheduler runs every 5 minutes checking each device's timezone
5. When it's that device's notification time and it's a special tithi day, a push notification is sent

### iOS PWA Requirements
- iOS 16.4+ required for push notifications
- App must be installed to home screen ("Add to Home Screen")
- User must grant notification permission from within the installed PWA

### Special Tithis for Notifications
- Chaturthi (4th) - Ganesha worship
- Shashthi (6th) - Subrahmanya worship  
- Ashtami (8th) - Durga worship
- Ekadashi (11th) - Fasting day
- Purnima (15th Shukla) - Full moon
- Amavasya (15th Krishna) - New moon

## Design System

Traditional Hindu/Telugu aesthetic with:
- Saffron/Orange primary colors (--primary: 25 90% 48%)
- Gold accent colors (--accent: 45 70% 55%)
- Warm cream backgrounds in light mode
- Dark mode with warm neutral tones
- Poppins font family for modern readability

## Key Calculations

### Astronomy Engine Integration
- Uses `astronomy-engine` npm library for professional-grade astronomical accuracy
- Tithi calculated from actual Sun-Moon ecliptic longitude difference (360°/30 = 12° per tithi)
- Nakshatra calculated from sidereal moon longitude with Lahiri ayanamsa correction
- Sunrise/sunset from accurate solar position calculations
- Telugu month derived from actual new moon searches (not fixed offsets)
- Accurate to ±1 arcminute, tested against JPL Horizons data

### Tithi Calculation
- Each tithi = 12 degrees of Sun-Moon elongation
- Calculations use sunrise time for each timezone (traditional Hindu panchang convention)
- 30 tithis per lunar month (15 Shukla + 15 Krishna)
- Binary search algorithm finds exact tithi start/end times

### Special Days
- Ekadashi (11th tithi) - Fasting day
- Chaturthi (4th tithi) - Ganesha worship
- Purnima (Full moon) - 15th of Shukla
- Amavasya (New moon) - 15th of Krishna

## Curated Data

### Festivals (2026)
- Makara Sankranti, Maha Shivaratri, Holi
- Ugadi, Sri Rama Navami, Hanuman Jayanti
- Varalakshmi Vratam, Vinayaka Chavithi
- Dussehra, Deepavali, Kartika Purnima

### Temple Events
- Tirumala Brahmotsavam and Vaikunta Ekadashi
- Srisailam Maha Shivaratri
- Bhadrachalam Sita Rama Kalyanam
- Kanipakam Vinayaka Chavithi
- And more from major temples across India

## Running locally

Use Node 20 (see `.nvmrc`) — `npm run dev` fails on Node 23, where `tsx`'s ESM
interop breaks the `astronomy-engine` import.

```bash
nvm use                # Node 20
npm install
cp .env.example .env   # fill in DATABASE_URL at minimum
npm run dev            # http://localhost:5000
```

`npm run build && npm start` runs the production bundle (Express serves the
built client from `dist/public`).

## Deployment

Hosted on [Render](https://render.com) as a Node web service, with Postgres on
[Neon](https://neon.tech). `render.yaml` is a blueprint for the service; the
build is `npm ci && npm run build` and the start command is `npm start`.

Required environment variables (set in the Render dashboard, see `.env.example`):

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | Neon pooled connection string, `sslmode=require` |
| `ANTHROPIC_API_KEY` | For the chat assistant; app runs without it |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Must stay the same forever — changing them silently invalidates every existing push subscription |
| `VAPID_SUBJECT` | `mailto:` contact for push services |

Schema changes go through `npm run db:push` (drizzle-kit) against
`DATABASE_URL`, which is also how the two tables were created on Neon.

The domain `mytelugupanchangam.space` is registered at Namecheap; its A record
points at the Render service. `server/seo.ts` hardcodes that host as the
canonical origin, so keep them in sync.

## Durga Saptashati reader count

The static learning deck uses `GET /api/decks/durga-saptashati/readers` for the public total and `POST` with `{ "readerId": "<browser UUID>" }` when a reader chooses Start. The service stores only a namespaced SHA-256 digest and first-start time in `durga_deck_readers`; it does not count repeat starts from the same browser again. This is an approximate browser count beginning with this release, not historical traffic or completed readings. Calendar analytics remain separate.

Startup creates this dedicated table if absent using the existing `DATABASE_URL`; it does not change existing tables. The table is also declared in the shared Drizzle schema. If setup or counting fails, the counter reports unavailability and the calendar remains usable. Cross-origin browser calls are allowed only from the published deck and Panchangam domains. No secret is embedded in the deck.

Run `DATABASE_URL=postgresql://<local-user>@127.0.0.1:<port>/durga_counter_test node --import tsx --test server/reader-counter.test.ts` against a disposable database named `durga_counter_test`. The HTTP flow checks duplicate/concurrent starts, persistent totals, validation and origin handling using real PostgreSQL.

### Public prayer-page views

Each Vrathams/Pujas detail page shows a bilingual “Viewed X times” badge after a successful count. POST `/api/vrathams/:slug/views` records an anonymous UUID event for that page opening and returns its total; GET reads the total without incrementing it. A new opening/reload counts again, while retries with the same event UUID count once. Selecting a prayer inside the app counts too. No browser/person identifier is saved by this counter, and views are not represented as unique people. Counts start when this feature goes live; older analytics are not backfilled. Visits directly to the separate GitHub Pages readers are not included.

The additive `prayer_page_views` table retains counts across service restarts. When storage is unavailable, the badge is hidden and reading/listening continues. This feature is staged pending resolution of the production database error also affecting the existing Durga reader counter; it has not yet been published.

Local integration check (requires the disposable `durga_counter_test` database): `node --import tsx --test server/prayer-views.test.ts` with `DATABASE_URL` pointing to that local database. The test clears only that counter table in the guarded test database.
