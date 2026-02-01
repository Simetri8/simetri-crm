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
         |
         | Railway         |
         | (Next.js App)   |
         |                 |
         |  +-------------+  |
         |  | Pages/App   |  |
         |  | API Routes  |  |
         |  | Cron Jobs   |  |
         |  +-------------+  |
         |                 |
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
    users/
      page.tsx        # Kullanici Yonetimi (Whitelist)
```

**Ozellikler:**
- Server Components (varsayilan)
- Client Components (interaktif bilesenler icin "use client")
- Streaming ve Suspense
- PWA Destegi

### 2. API Katmani (Backend)

**Teknoloji:** Next.js API Routes (Route Handlers)

```
app/api/
  cron/
    daily/route.ts           # Railway Cron tarafindan cagirilir
  push/
    subscribe/route.ts       # Push subscription kaydi
    send/route.ts            # Push bildirim gonderme
```

**Not:** CRUD islemleri client-side Firebase SDK ile yapilmaktadir. API routes ozellikle:
- Cron jobs
- Push notifications
- E-posta gonderimi
- Server-side yetki kontrolleri

icin kullanilmaktadir.

### 3. Veri Katmani (Database)

**Teknoloji:** Firebase Firestore

```
Firestore
  |
  +-- users/             # Whitelist ve kullanici verileri
  |     +-- {userId}
  |
  +-- projects/          # Projeler
  |     +-- {projectId}
  |
  +-- tasks/             # Gorevler (Backlog)
  |     +-- {taskId}
  |
  +-- customers/         # Musteriler
  |     +-- {customerId}
  |
  +-- communications/    # Iletisim kayitlari
  |     +-- {communicationId}
  |
  +-- goals/             # Vizyon/Hedefler
        +-- {goalId}
```

**Erisim Yontemleri:**
1. **Client-side:** Firebase JS SDK
2. **Server-side:** Firebase Admin SDK (API routes, cron)

### 4. Authentication & Security

**Teknoloji:** Firebase Auth + Whitelist

```
+-------------+     +----------------+     +-------------+     +-------------+
|             |     |                |     |             |     |             |
|  Google     |---->|  Firebase      |---->|  Whitelist  |---->|  App        |
|  OAuth      |     |  Auth          |     |  Control    |     |  (Access)   |
|             |     |                |     |             |     |             |
+-------------+     +----------------+     +-------------+     +-------------+
```

**Akis:**
1. Kullanici "Google ile Giris" tiklar.
2. Firebase Auth basarili olursa, kullanicinin e-postasi `users` koleksiyonunda sorgulanir.
3. E-posta listede yoksa kullanıcı otomatik olarak `signOut` edilir.
4. Listede varsa oturum acilir.

---

## Veri Akisi

### Okuma (Read)

```
+----------+     +-----------+     +------------+
|          |     |           |     |            |
| Component|---->| Firebase  |---->| Firestore  |
| (Client) |     | Service   |     | (get/query)|
|          |<----|           |<----|            |
+----------+     +-----------+     +------------+
```

### Yazma (Write)

```
+----------+     +-----------+     +------------+
|          |     |           |     |            |
| Form     |---->| Firebase  |---->| Firestore  |
| (Client) |     | Service   |     |            |
|          |     | (add/upd) |     |            |
+----------+     +-----------+     +------------+
```

---

## Bilesen Mimarisi

### Klasor Yapisi

```
simetri-planner/
  |
  +-- app/                    # Next.js App Router
  +-- components/
  |     +-- ui/               # shadcn/ui bilesenleri
  |     +-- layout/           # Sidebar, Navigation
  |     +-- dashboard/        # Dashboard bilesenleri
  |     +-- projects/         # Proje bilesenleri
  |     +-- customers/        # Musteri bilesenleri
  |     +-- communications/   # Iletisim bilesenleri
  |     +-- vision/           # Vizyon bilesenleri
  |     +-- users/            # Whitelist bilesenleri
  |
  +-- lib/
  |     +-- firebase/         # Firebase servisleri (CRUD logic)
  |     +-- types/            # TypeScript tanımları
  |     +-- utils/            # Yardımcı fonksiyonlar
  |
  +-- hooks/                  # Custom hooks (Push, Auth vb.)
  +-- public/                 # PWA & Static assets
```

---

## Guvenlik

### Authorization
- Firestore Security Rules: Sadece authenticated ve whitelist'e eklenmiş kullanicilar erisebilir.
- Herkes her seyi yapabilir (tek seviye yetki).

### API Guvenlik
- Cron endpoint: Railway secret header kontrolu.
- Firebase Admin SDK: Server-side yetkili işlemler.

---

## PWA & Bildirimler

- **next-pwa:** Offline destek ve uygulama kurulumu.
- **Web Push API:** Tarayıcı üzerinden anlık bildirimler.
- **Resend:** Günlük raporlar için e-posta gönderimi.

---

## Deployment

- **Railway:** Hosting, Environment Variables ve Cron Jobs yönetimi.
- **Firebase:** Database (Firestore) ve Auth yönetimi.
