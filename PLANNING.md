# Simetri Planner - Proje Plani

---

## Talep ve Kapsam

### Temel Gereksinimler
- Sirketin(lerin) hareketlerini kaydedebilecegi bir web sitesi
- **Coklu Sirket Destegi:** 
  - Yoneticiler yetkili olduklari tum sirketlerin verilerini **tek dashboard'da birlesik** olarak gorecek (Gecis yapma zorunlulugu yok).
  - Bazi kullanicilar sadece tek bir sirketin verisini gorebilecek.
- Proje durumlari ve musteri iletisimlerini/ilerlemeleri kaydetme
- Mevcut projeler icin backlog (ana is listeleri) yonetimi
- Musterilerle yapilan gorusmeleri kaydetme
- Next.js, Firebase ve sadece Google ile giris

### Dashboard Gereksinimleri
- **Buyuk Ekrana Yansitilacak Yapi:** Tek bakista tum durumu, ilerlemeleri gorebilme.
- **Akilli Durtme (Smart Nudge):** "X firmasini 35 gundur aramadin", "Y projesi gecikiyor" gibi aksiyon odakli uyari kartlari.
- Ana ekranda proje durumlari ve musteri sicak/soguk durumlari gorunmeli.
- Mudahale edilmesi gereken projeler ve iletisime girilmesi gereken musteriler gorunmeli.
- Buyuk kartlar ve buyuk rakamlar OLMAYACAK.
- **Uc ana alan:** Projeler, Musteriler, Son Islemler (Proje ve Musteri olaylari karma liste).
- Haftalik plan dashboard'ta ayrica gorunmeli.

### Tasarim ve UX Gereksinimleri
- **Global Arama (Cmd+K):** Her yerden musteri veya proje arayabilme.
- **Hizli Eylem Menusu (+):** Sag altta sabit buton ile hizli gorusme/gorev ekleme.
- **Surukle & Birak:** Backlog'dan haftalik plana gorev tasima.
- **PWA & Bildirimler:** Uygulama PWA olarak calisacak ve push bildirimleri gonderebilecek.
- Emoji kullanilmayacak, sadece icon ve uygun renkler.
- Tailwind CSS ile birlikte shadcn/ui kullanilacak.
- Layout icin SidebarProvider kullanilacak.

### Vizyon/Hedefler Sayfasi
- Haftalik, aylik ve yillik vizyonu tanimlama
- Sprint takvimi benzeri yapi
- Haftalik: Bitmesi gereken isler ve temasa girilmesi gereken musteriler
- Aylik ve Yillik: Proje baslama/bitirme hedefleri

---

## Teknoloji Stack
- **Frontend:** Next.js 14 (App Router)
- **Backend/Database:** Firebase (Firestore)
- **Authentication:** Firebase Auth (Sadece Google ile giris)
- **Functions:** Firebase Cloud Functions (Otomasyon ve bildirimler icin)
- **UI Framework:** shadcn/ui + Tailwind CSS
- **Layout:** SidebarProvider (shadcn)
- **Icons:** Lucide React
- **PWA:** next-pwa

---

## Ozellikler

### 1. Dashboard (Ana Ekran - Unified View)
Yetkili olunan tum sirketlerin verileri harmanlanmis olarak gelir. Hangi sirkete ait oldugu ufak bir badge/ikon ile belirtilir.

**Ozel Alanlar:**
- **Akilli Durtmeler (Nudges):** En ustte, kapatilabilir uyari bantlari. (Orn: "X Musterisi soguyor, hemen ara")
- **Haftalik Plan:** Bu hafta bitmesi gereken isler ve aranacak musteriler.

**Uc Ana Kolon:**
1. **Projeler:** Aktif projeler (Kompakt).
2. **Musteriler:** Takip edilen musteriler ve sicakliklari.
3. **Son Islemler:** Biten isler VE yapilan gorusmelerin kronolojik, karma listesi.

### 2. Projeler Modulu
- **Proje Listesi:** Filtreleme (Aktif/Beklemede/Bitti).
- **Proje Detay:** Bilgiler, Durum, Hedef Tarihler.
- **Backlog (Is Listesi):** 
  - Surukle/Birak ile siralam ve haftalik plana atama.
  - Durum: Yapilacak | Devam Ediyor | Tamamlandi.
  - Oncelik: Dusuk | Normal | Yuksek | Acil.

