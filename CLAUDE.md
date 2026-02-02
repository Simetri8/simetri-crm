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
│   ├── dashboard/       # Main dashboard (3-column layout)
│   ├── projects/
│   │   ├── page.tsx     # Project list
│   │   ├── new/         # New project form
│   │   └── [id]/        # Project detail with tasks
│   ├── customers/
│   │   ├── page.tsx     # Customer list
│   │   ├── new/         # New customer form
│   │   └── [id]/        # Customer detail (projects, communications)
│   ├── communications/
│   │   ├── page.tsx     # Communication list
│   │   └── new/         # New communication form
│   ├── vision/          # Goals (weekly/monthly/yearly views)
│   └── users/           # User whitelist management
├── api/
│   ├── cron/daily/      # Daily automation (temperature calc, notifications)
│   └── push/            # Web push subscribe/send
└── page.tsx             # Login page

components/
├── ui/                  # shadcn/ui components (28+)
├── auth/                # AuthProvider context
├── layout/              # Sidebar, navigation, command-menu
├── dashboard/           # Dashboard columns (tasks, customers, activity)
└── [feature]/           # Feature-specific components with form dialogs

lib/
├── firebase/
│   ├── config.ts        # Client SDK initialization (singleton)
│   ├── admin.ts         # Admin SDK (server-only)
│   └── [service].ts     # CRUD services: projects, customers, tasks, communications, goals, users
├── types/index.ts       # All TypeScript type definitions
└── utils/
    ├── utils.ts         # cn() helper for Tailwind class merging
    ├── status.ts        # Status/temperature labels and colors
    └── temperature.ts   # Customer temperature calculation
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
- **Form Dialogs:** Each entity has a `[Entity]FormDialog` component for create/edit in modals.
- **Detail Pages:** Entity detail pages (`/[entity]/[id]`) show related data and allow inline actions.
- **Status Utilities:** Use `lib/utils/status.ts` for consistent labels/colors:
  - `PROJECT_STATUS_LABELS/COLORS` - active, pending, completed
  - `TASK_STATUS_LABELS/COLORS` - todo, in_progress, done
  - `TASK_PRIORITY_LABELS/COLORS` - low, normal, high, urgent
  - `CUSTOMER_TEMPERATURE_LABELS/COLORS` - hot, warm, cold

### Firestore Collections

| Collection | Key Fields | Notes |
|------------|------------|-------|
| `users` | email, pushSubscription | Whitelist for access control |
| `projects` | status, customerId | Status: active/pending/completed |
| `tasks` | projectId, customerId, sourceCommunicationId | Can be project-based OR customer follow-up |
| `customers` | temperature, lastContactDate | Temperature: hot/warm/cold |
| `communications` | customerId, projectId, nextAction | Auto-creates task if nextAction+date provided |
| `goals` | type, weekStart, month, year | Types: weekly/monthly/yearly |

### Task-Communication Relationship

Tasks can originate from two sources:
1. **Project tasks:** Have `projectId`, appear in project backlog
2. **Communication follow-ups:** Have `customerId` + `sourceCommunicationId`, created automatically when a communication has `nextAction` and `nextActionDate`

When adding a communication with "Sonraki Adım" (next action) and date, a task is automatically created with:
- `dueDate` and `weeklyPlanDate` set to the action date
- `sourceCommunicationId` linking back to the communication
- Appears in weekly view and dashboard

### Environment Variables

**Client-side (NEXT_PUBLIC_):**
- Firebase config (API_KEY, AUTH_DOMAIN, PROJECT_ID, etc.)
- VAPID_PUBLIC_KEY, APP_URL

**Server-side:**
- Firebase Admin credentials
- RESEND_API_KEY, VAPID_PRIVATE_KEY, CRON_SECRET

## Important Notes

- **Language:** UI text and documentation in `/docs/` are in Turkish (no special characters like ş, ı, ğ, ü, ö, ç in code - ASCII only)
- **No test framework** is configured
- **PWA:** Service worker (`public/push-sw.js`) handles push notifications; disabled in dev mode
- **Cron:** Daily endpoint expects `CRON_SECRET` header for authorization
- **Date formatting:** Uses `date-fns` with Turkish locale (`tr`) for display
