# ESTELA — Your Safety, Always.

ESTELA is an AI-powered personal safety web application designed to help people stay connected with their trusted contacts while traveling alone, commuting, attending events, or navigating potentially unsafe situations.

## Live Services

- **Web Frontend**: `http://localhost:5173`
- **Backend API & Escalation Engine**: `http://localhost:5000`

---

## Key Features

1. **Prominent Circular Red SOS Button**
   - High-contrast, tactile design with pulse animation.
   - Built-in cancellation window (3s) to prevent accidental alerts.
   - Dispatches emergency incident with real-time GPS coordinates and OpenStreetMap links.
   - Immediately notifies primary and backup trusted contacts.

2. **Timed Safety Sessions & Check-ins**
   - Configure session duration and check-in intervals (1m, 5m, 15m, etc.).
   - Big "I AM SAFE" one-tap confirmation button.
   - Real-time countdown timer tracking the next check-in deadline.

3. **Persistent Server-Side Escalation Worker**
   - Independent background worker running on the server (`escalationEngine.js`).
   - Automatically transitions sessions to `overdue` when a deadline passes.
   - Dispatches factual check-in advisories to primary guardians, followed by backup guardians if unacknowledged.
   - Runs regardless of whether the user's browser is closed or phone battery dies.

4. **Trusted Contacts Management**
   - Configure multiple contacts with Primary, Backup, or General guardian roles.
   - Granular preferences for SOS dispatch vs. missed check-in notifications.

5. **AI Voice Distress Monitoring**
   - Continuous audio recognition for distress keywords (`help me`, `danger`, `emergency`, `estela alert`).
   - Clearly labeled simulation testing mode with transparent confidence metrics.
   - Audio is never stored permanently.

6. **Interactive GPS Location Sharing**
   - Browser Geolocation API integration with Leaflet & OpenStreetMap.
   - Generates shareable map coordinates only when active.

7. **Verifiable Safety Audit Trail**
   - Complete history of check-ins, overdue events, and notification dispatch receipts.

---

## Project Structure

```
estela/
├── client/                     # Vite + React Frontend
│   ├── src/
│   │   ├── components/         # SosButton, CheckinCard, SafetyMap, AiDistressMonitor, Layout
│   │   ├── context/            # AuthContext, SafetyContext
│   │   ├── pages/              # LandingPage, AuthPage, Dashboard, SafetySessionPage, ContactsPage, SafetyHistoryPage, SettingsPage
│   │   ├── App.jsx             # React Router setup
│   │   └── index.css           # Tailwind CSS & SOS pulse animations
│   ├── package.json
│   └── vite.config.js
├── server/                     # Node.js + Express Backend
│   ├── database.js             # SQLite schema (Users, Contacts, Sessions, Incidents, Snapshots, Notifications)
│   ├── escalationEngine.js     # Persistent background escalation worker
│   ├── server.js               # REST API endpoints & JWT authentication
│   └── package.json
└── test_e2e.js                 # Automated full-cycle test suite
```

---

## Database Schema

- **`users`**: User identity, hashed passwords, medical notes, emergency instructions.
- **`trusted_contacts`**: Guardian relations, primary/backup tiers, notification channel preferences.
- **`safety_sessions`**: Session duration, interval frequency, checkin deadlines, status (`active`, `overdue`, `completed`).
- **`check_ins`**: Recorded "I AM SAFE" check-ins with timestamps and GPS snapshots.
- **`incidents`**: SOS emergencies, missed check-ins, and AI voice distress events.
- **`location_snapshots`**: GPS coordinates captured only during active safety sessions.
- **`notification_events`**: Audit log of dispatched alerts to contacts with delivery receipts.

---

## Running the Application Locally

### 1. Start the Backend Server
```bash
cd server
npm install
npm start
# Runs on http://localhost:5000
```

### 2. Start the Frontend Client
```bash
cd client
npm install
npm run dev
# Runs on http://localhost:5173
```

### 3. Run Automated End-to-End Tests
```bash
node test_e2e.js
```
