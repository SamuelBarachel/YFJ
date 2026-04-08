# YFJ North America — Management System

## Overview
Official Management System for Youth for Jesus North America. A state-of-the-art React/Vite SPA with AI-powered report generation, full meeting management, notes, announcements, and a weekly agenda view.

**Motto:** *"I understood by the books..."* — Daniel 9:2

## Tech Stack
- **Frontend:** React 18 + Vite 5
- **Styling:** Tailwind CSS 3 + custom CSS (aurora animations, glassmorphism, Gemini gradient system)
- **Auth & Database:** Firebase Authentication + Firestore
- **AI:** Groq SDK (llama3-8b-8192) — strictly scoped to reports, traditions, events, and meeting details
- **Charts:** Recharts
- **Icons:** Lucide React
- **Markdown:** react-markdown + remark-gfm

## Design System
- **Palette:** Gemini Blue (#4285F4), Purple (#9B72F3), Coral (#D96570), Teal (#0DBFCF), Yellow (#FBBC04), Green (#34A853)
- **Background:** Deep cosmic dark (#04080F) with animated aurora blobs
- **Glass:** Multi-layer glassmorphism with Gemini gradient borders
- **Typography:** Inter (Google Fonts), hierarchical with gradient text accents
- **Animations:** Aurora drift, gradient flow, shimmer, float, pulse-glow, slide-up

## Application Sections

### Dashboard
Home overview with:
- Personalized welcome with date
- Stats cards (notes, weekly meetings, announcements, completed)
- Quick action shortcuts to all sections
- Upcoming meetings widget
- Key Traditions summary + link to full traditions document

### Notes & Records (`/notes`)
- Write and save meeting notes with title, timestamp, auto-filled author
- Search across all notes
- Note list with author and date metadata
- Character/word count display
- All data persisted in localStorage

### Week's Agenda (`/agenda`)
- 7-day calendar grid for the current week (or any week via navigation)
- "Today" highlighted with gradient
- Clickable days showing full meeting details
- Full week schedule list below
- Shows meeting type, time, chair, agenda, and creator

### Calendar & Roster (`/calendar`)
- Schedule meetings with: Title, Type, Meeting Chair, Date, Start/End Time, Location, Agenda, Status, Notes
- Filter by meeting type
- In-line status updates (mark complete)
- Edit and delete meetings
- Meeting types: Weekly Devotional, Monthly Coordination, Quarterly Review, Annual General Assembly, Kingdom Activity, Special Session

### AI Reports (`/reports`)
- Period selector: Weekly / Monthly / Quarterly / Yearly
- Automatically pulls meeting data and notes for the selected period
- AI generates professional reports starting with "I understood by the books..."
- Save generated reports (stored locally, up to 20)
- Export to Markdown (.md) file
- AI scope: reports, traditions, events, meeting details, Kingdom Activities ONLY

### Announcements (`/announcements`)
- Post announcements with title, content, category, and pin option
- Categories: General, Kingdom Activity, Urgent, Events, Leadership
- Live ticker at the top showing all announcements
- Pin/unpin functionality
- Author and date attribution

## Traditions Document
Located at `public/traditions.txt` — Full YFJ North America governance and traditions document covering:
- Foundational traditions and the motto
- Meeting structure and order of business
- Kingdom Activities protocols
- Leadership roles and responsibilities
- Attendance standards
- Report requirements
- Communication standards

## Authentication
- Firebase Authentication (email/password)
- Login portal ("Gatekeeper") with proper error messages
- User role displayed from Firestore
- Access restricted to authorized YFJ North America personnel

## Environment Variables
- `VITE_GROQ_API_KEY` — Groq API key for AI report generation
- `VITE_GROQ_VERSION` — (optional) Groq model, defaults to llama3-8b-8192

## Data Persistence
All user-generated data (notes, meetings, announcements, saved reports) is stored in **localStorage** for this static deployment.

Firebase Firestore is used for user profile/role data.

## Development
```bash
npm install
npm run dev   # Port 5000
```

## Deployment
Static site:
- Build: `npm run build`
- Public dir: `dist`
