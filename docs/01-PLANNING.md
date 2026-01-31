# Simetri Planner - Proje Plani

---

## Talep ve Kapsam

### Temel Gereksinimler
- Sirketin hareketlerini kaydedebilecegi bir web sitesi
- Proje durumlari ve musteri iletisimlerini/ilerlemeleri kaydetme
- Mevcut projeler icin backlog (ana is listeleri) yonetimi
- Musterilerle yapilan gorusmeleri kaydetme
- Next.js, Firebase ve sadece Google ile giris
- **Yetki:** Herkes her seyi gorebilir ve duzenleyebilir (tek seviye yetki - simdilik herkes admin)

### Dashboard Gereksinimleri
- **Buyuk Ekrana Yansitilacak Yapi:** Tek bakista tum durumu gorebilme
- **Akilli Durtme (Smart Nudge):** Aksiyon odakli uyari kartlari
- Proje durumlari ve musteri sicak/soguk durumlari
- Buyuk kartlar ve buyuk rakamlar OLMAYACAK
- **Uc ana alan:** Projeler, Musteriler, Son Islemler
- Haftalik plan dashboard'ta gorunmeli

### Tasarim ve UX Gereksinimleri
- **Global Arama (Cmd+K):** Her yerden musteri veya proje arama
- **Hizli Eylem Menusu (+):** Sag altta sabit buton
- **Surukle & Birak:** Backlog'dan haftalik plana gorev tasima
- **PWA:** Uygulama PWA olarak calisacak
- **Web Push Notifications:** Tarayici bildirimleri
- Emoji kullanilmayacak, sadece icon ve renkler
- shadcn/ui + Tailwind CSS
- SidebarProvider ile layout

### Vizyon/Hedefler Sayfasi
- Haftalik, aylik ve yillik vizyon
- Haftalik: Bitmesi gereken isler ve aranacak musteriler
- Aylik/Yillik: Proje baslama/bitirme hedefleri

---

## Teknik Kararlar

| Karar | Secim |
|-------|-------|
| Hosting | Railway |
| Database | Firebase Firestore (ucretsiz plan) |
| Auth | Firebase Auth (sadece Google) |
| Yetki | Tek seviye - herkes admin |
| Cron Jobs | Railway Cron |
| E-posta | Resend (100/gun ucretsiz) |
| Push Notifications | Web Push API (ucretsiz) |
| Ilk Veriler | Manuel Firestore kaydi |
| Sicaklik Guncelleme | Gunde 1 kez cron job |

---

## Teknoloji Stack

- **Frontend:** Next.js 14 (App Router, TypeScript)
- **Hosting:** Railway
- **Database:** Firebase Firestore
- **Auth:** Firebase Auth (Google)
- **Cron:** Railway Cron Jobs
- **E-posta:** Resend
- **Push:** Web Push API + VAPID
- **UI:** shadcn/ui + Tailwind CSS
- **Icons:** Lucide React
- **PWA:** next-pwa

---

## Ozellikler

### 1. Dashboard (Ana Ekran)

**Ust Alan - Akilli Durtmeler:**
- Kapatilabilir uyari bantlari
- "X Musterisi 35 gundur aranmadi"
- "Y Projesi gecikiyor"

**Ust Alan - Haftalik Plan:**
- Bu hafta bitmesi gereken isler
- Bu hafta aranacak musteriler

**Uc Kolon:**
1. **Projeler:** Aktif projeler listesi (kompakt)
2. **Musteriler:** Musteriler ve sicakliklari
3. **Son Islemler:** Biten isler + gorusmeler (karma liste)

### 2. Projeler Modulu
- **Liste:** Filtreleme (Aktif/Beklemede/Bitti)
- **Detay:** Bilgiler, durum, hedef tarihler
- **Backlog:**
  - Surukle/Birak ile siralama
  - Haftalik plana atama
  - Durum: Yapilacak | Devam Ediyor | Tamamlandi
  - Oncelik: Dusuk | Normal | Yuksek | Acil

