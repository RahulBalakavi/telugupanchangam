# Telugu Panchangam - తెలుగు పంచాంగం

A beautiful Telugu Hindu calendar application with daily tithis, nakshatras, festivals, and temple events from important temples across India.

## Overview

This application provides:
- **Daily Panchang**: Tithi (lunar day), Nakshatra (lunar mansion), Paksha (lunar fortnight), sunrise/sunset times
- **Telugu Calendar**: Full month calendar with Telugu date overlays and special day indicators
- **Festivals**: Curated list of major Hindu festivals with Telugu and English descriptions
- **Temple Events**: Important temple activities from famous temples like Tirumala, Srisailam, Bhadrachalam, etc.
- **Notifications**: Browser notification settings for Ekadashi, Chaturthi, Purnima, and Amavasya

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

### Backend (Express)
- `server/panchang.ts` - Panchang calculation algorithms (tithi, nakshatra, moon phase)
- `server/data.ts` - Curated festival and temple event data
- `server/routes.ts` - API endpoints

### Shared
- `shared/schema.ts` - TypeScript interfaces and constants for tithis, nakshatras, Telugu months

## API Endpoints

- `GET /api/panchang/today` - Today's panchang data
- `GET /api/panchang/:date` - Panchang for specific date
- `GET /api/calendar/:year/:month` - Calendar days with festivals and events
- `GET /api/festivals/upcoming` - Upcoming festivals
- `GET /api/temple-events/upcoming` - Upcoming temple events
- `GET /api/notifications/preferences` - Get notification preferences
- `POST /api/notifications/preferences` - Save notification preferences

## Design System

Traditional Hindu/Telugu aesthetic with:
- Saffron/Orange primary colors (--primary: 25 90% 48%)
- Gold accent colors (--accent: 45 70% 55%)
- Warm cream backgrounds in light mode
- Dark mode with warm neutral tones
- Poppins font family for modern readability

## Key Calculations

### Tithi Calculation
- Based on synodic month (29.53 days)
- Reference: New Moon on January 6, 2000
- 30 tithis per lunar month (15 Shukla + 15 Krishna)

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
