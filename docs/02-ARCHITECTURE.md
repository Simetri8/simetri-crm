# Sistem Mimarisi

---

## Genel Bakis

```
+-------------------+
|                   |
|   Kullanici       |
|   (Browser/PWA)   |
|                   |
+--------+----------+
         |
         | HTTPS
         v
+--------+----------+
|                   |
|   Railway         |
|   (Next.js App)   |
|                   |
|  +-------------+  |
|  | Pages/App   |  |
|  | API Routes  |  |
|  | Cron Jobs   |  |
|  +-------------+  |
|                   |
+--------+----------+
         |
         | Firebase SDK / REST API
         v
+--------+----------+     +-------------------+
|                   |     |                   |
|   Firebase        |     |   Harici          |
|                   |     |   Servisler       |
|  +-------------+  |     |                   |
|  | Firestore   |  |     |  +-------------+  |
|  | Auth        |  |     |  | Resend      |  |
|  +-------------+  |     |  | (E-posta)   |  |
|                   |     |  +-------------+  |
+-------------------+     |                   |
                          |  +-------------+  |
                          |  | Web Push    |  |
                          |  | (VAPID)     |  |
                          |  +-------------+  |
                          |                   |
                          +-------------------+
```

---

## Katmanlar

### 1. Sunum Katmani (Frontend)

**Teknoloji:** Next.js 14 App Router + React

```
app/
  layout.tsx          # Root layout (AuthProvider, SidebarProvider)
  page.tsx            # Login sayfasi
  (auth)/
    layout.tsx        # Korunmus sayfalarin layout'u
    dashboard/
      page.tsx
    projects/
      page.tsx
      [id]/page.tsx
    customers/
      page.tsx
      [id]/page.tsx
    communications/
      page.tsx
    vision/
      page.tsx
```

**Ozellikler:**
- Server Components (varsayilan)
- Client Components (interaktif bilesenler icin "use client")
- Streaming ve Suspense
- Parallel Routes (gerekirse)

### 2. API Katmani (Backend)

**Teknoloji:** Next.js API Routes (Route Handlers)

```
app/api/
  auth/
    [...nextauth]/route.ts   # (Opsiyonel - Firebase Auth kullanilacak)
  cron/
    daily/route.ts           # Railway Cron tarafindan cagirilir
  push/
    subscribe/route.ts       # Push subscription kaydi
    send/route.ts            # Push bildirim gonderme
  customers/
    route.ts                 # GET (liste), POST (olustur)
    [id]/route.ts            # GET, PUT, DELETE
  projects/
    route.ts
    [id]/route.ts
  tasks/
    route.ts
    [id]/route.ts
  communications/
    route.ts
    [id]/route.ts
  goals/
    route.ts
    [id]/route.ts
```

**Not:** CRUD islemleri client-side Firebase SDK ile de yapilabilir. API routes ozellikle:
- Cron jobs
- Push notifications
- E-posta gonderimi
- Denormalizasyon senkronizasyonu

icin kullanilacak.

### 3. Veri Katmani (Database)

**Teknoloji:** Firebase Firestore

```
Firestore
  |
  +-- users/
  |     +-- {userId}
  |
  +-- projects/
  |     +-- {projectId}
  |
  +-- tasks/
  |     +-- {taskId}
  |
  +-- customers/
  |     +-- {customerId}
  |
  +-- communications/
  |     +-- {communicationId}
  |
  +-- goals/
        +-- {goalId}
```

**Erisim Yontemleri:**
1. **Client-side:** Firebase JS SDK (real-time listeners)
2. **Server-side:** Firebase Admin SDK (API routes, cron)

### 4. Authentication

**Teknoloji:** Firebase Auth

```
+-------------+     +----------------+     +-------------+
|             |     |                |     |             |
|  Google     |---->|  Firebase      |---->|  App        |
|  OAuth      |     |  Auth          |     |  (JWT)      |
|             |     |                |     |             |
+-------------+     +----------------+     +-------------+
```

**Akis:**
1. Kullanici "Google ile Giris" tiklar
2. Firebase Auth, Google OAuth popup acar
3. Basarili giris sonrasi JWT token alinir
4. Token, client-side'da saklanir (Firebase SDK otomatik yonetir)
5. Firestore islemleri bu token ile yetkilendirilir

---

## Veri Akisi

### Okuma (Read)

```
+----------+     +-----------+     +------------+
|          |     |           |     |            |
| Component|---->| useQuery  |---->| Firestore  |
| (Client) |     | (Hook)    |     | (onSnapshot|
|          |<----|           |<----| veya get)  |
+----------+     +-----------+     +------------+
```

**Yaklasim:**
- Real-time gerekli yerlerde `onSnapshot`
- Statik veriler icin `getDoc` / `getDocs`
- React Query veya SWR ile caching

### Yazma (Write)

```
+----------+     +-----------+     +------------+
|          |     |           |     |            |
| Form     |---->| Firebase  |---->| Firestore  |
| (Client) |     | SDK       |     |            |
|          |     | setDoc()  |     |            |
+----------+     +-----------+     +------------+
                      |
                      v (Denormalizasyon gerekirse)
              +-----------+
              |           |
              | API Route |
              | (batch    |
              |  update)  |
              +-----------+
```

### Cron Job Akisi

```
+----------+     +-----------+     +------------+
|          |     |           |     |            |
| Railway  |---->| /api/cron |---->| Firestore  |
| Cron     |     | /daily    |     | (Admin SDK)|
| (08:00)  |     |           |     |            |
+----------+     +-----------+     +------------+
                      |
                      +---> Resend (E-posta)
                      |
                      +---> Web Push (Bildirim)
```