### 3. Musteriler Modulu
- **Liste:** Sicaklik durumuna gore siralama
- **Detay:** Iletisim bilgileri, projeler, gorusmeler
- **Sicaklik Sistemi (Otomatik - Cron ile guncellenir):**
  - Sicak (Kirmizi): < 7 gun
  - Ilik (Turuncu): 7-30 gun
  - Soguk (Mavi): > 30 gun

### 4. Iletisim Kayitlari
- Hizli ekleme (+ butonu veya Cmd+K)
- Tip: Telefon | E-posta | Toplanti | Diger
- Ozet ve sonraki adim
- Gorusme gecmisi

### 5. Vizyon Sayfasi
- **Haftalik:** Isler + Musteriler
- **Aylik:** Proje hedefleri
- **Yillik:** Buyuk hedefler

### 6. Otomasyon (Railway Cron)
- **Gunde 1 kez calisir:**
  - Musteri sicakliklarini gunceller
  - Kritik durumlarda e-posta gonderir (Resend)
  - Web Push bildirimi gonderir

---

## Veritabani Semasi (Firestore)

```
users/
  {userId}/
    - email: string
    - displayName: string
    - photoURL: string
    - pushSubscription: object | null  // Web Push icin
    - createdAt: timestamp

projects/
  {projectId}/
    - name: string
    - description: string
    - customerId: string | null
    - customerName: string | null  // Denormalize
    - status: 'active' | 'pending' | 'completed'
    - targetStartDate: timestamp | null
    - targetEndDate: timestamp | null
    - createdAt: timestamp
    - updatedAt: timestamp

tasks/
  {taskId}/
    - projectId: string
    - projectName: string  // Denormalize
    - title: string
    - description: string
    - status: 'todo' | 'in_progress' | 'done'
    - priority: 'low' | 'normal' | 'high' | 'urgent'
    - order: number  // Siralama icin
    - dueDate: timestamp | null
    - weeklyPlanDate: timestamp | null  // Hangi haftaya atandi
    - completedAt: timestamp | null
    - createdAt: timestamp
    - updatedAt: timestamp

customers/
  {customerId}/
    - name: string
    - company: string
    - email: string
    - phone: string
    - temperature: 'hot' | 'warm' | 'cold'
    - lastContactDate: timestamp | null
    - notes: string
    - createdAt: timestamp
    - updatedAt: timestamp

communications/
  {communicationId}/
    - customerId: string
    - customerName: string  // Denormalize
    - type: 'phone' | 'email' | 'meeting' | 'other'
    - date: timestamp
    - summary: string
    - nextAction: string | null
    - nextActionDate: timestamp | null
    - createdAt: timestamp

goals/
  {goalId}/
    - title: string
    - description: string
    - type: 'weekly' | 'monthly' | 'yearly'
    - targetDate: timestamp
    - weekStart: timestamp | null  // Haftalik icin
    - month: number | null  // 1-12
    - year: number
    - relatedProjectId: string | null
    - relatedCustomerId: string | null
    - goalType: 'task' | 'contact' | 'project_start' | 'project_end' | 'milestone'
    - status: 'planned' | 'in_progress' | 'completed' | 'postponed'
    - createdAt: timestamp
    - updatedAt: timestamp
```

---

## Sayfa Yapisi

```
/                       -> Login (giris yapilmamissa)
/dashboard              -> Ana ekran

/projects               -> Proje listesi
/projects/new           -> Yeni proje
/projects/[id]          -> Proje detay + backlog

/customers              -> Musteri listesi
/customers/new          -> Yeni musteri
/customers/[id]         -> Musteri detay + gorusmeler

/communications         -> Tum gorusmeler
/communications/new     -> Yeni gorusme

/vision                 -> Haftalik/Aylik/Yillik hedefler

/api/cron/daily         -> Cron endpoint (Railway tarafindan cagirilir)
/api/push/subscribe     -> Push subscription kaydi
/api/push/send          -> Push bildirim gonderme
```

---

## UI Yapisi

### Layout
```
+------------------+--------------------------------+
|                  |                                |
|    Sidebar       |         Main Content           |
|                  |                                |
|  - Dashboard     |                                |
|  - Projeler      |                                |
|  - Musteriler    |                                |
|  - Iletisim      |                                |
|  - Vizyon        |                                |
|                  |                                |
|  -----------     |                                |
|  Kullanici       |                                |
|  Cikis           |                                |
+------------------+--------------------------------+
                                          [+] Hizli Eylem
```

