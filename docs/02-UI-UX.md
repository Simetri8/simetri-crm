# **UI/UX ve Ekran Spesifikasyonu (MVP)**

Bu doküman, `docs/00-Proje-Dokümantasyonu.md` içindeki UI ile ilgili kısımların tek yerde toplanmış halidir.

> Dashboard tasarım detayları ayrıca `docs/01-Dashboard.md` dokümanındadır.

---

## **1. Tasarım Prensipleri (MVP)**

- **Next Action odaklılık**: Her Company/Deal/Work Order detayında kullanıcıya “sonraki adım”ı netleştirir.
- **Tek Activity Feed**: Notlar, görüşmeler, kararlar, dosyalar ve “sonraki adım” tek akışta tutulur.
- **Sade durumlar**: İş akışı az ama net durumlarla yürür (karmaşık proje yönetimi yok).
- **MVP kullanıcı modeli**: MVP’de sadece `admin` kullanıcı vardır (menü/aksiyon filtrelemesi yok).

## **2. Global UI Davranışları**

### **2.1. Sayfa Üst Bar Standardı (Detay Ekranları)**

Company / Deal / Work Order detay sayfalarının üst bölümünde şu alanlar **hızlı düzenlenebilir** olmalıdır:

- `nextAction`
- `nextActionDate`
- `owner`

Bu alanlar “takip disiplini” için kritik kabul edilir.

### **2.2. Activity Ekleme (Hızlı Aksiyon)**

Detay sayfalarında “Aktivite ekle” bir tıklama ile şu şablonları sunar:

- Call
- Meeting
- Email
- Note
- Decision
- File

Her aktivitede opsiyonel olarak:

- `nextAction`
- `nextActionDate`

girilebilmelidir.

**Sistem aktiviteleri (MVP):** Deal stage değişimi, teklif gönderme/kabul/red, work order / deliverable status değişimleri gibi olaylar da `activities` akışında **`type=system`** olarak görünür.

### **2.3. “Tamamlandı” Kuralı (Takip Disiplini)**

Dashboard’daki “Takip tamamlandı” aksiyonu, kullanıcı yeni bir `nextAction` + `nextActionDate` girmeden “tamamlandı” saymamalıdır.

> İstisna: Deal “lost” veya Work Order “cancelled/completed” gibi kapanış durumları.

## **3. Navigasyon / Ekranlar (MVP)**

Repo yapısına uyumlu önerilen sayfalar (mevcut `app/(auth)/...` düzeniyle):

- `/(auth)/dashboard`  
  - Amaç: Bugün/Gecikenler/Hafta, Pipeline özeti, Açık iş emirleri, Timesheet onayı  
  - Detay: `docs/01-Dashboard.md`

- `/(auth)/crm/companies`  
  - Amaç: Şirket listesi + hızlı `nextAction`/tarih güncelleme

- `/(auth)/crm/companies/[id]`  
  - Amaç: Company detay + contacts + activities + açık work orders

- `/(auth)/crm/contacts`  
  - Amaç: Kişi rehberi (company ile ilişki)

- `/(auth)/crm/pipeline`  
  - Amaç: Deal kanban (stage bazlı)

- `/(auth)/crm/deals/[id]`  
  - Amaç: Deal detay + proposals + activities + next action

- `/(auth)/crm/proposals`  
  - Amaç: Teklif listesi (durum, versiyon)

- `/(auth)/crm/proposals/[id]`  
  - Amaç: Teklif edit + PDF + kabul kaydı

- `/(auth)/ops/work-orders`  
  - Amaç: İş emri listesi (active/on-hold/completed)

- `/(auth)/ops/work-orders/[id]`  
  - Amaç: Deliverables + tasks + activities + ödeme durumu + hedef tarih

- `/(auth)/time`  
  - Amaç: Kişisel haftalık zaman girişi (draft → submitted)

- `/(auth)/time/approve`  
  - Amaç: Timesheet onay (pm/admin)

- `/(auth)/catalog`  
  - Amaç: Katalog kalemleri yönetimi (opsiyonel ama önerilir)

- `/(auth)/users`  
  - Amaç: Kullanıcı/rol yönetimi

## **4. Ekran Bazlı UI Kuralları**

### **4.1. Deal (Pipeline)**

- Stage seti: `lead | qualified | proposal-prep | proposal-sent | negotiation | won | lost`
- Deal “lost” yapılırsa: `lostReason` seçimi zorunlu.
- Deal “won” yapılırsa: Work Order oluşturma akışı tetiklenir (wizard olabilir).

### **4.2. Work Order (Operasyon)**

- Work order status: `active | on-hold | completed | cancelled`
- Work order içinde 3-7 deliverable önerilir (UI bunu teşvik eder).
- Risk göstergeleri: hedef tarih yaklaşması/geçmesi, blocked deliverable sayısı, paymentStatus.

### **4.3. Task Kanban**

- Task status: `backlog | in-progress | blocked | done`
- `blocked` seçilirse: `blockedReason` zorunlu.

### **4.4. Proposal (Teklif)**

Teklif ekranında görünür ve düzenlenebilir olmalı:

- Versiyon (`version`)
- Durum (`draft | sent | accepted | rejected`)
- `pricesIncludeTax` (KDV dahil/haric)
- Kabul kaydı: `acceptedAt`, `acceptedByName`, `acceptanceNote`

## **5. UI Bileşen Rehberi (MVP)**

- **Listeler**: arama + filtre + sayfalama (limitli okuma)
- **Detay sayfaları**: üstte “Next Action bar”, altta sekmeler (Overview / Activities / Documents gibi)
- **Formlar**: modal/drawer ile hızlı ekleme (contact, activity, deliverable, task)
- **Durum etiketleri**: stage/status/blockedReason gibi enum’lar için tutarlı “badge” kullanımı

