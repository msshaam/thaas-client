# THAAS — Game Platform

A combined client for Digu and Dhihaeh card games.

## Local Development

### 1. Start Digu server (port 3001)
```bash
cd ../digu-server
node index.js
```

### 2. Start Dhihaeh server (port 3002)
```bash
cd ../dhihaeh-server
PORT=3002 node index.js
```

### 3. Start THAAS client
```bash
npm install
npm start
```

Open http://localhost:3000 — pick a game from the home screen.

## Deployment (Vercel)

Set these environment variables in Vercel:
- `REACT_APP_DIGU_SERVER_URL` → your Digu Railway URL
- `REACT_APP_DHIHAEH_SERVER_URL` → your Dhihaeh Railway URL

## Structure
```
src/
├── App.js                    ← Main router
├── components/
│   ├── shared/
│   │   └── Home.js           ← Game picker landing page
│   ├── digu/                 ← All Digu components (unchanged)
│   └── dhihaeh/              ← All Dhihaeh components (unchanged)
└── utils/
    └── meldCheck.js          ← Digu meld logic
```
