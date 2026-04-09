# YFJ North America — Management System

## Overview
Official Management System for Youth for Jesus North America. A React/Vite SPA with AI-powered reports, Firebase Firestore cross-device sync, full meeting management, notes, announcements, sound notifications, meeting reminders, and PWA installability.

**Motto:** *"I understood by the books..."* — Daniel 9:2

## Tech Stack
- **Frontend:** React 18 + Vite 5
- **Styling:** Tailwind CSS 3 + custom CSS (aurora animations, glassmorphism, Gemini gradient system)
- **Auth & Database:** Firebase Authentication + Firestore (cross-device sync)
- **AI:** Groq SDK (llama3-8b-8192) via `src/api/aiService.js` + `src/api/groqClient.js`
- **Sound:** Web Audio API (no file dependencies) — church bell + reminder chime
- **Icons:** Lucide React
- **Markdown:** react-markdown + remark-gfm
- **PWA:** manifest.json + service worker in `public/`

## Design System
- **Palette:** Gemini Blue (#4285F4), Purple (#9B72F3), Coral (#D96570), Teal (#0DBFCF), Yellow (#FBBC04), Green (#34A853)
- **Background:** Deep cosmic dark (#04080F) with animated aurora blobs
- **Glass:** Multi-layer glassmorphism with Gemini gradient borders
- **Typography:** Inter (Google Fonts), hierarchical with gradient text accents
- **DO NOT CHANGE THE GUI DESIGN**

## File Structure
```
src/
  App.jsx                  — Main app, auth portal, login/register, dashboard, profile
  main.jsx                 — Entry, SW registration, audio unlock
  api/
    aiService.js           — Groq report generation
    groqClient.js          — Groq client setup
  assets/index.css         — Full design system CSS
  components/
    GreetingsToast.jsx     — "Greetings Brethren" popup with progress bar + sound
    AnnouncementsPanel.jsx — Role-targeted announcements with sound + Firestore
    CalendarRoster.jsx     — Firestore meetings + roster; completed=strikethrough
    NotesPanel.jsx         — Firestore notes with electronic signature
    ReportsPanel.jsx       — AI Cub reports; private by default; publish to Firestore
    WeekAgenda.jsx         — Weekly calendar grid from Firestore meetings
  context/AuthContext.jsx  — Firebase Auth + Firestore user profiles, ALL_ROLES
  firebase/config.js       — Firebase init
  firebase/firestoreHelpers.js — Helpers
  utils/notifications.js  — Web Audio church bell, reminder chimes, SW registration
public/
  manifest.json            — PWA manifest
  sw.js                    — Service worker
  traditions.txt           — YFJ traditions document
```

## Firestore Collections
- `meetings` — All meetings (global, all users see them)
- `notes` — Meeting notes (global, with role-based creator metadata)
- `announcements` — Announcements with `notifyRoles` array
- `roster` — Weekly meeting roster (chair + secretary per date)
- `users/{uid}` — User profile (role, territory, notificationsEnabled)
- `users/{uid}/reports` — Private AI reports per user
- `publishedReports` — Reports published for all to see

## Key Features
### Account Creation
- Register form with full name, email, password, role, territory (USA/Canada)
- All `ALL_ROLES`: YFJ Chair, Territory Coordinator, Regional Coordinator, Deacon, EY, YFJ
- Privileged: YFJ Chair, TC, Territory Coordinator, RC, Regional Coordinator, Deacon
- Restricted: EY, YFJ

### Sound Notifications ("Greetings Brethren")
- Church bell plays when a new announcement arrives in Firestore
- `AnnouncementListener` filters by `notifyRoles` — only plays for matching roles
- "Greetings Brethren" toast popup with 9-second progress bar
- Audio unlocked on first user gesture (click/touch)

### Meeting Reminders
- User opts in via Profile → "Enable Notifications"
- Schedules browser Notification + chime at 1 week, 1 day, 1 hour before meeting
- Filtered by `notifyRoles` on the meeting

### Reports (Cub AI)
- Private to creator by default (`users/{uid}/reports`)
- Publish button copies to `publishedReports` collection
- Restricted roles (EY, YFJ) see filtered data — no privileged-role notes
- Export to Markdown

### Completed Meetings
- CalendarRoster: active meetings shown normally at top
- Completed meetings shown with strikethrough at bottom, 60% opacity
- WeekAgenda: completed items shown with strikethrough in agenda list

### PWA / Mobile
- Mobile bottom tab bar with 6 tabs
- Back button on sub-pages
- Logout accessible from Profile modal (always visible on mobile)
- Profile modal: territory selector, notification toggle, logout
- Apple PWA meta tags in index.html
- manifest.json + sw.js in public/

## Roles
```js
ALL_ROLES = ['YFJ Chair','Territory Coordinator','Regional Coordinator','Deacon','EY','YFJ']
```

## Environment Variables
- `VITE_GROQ_API_KEY` — Groq API key for AI report generation
- Firebase config is hardcoded in `src/firebase/config.js`

## Development
```bash
npm install
npm run dev   # Port 5000
```
