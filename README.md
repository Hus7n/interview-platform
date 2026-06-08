# Interview Platform

A simple technical interview platform with video calls, collaborative code editor, notes, and feedback.

**Stack:** Next.js 15 · Express · PostgreSQL · Socket.IO · WebRTC · Monaco Editor

## Project Structure

```
interview-platform/
├── frontend/     # Next.js app (deploy to Vercel)
├── backend/      # Express + Socket.IO (deploy to Render)
└── README.md
```

## Prerequisites

- Node.js 20+
- PostgreSQL installed locally (or Neon account for production)

## Local Setup

### 1. Database

Create a PostgreSQL database:

```sql
CREATE DATABASE interview_platform;
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

npm install
npm run migrate
npm run dev
```

Backend runs at `http://localhost:4000`

### 3. Frontend

```bash
cd frontend
cp .env.local.example .env.local

npm install
npm run dev
```

Frontend runs at `http://localhost:3000`

## First Users

Register accounts via `/register`:

1. Register as **interviewer** (or candidate)
2. To create an admin, register then update role in the database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

Or register with role `interviewer`, then promote via Admin panel if another admin exists.

## Features

- Email/password auth with JWT
- Roles: admin, interviewer, candidate
- Schedule interviews with calendar dashboard
- Interview room with:
  - WebRTC video/audio/screen share
  - Collaborative Monaco code editor
  - Private & shared notes (autosave)
  - Real-time chat
- Feedback submission with ratings
- In-app notifications

## Deploy to Vercel + Render + Neon

### Database (Neon)

1. Create project at [neon.tech](https://neon.tech)
2. Copy connection string → use as `DATABASE_URL`

### Backend (Render)

1. Push code to GitHub
2. New Web Service on [render.com](https://render.com)
3. Root directory: `backend`
4. Build: `npm install && npm run build`
5. Start: `npm start`
6. Add env vars: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `PORT=4000`
7. Run migration once: `npm run migrate` (via Render shell)

### Frontend (Vercel)

1. Import repo on [vercel.com](https://vercel.com)
2. Root directory: `frontend`
3. Env vars:
   ```
   NEXT_PUBLIC_API_URL=https://your-api.onrender.com
   NEXT_PUBLIC_SOCKET_URL=https://your-api.onrender.com
   ```
4. Deploy

Update `FRONTEND_URL` on Render to your Vercel URL.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Register |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Current user |
| GET | /api/interviews | List interviews |
| POST | /api/interviews | Create interview |
| GET | /api/interviews/room/:roomId | Get by room |
| PUT | /api/notes/:interviewId | Save note |
| POST | /api/feedback/:interviewId | Submit feedback |
| GET | /api/notifications | List notifications |

## Socket Events

- `room:join` / `room:leave` — join interview room
- `signal:offer` / `signal:answer` / `signal:ice-candidate` — WebRTC
- `editor:change` — collaborative code sync
- `chat:message` — room chat
