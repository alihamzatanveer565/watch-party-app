<div align="center">

# 🎬 WatchParty

### Watch YouTube videos together — in perfect sync.

A production-ready, full-stack web application for hosting synchronized watch parties with real-time chat, guest approval flow, and host-controlled playback.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![NestJS](https://img.shields.io/badge/NestJS-10-e0234e?logo=nestjs)](https://nestjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-5-2d3748?logo=prisma)](https://www.prisma.io)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?logo=socket.io)](https://socket.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)](https://tailwindcss.com)

![License](https://img.shields.io/badge/license-MIT-green)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Socket Events](#socket-events)
- [Database Schema](#database-schema)
- [Application Flow](#application-flow)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**WatchParty** lets you host synchronized YouTube watch parties for any group — no plugins, no browser extensions, no complexity. The host controls playback and everyone stays in perfect sync automatically. Guests join using just their name via a shareable invite link.

> Built with a clean, scalable architecture that's ready for production and designed to grow.

---

## Features

### Core
- **Synchronized Playback** — Host controls play, pause, and seek for all participants. Auto-corrects drift greater than 1.5 seconds.
- **YouTube IFrame API** — Native YouTube integration supporting any public video, Shorts, and playlists.
- **Real-time Chat** — Live chat with emoji picker, message timestamps, and host badges.
- **Message Moderation** — Host can soft-delete messages; they display as *"This message was removed by the owner."*

### Room Management
- **Invite Link System** — Unique invite codes per room. Share a single link to invite anyone.
- **Guest-Friendly Join** — Participants join with just their name — no account required.
- **Approval Flow** — Every join request requires host approval. Pending guests see a live waiting screen.
- **Participant Removal** — Host can kick any participant instantly with a real-time notification.

### Authentication
- **JWT Authentication** — Secure login and signup for room hosts.
- **Protected Routes** — Only authenticated users can create rooms.
- **Guest Sessions** — Guests are tracked via session IDs without needing an account.

### UI/UX
- **Dark Entertainment UI** — Modern dark interface with soft gradients, inspired by streaming platforms.
- **Fully Responsive** — Desktop: side-by-side video + chat. Mobile: tabbed layout.
- **Toast Notifications** — Non-intrusive feedback for all key actions.
- **Loading & Empty States** — Every panel handles loading, empty, and error states gracefully.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| **Backend** | NestJS 10, TypeScript |
| **Real-time** | Socket.IO 4 |
| **Database** | PostgreSQL + Prisma ORM |
| **Auth** | JWT (via `@nestjs/jwt`), bcrypt |
| **Video** | YouTube IFrame Player API |
| **UI Extras** | react-hot-toast, emoji-picker-react |

---

## Project Structure

```
watch-party-app/
│
├── backend/                        # NestJS REST API + Socket.IO
│   ├── prisma/
│   │   ├── schema.prisma           # Database models
│   │   └── migrations/             # Auto-generated migration files
│   │
│   └── src/
│       ├── auth/                   # JWT authentication
│       │   ├── dto/                # Signup & login DTOs
│       │   ├── guards/             # JwtAuthGuard
│       │   └── strategies/         # Passport JWT strategy
│       │
│       ├── users/                  # User service
│       ├── rooms/                  # Room CRUD, invite codes, video state
│       │   └── dto/                # CreateRoom & UpdateVideo DTOs
│       ├── participants/           # Participant management (kick/remove)
│       ├── chat/                   # Message storage and soft-delete
│       │
│       ├── gateway/                # Socket.IO hub (server-authoritative)
│       │   └── app.gateway.ts      # All real-time event handlers
│       │
│       ├── prisma/                 # Global PrismaService
│       ├── app.module.ts
│       └── main.ts
│
├── frontend/                       # Next.js 14 App Router
│   └── src/
│       ├── app/                    # File-based routing
│       │   ├── page.tsx            # Landing page
│       │   ├── layout.tsx          # Root layout + Toaster
│       │   ├── auth/
│       │   │   ├── login/          # Login page
│       │   │   └── signup/         # Signup page
│       │   └── room/
│       │       ├── create/         # Create room (auth required)
│       │       └── [inviteCode]/
│       │           ├── page.tsx    # Main room experience
│       │           └── join/       # Guest name entry screen
│       │
│       ├── components/ui/          # Reusable primitives
│       │   ├── Button.tsx
│       │   ├── Input.tsx
│       │   ├── Modal.tsx
│       │   └── Card.tsx
│       │
│       ├── features/               # Feature-specific components
│       │   ├── video/
│       │   │   └── VideoPlayer.tsx       # YouTube IFrame API wrapper
│       │   ├── chat/
│       │   │   └── ChatPanel.tsx         # Real-time chat UI
│       │   ├── participants/
│       │   │   ├── ParticipantList.tsx   # Online/offline participant list
│       │   │   └── JoinRequestPanel.tsx  # Approve/reject UI for host
│       │   └── room/
│       │       ├── RoomLayout.tsx        # Full room page layout
│       │       ├── OwnerControls.tsx     # Change video panel
│       │       └── WaitingRoomScreen.tsx # Pending/rejected/removed states
│       │
│       ├── hooks/
│       │   ├── useAuth.ts          # Auth state + login/signup/logout
│       │   ├── useRoom.ts          # All Socket.IO room logic
│       │   └── useSocket.ts        # Raw socket instance
│       │
│       ├── services/               # Axios API layer
│       │   ├── auth.service.ts
│       │   ├── rooms.service.ts
│       │   └── chat.service.ts
│       │
│       ├── lib/
│       │   ├── axios.ts            # Axios instance with auth interceptor
│       │   └── utils.ts            # cn(), formatTime(), extractYoutubeId()
│       │
│       └── types/
│           └── index.ts            # Shared TypeScript interfaces
│
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm

### 1. Clone the repository

```bash
git clone https://github.com/your-username/watch-party-app.git
cd watch-party-app
```

### 2. Configure environment variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Update `backend/.env` with your database credentials and a strong JWT secret (see [Environment Variables](#environment-variables)).

### 3. Install dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 4. Set up the database

```bash
cd backend

# Generate Prisma client
npm run prisma:generate

# Run migrations (creates all tables)
npm run prisma:migrate
```

### 5. Start both servers

```bash
# Terminal 1 — Backend (http://localhost:3001)
cd backend && npm run start:dev

# Terminal 2 — Frontend (http://localhost:3000)
cd frontend && npm run dev
```

Open **http://localhost:3000** and you're live.

---

## Environment Variables

### Backend — `backend/.env`

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/watch_party_db` |
| `JWT_SECRET` | Secret key for signing JWTs | `a-long-random-string` |
| `JWT_EXPIRES_IN` | Token expiry duration | `7d` |
| `PORT` | Backend server port | `3001` |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:3000` |

### Frontend — `frontend/.env.local`

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend REST API base URL | `http://localhost:3001/api` |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.IO server URL | `http://localhost:3001` |

---

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/signup` | — | Register a new host account |
| `POST` | `/api/auth/login` | — | Login and receive JWT |
| `GET` | `/api/auth/me` | JWT | Get current authenticated user |
| `POST` | `/api/rooms` | JWT | Create a new room |
| `GET` | `/api/rooms/my` | JWT | Get rooms owned by current user |
| `GET` | `/api/rooms/invite/:code` | — | Fetch room info by invite code |
| `GET` | `/api/rooms/:id` | — | Get room by ID |
| `PATCH` | `/api/rooms/:id/video` | JWT | Update room's YouTube video |
| `GET` | `/api/rooms/:id/participants` | — | List approved participants |
| `GET` | `/api/rooms/:id/pending-requests` | JWT | List pending join requests |
| `GET` | `/api/chat/:roomId/messages` | — | Load chat history (last 200) |

---

## Socket Events

All video control events are **server-authoritative** — the backend validates that only the room owner can emit global playback commands.

| Event | Direction | Description |
|---|---|---|
| `room:join-request` | Client → Server | Request to enter a room |
| `room:join-pending` | Server → Client | Confirmation request is queued |
| `room:new-join-request` | Server → Host | New pending request notification |
| `room:approve-user` | Host → Server | Approve a join request |
| `room:reject-user` | Host → Server | Reject a join request |
| `room:user-approved` | Server → Client | Access granted, enter room |
| `room:user-rejected` | Server → Client | Access denied |
| `room:participants-updated` | Server → Room | Refreshed participant list |
| `room:removed` | Server → Participant | Kicked by host |
| `video:play` | Host → Server → Room | Play for all |
| `video:pause` | Host → Server → Room | Pause for all |
| `video:seek` | Host → Server → Room | Seek to timestamp |
| `video:sync` | Server → Client | Full state sync on join |
| `video:change` | Host → Server → Room | Load a new YouTube video |
| `video:request-sync` | Client → Server | Request current playback state |
| `chat:message` | Client → Server → Room | Send a chat message |
| `chat:delete` | Host → Server → Room | Soft-delete a message |
| `participant:remove` | Host → Server | Remove a participant |

---

## Database Schema

```
User              — id, name, email, password (bcrypt)
Room              — id, name, inviteCode, ownerId, youtubeUrl, youtubeVideoId, currentTime, isPlaying
RoomParticipant   — id, roomId, userId?, guestSessionId?, role (OWNER | PARTICIPANT), status (APPROVED | PENDING | REJECTED | REMOVED)
JoinRequest       — id, roomId, userId?, guestSessionId?, guestName, status (PENDING | APPROVED | REJECTED)
Message           — id, roomId, senderName, content, isRemoved, removedBy, removedAt
RoomEvent         — id, roomId, eventType, payload (JSON)
```

---

## Application Flow

```
Host                              Guest
 │                                  │
 ├─ Sign up / Log in                │
 ├─ Create room (YouTube URL)       │
 ├─ Get invite link ────────────────► Open invite link
 │                                  ├─ Enter name
 │                                  ├─ Click "Request to Join"
 ◄── Join request notification ─────┤
 ├─ Approve / Reject                │
 │                          ┌───────┘ (if approved)
 │                          ▼
 │                    Enter the room
 │                          │
 ├─ Play / Pause / Seek ────► Synced automatically
 ├─ Chat ───────────────────► Live for all
 ├─ Remove participant ─────► Kicked with notification
 └─ Delete message ─────────► Soft-deleted for all
```

---

## Roadmap

The architecture is intentionally designed to support the following additions without major rewrites:

### Near-term
- [ ] Redis adapter for horizontal Socket.IO scaling
- [ ] Load chat history on room entry (paginated)
- [ ] Room password protection
- [ ] Reconnection handling with state restore

### Mid-term
- [ ] Moderator role — below owner, above participant
- [ ] Video queue / playlist management
- [ ] Emoji reactions on messages
- [ ] User profiles with watch history
- [ ] Room expiry and auto-cleanup

### Long-term
- [ ] Browser extension for Netflix / Prime Video / Disney+ sync
- [ ] Uploaded video support (MP4 via S3/R2)
- [ ] Paid room plans (private rooms, longer history, recording)
- [ ] In-room voice/video via WebRTC
- [ ] Reporting and content moderation system
- [ ] Public room discovery / browse page

---

## Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change.

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Commit your changes
git commit -m "feat: add your feature"

# Push and open a pull request
git push origin feature/your-feature-name
```

Please follow the existing code style — TypeScript strict mode, no inline styles, Tailwind only.

---

## License

MIT © 2026 WatchParty

---

<div align="center">
  Made with ❤️ for movie nights and watch parties everywhere.
</div>
