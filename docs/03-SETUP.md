# Proje Kurulum Rehberi

---

## On Gereksinimler

- Node.js 18+
- npm veya pnpm
- Git
- Firebase hesabi (ucretsiz)
- Railway hesabi (ucretsiz tier)
- Resend hesabi (ucretsiz)
- Google Cloud Console erisimi (Firebase Auth icin)

---

## Adim 1: Next.js Projesi Olusturma

```bash
# Proje klasorunde
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
```

**Secenekler:**
- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- `src/` directory: No
- App Router: Yes
- Import alias: @/*

---

## Adim 2: shadcn/ui Kurulumu

```bash
# shadcn/ui init
npx shadcn@latest init
```

**Secenekler:**
- Style: Default
- Base color: Slate
- CSS variables: Yes

```bash
# Gerekli bilesenleri ekle
npx shadcn@latest add button input textarea select card badge avatar table dialog alert-dialog tabs separator scroll-area skeleton toast sonner command calendar sidebar
```

---

## Adim 3: Ek Bagimliliklarin Kurulumu

```bash
# Firebase
npm install firebase firebase-admin

# PWA
npm install next-pwa

# Web Push
npm install web-push

# E-posta
npm install resend

# Tarih islemleri
npm install date-fns

# Drag and Drop
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Form yonetimi (opsiyonel)
npm install react-hook-form zod @hookform/resolvers

# Development
npm install -D @types/web-push
```

---

## Adim 4: Firebase Projesi Olusturma

### 4.1 Firebase Console

1. [Firebase Console](https://console.firebase.google.com/) adresine git
2. "Add project" tikla
3. Proje adi: `simetri-planner`
4. Google Analytics: Opsiyonel (kapatilabilir)
5. "Create project" tikla

### 4.2 Web App Ekleme

1. Project Overview'da web simgesini (`</>`) tikla
2. App nickname: `simetri-planner-web`
3. Firebase Hosting: Hayir (Railway kullanacagiz)
4. "Register app" tikla
5. Firebase config'i kopyala (env icin gerekecek)

### 4.3 Authentication Ayarlari

1. Sol menuden "Authentication" sec
2. "Get started" tikla
3. "Sign-in method" sekmesinde "Google" sec
4. "Enable" tikla
5. Public-facing name: `Simetri Planner`
6. Support email: kendi email'in
7. "Save" tikla

### 4.4 Firestore Ayarlari

1. Sol menuden "Firestore Database" sec
2. "Create database" tikla
3. Location: `europe-west1` (veya yakin bir lokasyon)
4. Security rules: "Start in test mode" (sonra guncelleyecegiz)
5. "Enable" tikla

### 4.5 Firestore Security Rules

Firestore > Rules sekmesinde:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }

    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && request.auth.uid == userId;
    }

    match /projects/{projectId} {
      allow read, write: if isAuthenticated();
    }

    match /tasks/{taskId} {
      allow read, write: if isAuthenticated();
    }

    match /customers/{customerId} {
      allow read, write: if isAuthenticated();
    }

    match /communications/{commId} {
      allow read, write: if isAuthenticated();
    }

    match /goals/{goalId} {
      allow read, write: if isAuthenticated();
    }
  }
}
```

### 4.6 Firestore Indexes

Firestore > Indexes sekmesinde asagidaki composite index'leri olustur:

| Collection | Fields | Query scope |
|------------|--------|-------------|
| tasks | projectId ASC, order ASC | Collection |
| tasks | status ASC, weeklyPlanDate ASC | Collection |
| customers | temperature ASC, lastContactDate DESC | Collection |
| communications | customerId ASC, date DESC | Collection |
| goals | type ASC, weekStart ASC | Collection |

### 4.7 Firebase Admin SDK Key

1. Project Settings > Service accounts
2. "Generate new private key" tikla
3. JSON dosyasini indir (guvenli sakla, repo'ya ekleme!)
4. Icindeki degerleri env'e ekleyecegiz

---

## Adim 5: Resend Kurulumu

1. [Resend](https://resend.com/) adresine git
2. Hesap olustur
3. API Keys > Create API Key
4. API key'i kopyala

---

## Adim 6: Web Push VAPID Keys

```bash
# VAPID key pair olustur
npx web-push generate-vapid-keys
```

Cikti:
```
Public Key: BLxxxxxxx...
Private Key: xxxxxxx...
```

Bu degerleri env'e ekleyecegiz.

---

## Adim 7: Environment Variables

Proje kokunde `.env.local` dosyasi olustur:

```env
# Firebase Client (NEXT_PUBLIC_ prefix = client-side erisilebilir)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=simetri-planner.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=simetri-planner
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=simetri-planner.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Firebase Admin (Server-side only - NEXT_PUBLIC_ YOK)
FIREBASE_ADMIN_PROJECT_ID=simetri-planner
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxx@simetri-planner.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"

# Resend
RESEND_API_KEY=re_xxxxxxxx

# Web Push VAPID
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BLxxxxxxx...
VAPID_PRIVATE_KEY=xxxxxxx...

# Cron Security (rastgele uzun string olustur)
CRON_SECRET=your-super-secret-cron-key-here

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Onemli:** `.env.local` dosyasini `.gitignore`'a ekle (zaten varsayilan olarak eklenmis olmali).

---

## Adim 8: Firebase Yapilandirma Dosyalari

### lib/firebase/config.ts

```typescript
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
```

### lib/firebase/admin.ts

```typescript
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const adminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
};

// Initialize Firebase Admin (singleton pattern)
const adminApp = getApps().length === 0 ? initializeApp(adminConfig) : getApps()[0];

export const adminDb = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);
export default adminApp;
```

---

## Adim 9: Temel Klasor Yapisi

```bash
# Klasorleri olustur
mkdir -p app/(auth)/dashboard
mkdir -p app/(auth)/projects
mkdir -p app/(auth)/customers
mkdir -p app/(auth)/communications
mkdir -p app/(auth)/vision
mkdir -p app/api/cron/daily
mkdir -p app/api/push/subscribe
mkdir -p app/api/push/send
mkdir -p components/ui
mkdir -p components/layout
mkdir -p components/dashboard
mkdir -p components/projects
mkdir -p components/customers
mkdir -p components/communications
mkdir -p components/vision
mkdir -p components/shared
mkdir -p lib/firebase
mkdir -p lib/hooks
mkdir -p lib/utils
mkdir -p lib/types
mkdir -p public
```

---

## Adim 10: next.config.js (PWA)

```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js config options
};

module.exports = withPWA(nextConfig);
```

---

## Adim 11: Railway Deployment

### 11.1 Railway Hesabi

1. [Railway](https://railway.app/) adresine git
2. GitHub ile giris yap

### 11.2 Proje Olusturma

1. "New Project" tikla
2. "Deploy from GitHub repo" sec
3. Repository'yi sec
4. "Deploy Now" tikla

### 11.3 Environment Variables

Railway Dashboard > Variables sekmesinde tum env degiskenlerini ekle.

**Not:** `NEXT_PUBLIC_APP_URL` degerini Railway'in verdigi URL ile guncelle.

### 11.4 Cron Job Ayari

Railway Dashboard > Settings > Cron Jobs:

```
0 8 * * *    curl -H "Authorization: Bearer $CRON_SECRET" https://your-app.railway.app/api/cron/daily
```

---

## Adim 12: Ilk Verilerin Eklenmesi

Firebase Console > Firestore > Data sekmesinde manuel olarak:

### users koleksiyonu
```json
{
  "email": "your-email@gmail.com",
  "displayName": "Your Name",
  "photoURL": "",
  "pushSubscription": null,
  "createdAt": "2026-01-31T00:00:00Z"
}
```

### customers koleksiyonu (ornek)
```json
{
  "name": "Ahmet Yilmaz",
  "company": "ABC Sirket",
  "email": "ahmet@abc.com",
  "phone": "+90 555 123 4567",
  "temperature": "warm",
  "lastContactDate": "2026-01-15T00:00:00Z",
  "notes": "Yeni proje gorusmesi yapildi",
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-15T00:00:00Z"
}
```

---

## Adim 13: Gelistirme Ortamini Calistirma

```bash
# Development server
npm run dev
```

Tarayicida `http://localhost:3000` adresine git.

---

## Kontrol Listesi

- [ ] Next.js projesi olusturuldu
- [ ] shadcn/ui kuruldu ve bilesenler eklendi
- [ ] Ek bagimliliklar kuruldu
- [ ] Firebase projesi olusturuldu
- [ ] Firebase Authentication (Google) aktif
- [ ] Firestore olusturuldu ve kurallar eklendi
- [ ] Firestore indexes olusturuldu
- [ ] Firebase Admin SDK key indirildi
- [ ] Resend API key alindi
- [ ] VAPID keys olusturuldu
- [ ] .env.local dosyasi olusturuldu
- [ ] Firebase config dosyalari yazildi
- [ ] Klasor yapisi olusturuldu
- [ ] next.config.js PWA icin yapilandirildi
- [ ] Railway'e deploy edildi
- [ ] Railway env variables eklendi
- [ ] Railway cron job ayarlandi
- [ ] Ilk veriler Firestore'a eklendi
- [ ] Uygulama calisiyor

---

## Sorun Giderme

### Firebase Auth "unauthorized domain" hatasi

Firebase Console > Authentication > Settings > Authorized domains'e `localhost` ve Railway URL'ini ekle.

### Firestore "permission denied" hatasi

- Security rules'in dogru yazildigini kontrol et
- Kullanicinin giris yaptigini kontrol et
- Firebase Console'da rules simulator ile test et

### Railway deployment hatasi

- Build logs'u kontrol et
- Environment variables'in dogru eklendigini kontrol et
- `FIREBASE_ADMIN_PRIVATE_KEY` icindeki `\n` karakterlerini kontrol et

### PWA calismiyor

- `next.config.js` yapilandirmasini kontrol et
- `public/manifest.json` dosyasinin varligini kontrol et
- HTTPS gerekli (localhost haric)