### Dashboard
```
+--------------------------------------------------+
| [!] Akilli Durtmeler (kapatilabilir bantlar)     |
+--------------------------------------------------+
| Haftalik Plan                                    |
| - Isler: [x] [x] [ ] [ ]                         |
| - Musteriler: [Ahmet] [Mehmet]                   |
+--------------------------------------------------+
| Projeler      | Musteriler     | Son Islemler   |
| (kompakt)     | (sicaklik)     | (karma liste)  |
+--------------------------------------------------+
```

### Vizyon Sayfasi
```
+--------------------------------------------------+
|  [Haftalik]  [Aylik]  [Yillik]                   |
+--------------------------------------------------+
| Hafta: 3-9 Subat 2026           [<] [>]          |
+--------------------------------------------------+
| Bitmesi Gereken Isler  | Aranacak Musteriler     |
| [ ] Gorev 1            | [ ] Musteri X           |
| [ ] Gorev 2            | [ ] Musteri Y           |
| [+ Ekle]               | [+ Ekle]                |
+--------------------------------------------------+
```

---

## shadcn/ui Bilesenleri

- **Layout:** SidebarProvider, Sidebar, SidebarContent, SidebarMenu
- **Navigation:** Tabs
- **Data:** Table, Card, Badge, Avatar
- **Forms:** Input, Select, Textarea, Button, Calendar
- **Feedback:** Dialog, AlertDialog, Toast, Sonner
- **Other:** Command (Cmd+K), Separator, ScrollArea

---

## Renk Semasi

```css
/* Sicaklik */
hot: red-500
warm: amber-500
cold: blue-500

/* Proje Durumu */
active: emerald-500
pending: amber-500
completed: slate-400

/* Oncelik */
urgent: red-500
high: amber-500
normal: slate-500
low: slate-300
```

---

## Gelistirme Fazlari

### Faz 1: Altyapi
1. Next.js projesi (TypeScript, Tailwind)
2. shadcn/ui kurulumu
3. Firebase yapilandirmasi (Auth + Firestore)
4. Railway deployment
5. Layout (SidebarProvider) + Navigation

### Faz 2: CRUD Moduller
6. Musteriler modulu
7. Projeler modulu
8. Gorevler/Backlog (Surukle-Birak dahil)
9. Iletisim kayitlari

### Faz 3: Dashboard + UX
10. Dashboard (3 kolon + haftalik plan)
11. Akilli Durtmeler
12. Global Arama (Cmd+K)
13. Hizli Eylem Menusu (+)

### Faz 4: Vizyon + Otomasyon
14. Vizyon sayfasi
15. Railway Cron Job (sicaklik + bildirimler)
16. Resend e-posta entegrasyonu

### Faz 5: PWA + Push
17. PWA yapilandirmasi (next-pwa)
18. Web Push Notifications
19. Service Worker

---

## Guvenlik Kurallari (Firestore)

Sadece giris yapmis kullanicilar erisebilir. Herkes her seyi yapabilir.

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

---

## Cron Job Detayi

**Endpoint:** `/api/cron/daily`
**Calisma Saati:** Her gun 08:00 (Railway Cron)

**Islemler:**
1. Tum musterileri cek
2. Her musteri icin:
   - `lastContactDate` ve bugun arasindaki farki hesapla
   - Sicakligi guncelle (hot/warm/cold)
3. Kritik durumlar icin:
   - 30+ gun iletisim yok -> E-posta gonder
   - Geciken projeler -> E-posta gonder
4. Push bildirimi gonder (abone olanlara)

**Railway Cron Syntax:** `0 8 * * *`

---

## Notlar

- Ilk kullanici ve veriler manuel olarak Firebase Console'dan eklenecek
- Denormalize alanlar (customerName, projectName) guncelleme sirasinda senkronize edilecek
- Firestore ucretsiz limit: 50K okuma/gun, 20K yazma/gun
- Resend ucretsiz limit: 100 email/gun