### 3. Musteriler Modulu
- **Musteri Listesi:** Sicaklik durumuna gore siralama.
- **Musteri Detay:** Iletisim bilgileri, iliskili projeler, gecmis gorusmeler.
- **Otomatik Sicaklik Sistemi:**
  - Sistem son iletisim tarihine gore sicakligi otomatik gunceller.
  - Sicak (Kirmizi): < 7 gun
  - Ilik (Turuncu): 7-30 gun
  - Soguk (Mavi): > 30 gun

### 4. Iletisim/Gorusme Kayitlari
- **Hizli Ekleme:** Dashboard'dan veya Global Arama'dan hizlica ekleme.
- **Gecmis:** Tum gorusmelerin listesi.

### 5. Otomasyon ve Bildirimler
- **Cloud Functions (Gece Gorevi):**
  - Her gece calisir.
  - Son iletisim tarihine gore musterilerin sicaklik durumunu gunceller (Hot -> Warm -> Cold).
  - Kritik durumlarda (Soguyan musteri, geciken proje) yoneticilere **E-posta** atar.
  - **Push Notification:** PWA uzerinden tarayici bildirimi gonderir.
- **Not:** WhatsApp bildirimi daha sonra degerlendirilecek (Faz 4 sonrasi).

---

## Veritabani Semasi (Firestore)

Veri modeli "Multi-Tenant" (Coklu Kiraci) yapisina uygun olarak guncellenmistir.

### Collections

```
companies/
  {companyId}/
    - name: string
    - logo: string

users/
  {userId}/
    - email: string
    - displayName: string
    - allowedCompanyIds: array [string]  // ['compA', 'compB'] -> Iki sirketi de gorur
    - role: 'admin' | 'viewer'

projects/
  {projectId}/
    - companyId: string  // Hangi sirkete ait?
    - name: string
    - customerId: string
    - customerName: string (Denormalize - okuma kolayligi icin)
    - status: 'active' | 'pending' | 'completed'
    - targetStartDate: timestamp
    - targetEndDate: timestamp
    - ...

tasks/
  {taskId}/
    - companyId: string
    - projectId: string
    - title: string
    - status: 'todo' | 'in_progress' | 'done'
    - weeklyPlanDate: timestamp
    - ...

customers/
  {customerId}/
    - companyId: string
    - name: string
    - company: string
    - temperature: 'hot' | 'warm' | 'cold'
    - lastContactDate: timestamp
    - ...

communications/
  {communicationId}/
    - companyId: string
    - customerId: string
    - type: 'phone' | 'email' | 'meeting'
    - date: timestamp
    - summary: string
    - ...

goals/ (Vizyon)
  {goalId}/
    - companyId: string
    - title: string
    - type: 'weekly' | 'monthly' | 'yearly'
    - ...
```

---

## Gelistirme Sirasi

### Faz 1: Temel Altyapi ve Kurulum
1. Next.js projesi olustur (TypeScript, Tailwind).
2. shadcn/ui kur ve yapilandir.
3. Firebase yapilandirmasi (Auth, Firestore).
4. **Sirket ve Kullanici Yetki Altyapisi:** `companies` ve `users` koleksiyonlarinin ve yetki mantiginin kurulmasi.
5. Layout (SidebarProvider) ve Navigation.

### Faz 2: Temel Moduller (CRUD)
6. Musteriler modulu (Otomatik sicaklik mantigi ile).
7. Projeler modulu.
8. Gorevler/Backlog modulu (Surukle-Birak altyapisi).

### Faz 3: Iletisim, Arama ve Vizyon
9. Iletisim kayitlari modulu.
10. **Global Arama (Cmd+K)** entegrasyonu.
11. Vizyon sayfasi.

### Faz 4: Dashboard ve Otomasyon
12. Dashboard - Unified View (Tum sirket verilerini cekme).
13. Akilli Durtme (Smart Nudge) bileseni.
14. **Cloud Functions:** Otomatik sicaklik guncelleme ve E-posta bildirimi.
15. PWA yapilandirmasi ve Push Bildirimleri.

---

## Guvenlik Kurallari (Firestore)

Kullanici sadece `allowedCompanyIds` listesinde olan sirketlerin verilerine erisebilir.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuthenticated() {
      return request.auth != null;
    }

    // Kullanicinin o sirket verisine erisim hakki var mi?
    function hasCompanyAccess(companyId) {
      let userDoc = get(/databases/$(database)/documents/users/$(request.auth.uid));
      return companyId in userDoc.data.allowedCompanyIds;
    }

    match /projects/{projectId} {
      allow read, write: if isAuthenticated() && hasCompanyAccess(resource.data.companyId);
      allow create: if isAuthenticated() && hasCompanyAccess(request.resource.data.companyId);
    }
    
    // Diger koleksiyonlar icin de benzer kural uygulanacak...
  }
}
```
