# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server (webpack, not Turbopack)
npm run build        # Production build
npm run lint         # ESLint (next/core-web-vitals + next/typescript)
```

No testing framework is configured.

## Architecture

Agency CRM + Work Tracking app. Turkish language UI. Next.js 16 (App Router), Firebase/Firestore, shadcn/ui (new-york style), Tailwind CSS v4, React Hook Form + Zod.

### Route Structure

- `app/page.tsx` — Landing/login (Google OAuth)
- `app/(auth)/` — Protected route group (sidebar + header layout)
  - `dashboard/` — Overview, CRM, and Ops dashboard tabs
  - `crm/` — Companies, Contacts, Deals, Pipeline, Proposals, Requests, Catalog
  - `ops/work-orders/` — Work orders → deliverables → tasks
  - `time/` — Time tracking + approval
  - `users/` — Whitelist management
- `app/api/` — Push notifications, cron jobs

### Data Layer

**Services** (`lib/firebase/*.ts`): One file per entity, all export a service object with `getAll`, `getById`, `add`, `update`, `delete`. Re-exported from `lib/firebase/index.ts`.

**Types** (`lib/types/index.ts`): All enums (as const arrays with type extraction) + entity types + form data types in one file.

**Key patterns:**
- `getCollection<T>(name)` with generic Firestore converter (`lib/firebase/firestore.ts`)
- `serverTimestamp()` for createdAt/updatedAt, `userId` tracking on all mutations
- **Denormalization**: Names duplicated in related docs — renaming triggers batch updates to all referencing docs
- **Soft deletes**: `isArchived` flag on companies and deals
- **Activities are immutable** (no updatedAt/updatedBy)
- Forms use React Hook Form + Zod schema validation

### Authentication & Authorization

Two-collection whitelist system:
- `whitelist` collection: doc ID = email address (admin-managed)
- `users` collection: doc ID = Firebase Auth UID (auto-created on login via `ensureUserDoc`)
- Firestore rules: `isRegisteredUser()` checks `exists(users/$(request.auth.uid))`
- `users` create rule requires email in whitelist: `exists(whitelist/$(request.auth.token.email))`

### Entity Relationships

```
Contact --optional--> Company
  |                     |
  v                     v
Activity            Deal → Proposal → Work Order → Deliverable → Task
  |
  v
Request
```

Contacts are independent (v3.0 Contact-First: `companyId` is optional). Activities link to contacts and/or companies/deals.

### Component Organization

- `components/ui/` — shadcn/ui primitives (+ kibo-ui extended components)
- `components/crm/` — CRM feature components (forms, lists, dialogs)
- `components/ops/` — Operations components
- `components/dashboard/` — Dashboard panels
- `components/layout/` — AppSidebar, AppHeader, QuickActionButton
- `components/auth/` — AuthProvider (context-based, wraps entire app)

### Hooks

Custom hooks in `hooks/` follow pattern: `useState` + `useCallback` + `useEffect` with parallel data fetching via `Promise.all`, returning `{ data, loading, error, refresh }`.

### Environment

Required env vars: `NEXT_PUBLIC_FIREBASE_*` (client), `FIREBASE_ADMIN_*` (server), `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` (push), `CRON_SECRET`, `NEXT_PUBLIC_APP_URL`. See `.env.example`.

Path alias: `@/*` → project root.

### Deployment

Railway. PWA enabled via next-pwa (disabled in dev). Web Push via VAPID + Firebase Admin.
