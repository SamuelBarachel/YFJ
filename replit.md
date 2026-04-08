# YFJ North America - Management System

## Overview
Official Management System for Youth for Jesus North America. A React/Vite SPA that provides AI-powered report generation, leadership roster management, and attendance tracking for church administration.

## Tech Stack
- **Frontend:** React 18 + Vite 5
- **Styling:** Tailwind CSS 3 with typography and animate plugins
- **Auth & Database:** Firebase (Authentication + Firestore)
- **AI:** Groq SDK (llama3-8b-8192 model)
- **Charts:** Recharts
- **Icons:** Lucide React
- **Content:** react-markdown + remark-gfm

## Project Structure
```
src/
  App.jsx          - Main dashboard and routing
  main.jsx         - Entry point with AuthProvider
  api/
    aiService.js   - Groq AI report generation service
    groqClient.js  - Groq client configuration
  assets/          - Global CSS styles
  components/
    AttendanceChart.jsx
    ReportDisplay.jsx
  context/
    AuthContext.jsx - Firebase Auth React context
  firebase/
    auth.js        - Auth helper functions
    config.js      - Firebase initialization (keys hardcoded)
```

## Environment Variables
- `VITE_GROQ_API_KEY` - Groq API key for AI report generation
- `VITE_GROQ_VERSION` - (optional) Groq model version, defaults to llama3-8b-8192

## Development
```bash
npm install
npm run dev   # runs on port 5000
```

## Deployment
Configured as a static site deployment:
- Build command: `npm run build`
- Public directory: `dist`

## Key Features
- **Gatekeeper Auth Portal** - Firebase Authentication login
- **AI Report Suite** - Converts raw meeting notes to professional reports
- **Leadership Roster** - Tracks leaders, topics, and confirmation status
- **Attendance Chart** - Data visualization with Recharts

## Notes
- Firebase config is hardcoded in `src/firebase/config.js`
- Groq client is initialized lazily (only if API key is present) to prevent startup crashes
- Vite dev server configured for `0.0.0.0:5000` with `allowedHosts: true` for Replit proxy compatibility