---

## Bilesen Mimarisi

### Klasor Yapisi

```
simetri-planner/
  |
  +-- app/                    # Next.js App Router
  |     +-- (auth)/           # Korunmus rotalar
  |     +-- api/              # API Routes
  |     +-- layout.tsx
  |     +-- page.tsx
  |
  +-- components/
  |     +-- ui/               # shadcn/ui bilesenleri
  |     +-- layout/           # Sidebar, Header
  |     +-- dashboard/        # Dashboard bilesenleri
  |     +-- projects/         # Proje bilesenleri
  |     +-- customers/        # Musteri bilesenleri
  |     +-- communications/   # Iletisim bilesenleri
  |     +-- vision/           # Vizyon bilesenleri
  |     +-- shared/           # Ortak bilesenler
  |
  +-- lib/
  |     +-- firebase/
  |     |     +-- config.ts       # Firebase yapilandirmasi
  |     |     +-- auth.ts         # Auth islemleri
  |     |     +-- firestore.ts    # Firestore islemleri
  |     |     +-- admin.ts        # Admin SDK (server-side)
  |     |
  |     +-- hooks/
  |     |     +-- useAuth.ts
  |     |     +-- useProjects.ts
  |     |     +-- useCustomers.ts
  |     |     +-- useTasks.ts
  |     |
  |     +-- utils/
  |     |     +-- date.ts
  |     |     +-- temperature.ts
  |     |
  |     +-- types/
  |           +-- index.ts        # TypeScript tipleri
  |
  +-- public/
  |     +-- sw.js                 # Service Worker (PWA)
  |     +-- manifest.json         # PWA manifest
  |
  +-- docs/                       # Dokumantasyon
  |
  +-- .env.local                  # Environment variables
  +-- next.config.js
  +-- tailwind.config.js
  +-- package.json
```

### Bilesen Hiyerarsisi

```
RootLayout
  |
  +-- AuthProvider (Firebase Auth Context)
       |
       +-- LoginPage (giris yapilmamissa)
       |
       +-- AuthLayout (giris yapilmissa)
            |
            +-- SidebarProvider
                 |
                 +-- Sidebar
                 |     +-- SidebarMenu
                 |     +-- UserMenu
                 |
                 +-- MainContent
                 |     +-- Page (Dashboard/Projects/etc.)
                 |
                 +-- CommandDialog (Cmd+K)
                 |
                 +-- QuickActionButton (+)
                 |
                 +-- Toaster (Bildirimler)
```

---

## State Yonetimi

### Client State
- **React useState/useReducer:** Form state, UI state
- **React Context:** Auth state, theme

### Server State
- **Firebase Realtime:** `onSnapshot` listeners
- **React Query (opsiyonel):** Caching, refetching, optimistic updates

### URL State
- **Next.js Router:** Filtreler, tabs, pagination

---

## Guvenlik

### Authentication
- Firebase Auth ile Google OAuth
- JWT token otomatik yonetim
- Session persistence (localStorage)

### Authorization
- Firestore Security Rules
- Sadece authenticated kullanicilar erisebilir
- Herkes her seyi yapabilir (tek seviye yetki)

### API Guvenlik
- Cron endpoint: Railway secret header kontrolu
- CORS: Sadece kendi domain'imiz

```javascript
// /api/cron/daily/route.ts
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... cron logic
}
```

---

## PWA Mimarisi

```
+-------------------+
|                   |
|   Next.js App     |
|                   |
+--------+----------+
         |
         | next-pwa
         v
+--------+----------+
|                   |
|   Service Worker  |
|                   |
|  +-------------+  |
|  | Cache API   |  |
|  | Push API    |  |
|  | Offline     |  |
|  +-------------+  |
|                   |
+-------------------+
```

### Offline Destegi
- Static assets cached
- API responses cached (stale-while-revalidate)
- Offline fallback page

### Push Notifications
1. Kullanici izin verir
2. Browser, push subscription olusturur
3. Subscription, Firestore'a kaydedilir
4. Cron job, web-push ile bildirim gonderir

---

## Deployment Mimarisi

```
+-------------------+     +-------------------+
|                   |     |                   |
|   GitHub          |---->|   Railway         |
|   (main branch)   |     |   (Auto Deploy)   |
|                   |     |                   |
+-------------------+     +--------+----------+
                                   |
                                   v
                          +--------+----------+
                          |                   |
                          |   Production      |
                          |   Environment     |
                          |                   |
                          |   - Next.js       |
                          |   - Cron Jobs     |
                          |   - Env Vars      |
                          |                   |
                          +-------------------+
```

### Environment Variables

```
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (Server-side)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# Resend
RESEND_API_KEY=

# Web Push
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

# Cron Security
CRON_SECRET=

# App
NEXT_PUBLIC_APP_URL=
```

---

## Performans Optimizasyonlari

### Frontend
- React Server Components (varsayilan)
- Dynamic imports (lazy loading)
- Image optimization (next/image)
- Font optimization (next/font)

### Database
- Firestore indexes (composite queries)
- Denormalizasyon (okuma optimizasyonu)
- Pagination (infinite scroll veya sayfalama)
- Offline persistence

### Caching
- Static page caching (ISR gerekirse)
- API response caching
- Service Worker caching

---

## Monitoring (Gelecek)

- **Vercel Analytics** veya **Railway Metrics**
- **Firebase Performance Monitoring**
- **Sentry** (error tracking)
