# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev      # Start development server (uses Webpack)
npm run build    # Production build (uses Webpack)
npm start        # Start production server
npm run lint     # Run ESLint
```

Note: Both `dev` and `build` commands explicitly use the `--webpack` flag.

## Architecture Overview

**Simetri Planner** is a company/project management system built with Next.js 16 (App Router) and Firebase.

### Tech Stack
- **Framework:** Next.js 16.1.6 with TypeScript (strict mode)
- **Database:** Firebase Firestore (NoSQL, real-time)
- **Authentication:** Firebase Auth (Google OAuth only, whitelist-based)
- **UI:** shadcn/ui (New York style) + Tailwind CSS 4 + Radix UI
- **Forms:** React Hook Form + Zod validation
- **Drag & Drop:** @dnd-kit
- **Notifications:** Web Push (VAPID) + Resend email
- **PWA:** next-pwa (disabled in development)
- **Hosting:** Railway (with cron job support)

### Directory Structure

```
app/
├── (auth)/              # Protected route group (requires login)
│   ├── dashboard/       # Main dashboard
│   ├── projects/[id]/   # Projects CRUD
│   ├── customers/       # Customer management
│   ├── communications/  # Interaction tracking
│   ├── vision/          # Goals (weekly/monthly/yearly)
│   └── users/           # User whitelist management
├── api/
│   ├── cron/daily/      # Daily automation endpoint
│   └── push/            # Web push subscribe/send
└── page.tsx             # Login page

components/
├── ui/                  # shadcn/ui components (28+)
├── auth/                # AuthProvider context
├── layout/              # Sidebar, navigation
└── [feature]/           # Feature-specific components

lib/
├── firebase/
│   ├── config.ts        # Client SDK initialization
│   ├── admin.ts         # Admin SDK (server-only)
│   └── [service].ts     # CRUD services per entity
├── types/index.ts       # All TypeScript type definitions
└── utils/utils.ts       # cn() helper for Tailwind
```

### Authentication Flow

1. Google OAuth via Firebase Auth popup
2. Email checked against `users` collection (whitelist)
3. Non-whitelisted users are auto-signed out with error
4. All authenticated users have equal permissions

### Service Layer Pattern

All Firebase services follow this pattern in `lib/firebase/`:

```typescript
export const entityService = {
  getAll: async () => { /* query all */ },
  getById: async (id) => { /* get single */ },
  add: async (data) => { /* create with timestamps */ },
  update: async (id, data) => { /* update with updatedAt */ },
  delete: async (id) => { /* delete */ },
}
```

### Key Patterns

- **Denormalization:** `customerName` and `projectName` are duplicated in related documents for query performance. Services include sync methods like `updateCustomerName()`.
- **Server Components:** Default for pages/layouts; use `"use client"` directive for interactive components.
- **Path aliases:** Use `@/` for imports (e.g., `@/components/ui/button`).
- **Timestamps:** All entities use `createdAt` (serverTimestamp) and `updatedAt` where applicable.

### Firestore Collections

| Collection | Key Fields | Notes |
|------------|------------|-------|
| `users` | email, pushSubscription | Whitelist for access control |
| `projects` | status, customerId | Status: active/pending/completed |
| `tasks` | projectId, status, order, weeklyPlanDate | Supports drag-drop reordering |
| `customers` | temperature, lastContactDate | Temperature: hot/warm/cold |
| `communications` | customerId, type, date | Types: phone/email/meeting/other |
| `goals` | type, status, targetDate | Types: weekly/monthly/yearly |

### Environment Variables

**Client-side (NEXT_PUBLIC_):**
- Firebase config (API_KEY, AUTH_DOMAIN, PROJECT_ID, etc.)
- VAPID_PUBLIC_KEY, APP_URL

**Server-side:**
- Firebase Admin credentials
- RESEND_API_KEY, VAPID_PRIVATE_KEY, CRON_SECRET

## Important Notes

- Documentation in `/docs/` is written in Turkish
- No test framework is configured
- PWA service worker (`public/push-sw.js`) handles push notifications
- Daily cron endpoint expects `CRON_SECRET` header for authorization
