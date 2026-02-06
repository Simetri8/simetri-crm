# Geliştirme Planı: v3.0 Contact-First Dönüşüm

**Tarih:** 06.02.2026
**Referans:** `docs/00-Proje-Dokümantasyonu.md` v3.0

Bu plan, mevcut MVP kodunu v3.0 Contact-First yaklaşımına dönüştürmek için gereken adımları tanımlar.

---

## Faz 0: Contact-First Dönüşüm

### Adım 1: Type Tanımları Güncelleme
**Dosya:** `lib/types/index.ts`

**Yeni Enum'lar:**
```typescript
// Contact Stage
export const CONTACT_STAGES = ['new', 'networking', 'warm', 'prospect', 'client', 'inactive'] as const;
export type ContactStage = (typeof CONTACT_STAGES)[number];

// Contact/Company Source
export const CONTACT_SOURCES = ['event', 'referral', 'inbound', 'outbound', 'linkedin', 'other'] as const;
export type ContactSource = (typeof CONTACT_SOURCES)[number];

export const COMPANY_SOURCES = ['event', 'referral', 'inbound', 'outbound', 'other'] as const;
export type CompanySource = (typeof COMPANY_SOURCES)[number];

// Request Enums
export const REQUEST_TYPES = ['technical-assessment', 'demo-setup', 'cost-estimate', 'design', 'content', 'other'] as const;
export type RequestType = (typeof REQUEST_TYPES)[number];

export const REQUEST_PRIORITIES = ['low', 'normal', 'urgent'] as const;
export type RequestPriority = (typeof REQUEST_PRIORITIES)[number];

export const REQUEST_STATUSES = ['open', 'in-progress', 'done', 'cancelled'] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];
```

**Güncellenecek Enum'lar:**
```typescript
// Company Status genişletme
export const COMPANY_STATUS = ['prospect', 'active', 'inactive', 'churned'] as const;

// Activity Types'a networking ekleme
export const ACTIVITY_TYPES = ['call', 'meeting', 'email', 'note', 'file', 'decision', 'networking', 'system'] as const;

// System Events'e yenileri ekleme
export const SYSTEM_EVENTS = [
  ...mevcut değerler,
  'request_created',
  'request_completed',
  'contact_stage_changed',
] as const;
```

**Güncellenecek Tipler:**

1. **Contact** — Bağımsız varlık, NextActionFields ekle:
```typescript
export type Contact = Omit<BaseEntity, 'isArchived'> & NextActionFields & {
  companyId: string | null;        // ← opsiyonel (eskiden zorunluydu)
  companyName: string | null;      // ← nullable
  fullName: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  stage: ContactStage;             // ← YENİ
  source: ContactSource | null;    // ← YENİ
  sourceDetail: string | null;     // ← YENİ
  isPrimary: boolean;
  notes: string | null;
  tags: string[];                  // ← YENİ
};
```

2. **ContactFormData** — Genişlet:
```typescript
export type ContactFormData = {
  companyId?: string | null;       // ← opsiyonel
  fullName: string;
  title?: string | null;
  email?: string | null;
  phone?: string | null;
  stage?: ContactStage;
  source?: ContactSource | null;
  sourceDetail?: string | null;
  isPrimary?: boolean;
  notes?: string | null;
  tags?: string[];
  nextAction?: string | null;
  nextActionDate?: Date | null;
  ownerId?: string | null;
};
```

3. **Company** — source/sourceDetail ekle:
```typescript
export type Company = BaseEntity & NextActionFields & {
  name: string;
  status: CompanyStatus;       // artık 'prospect' | 'active' | 'inactive' | 'churned'
  source: CompanySource | null;    // ← YENİ
  sourceDetail: string | null;     // ← YENİ
  tags: string[];
  logoUrl: string | null;
};
```

4. **Activity** — contactId, requestId ekle:
```typescript
export type Activity = Omit<BaseEntity, 'isArchived' | 'updatedAt' | 'updatedBy'> & {
  contactId: string | null;        // ← YENİ
  contactName: string | null;      // ← YENİ (denormalized)
  companyId: string | null;
  companyName: string | null;
  dealId: string | null;
  dealTitle: string | null;
  workOrderId: string | null;
  workOrderTitle: string | null;
  requestId: string | null;        // ← YENİ
  requestTitle: string | null;     // ← YENİ (denormalized)
  type: ActivityType;
  source: ActivitySource;
  systemEvent: SystemEvent | null;
  summary: string;
  details: string | null;
  nextAction: string | null;
  nextActionDate: Timestamp | null;
  occurredAt: Timestamp;
};
```

5. **Request** — Tamamen yeni:
```typescript
export type Request = BaseEntity & {
  title: string;
  description: string | null;
  type: RequestType;
  priority: RequestPriority;
  status: RequestStatus;
  requesterId: string;
  requesterName: string;           // Denormalized
  assigneeId: string | null;
  assigneeName: string | null;     // Denormalized
  contactId: string | null;
  contactName: string | null;      // Denormalized
  companyId: string | null;
  companyName: string | null;      // Denormalized
  dealId: string | null;
  dealTitle: string | null;        // Denormalized
  workOrderId: string | null;
  workOrderTitle: string | null;   // Denormalized
  dueDate: Timestamp | null;
  resolution: string | null;
};
```

6. **Dashboard Types** — Genişlet:
```typescript
export type DashboardKPIs = {
  overdueNextActions: number;
  todayNextActions: number;
  openWorkOrders: number;
  pendingTimesheets: number;
  openRequests: number;            // ← YENİ
  newContacts: number;             // ← YENİ (son 7 gün)
};

export type FollowUpItem = {
  type: 'company' | 'deal' | 'contact';   // ← contact eklendi
  id: string;
  title: string;
  // ... geri kalanı aynı
};
```

---

### Adım 2: Firebase Servis Güncelleme — Contact Service
**Dosya:** `lib/firebase/contacts.ts`

Değişiklikler:
- `getAll()` — stage, source, ownerId filtresi ekle
- `add()` — companyId opsiyonel, stage varsayılan 'new', source/sourceDetail kaydet
- `update()` — stage değişikliğinde system activity oluştur
- `updateStage()` — Yeni method: stage geçişi + system activity
- `updateNextAction()` — Yeni method (company/deal ile aynı pattern)
- `updateLastActivity()` — Yeni method
- `getOverdueFollowUps()` — Yeni method: nextActionDate < today
- `getTodayFollowUps()` — Yeni method: nextActionDate == today
- `getByStage()` — Yeni method: belirli stage'deki kişiler
- `getRecentNew()` — Yeni method: son 7 günde eklenen new stage kişiler

---

### Adım 3: Firebase Servis Güncelleme — Company Service
**Dosya:** `lib/firebase/companies.ts`

Değişiklikler:
- `add()` — source, sourceDetail alanlarını kaydet
- `update()` — source, sourceDetail güncelle
- Status enum'u artık `prospect | active | inactive | churned`
- `getAll()` — yeni status değerlerini destekle

---

### Adım 4: Firebase Servis Güncelleme — Activity Service
**Dosya:** `lib/firebase/activities.ts`

Değişiklikler:
- `add()` — contactId/contactName denormalize et, requestId/requestTitle denormalize et
- `add()` — contactId varsa contact.lastActivityAt güncelle
- `getByContactId()` — Yeni method
- `addSystemActivity()` — contactId, requestId desteği ekle
- Validation: En az bir referans alanı dolu olmalı

---

### Adım 5: Firebase Servis Oluşturma — Request Service
**Yeni dosya:** `lib/firebase/requests.ts`

Methods:
- `getAll(options?)` — status, type, priority, assigneeId, requesterId filtresi
- `getById(id)`
- `add(data, userId)` — Denormalize + system activity oluştur
- `update(id, data, userId)`
- `updateStatus(id, status, userId, resolution?)` — done olduğunda resolution kaydet + system activity
- `delete(id)`
- `getOpen(options?)` — status: open | in-progress
- `getByAssignee(assigneeId)` — Atanan kişinin talepleri

---

### Adım 6: Firebase Servis Güncelleme — Dashboard Service
**Dosya:** `lib/firebase/dashboard.ts`

Değişiklikler:
- `getKPIs()` — openRequests ve newContacts ekle
- `getFollowUps()` — Contact bazlı takipleri de dahil et (type: 'contact')
- `getNetworkingContacts()` — Yeni method: stage = new | networking, son 7 gün
- `getOpenRequests()` — Yeni method: request.status = open | in-progress

---

### Adım 7: Contact UI Güncelleme
**Dosyalar:**
- `components/crm/contact-form-dialog.tsx` — stage, source, sourceDetail, nextAction, nextActionDate, ownerId, tags alanları ekle; companyId opsiyonel yap
- `components/crm/contact-list.tsx` — stage badge, source bilgisi, nextAction kolonları ekle; filtreleme (stage, source)
- `app/(auth)/crm/contacts/page.tsx` — Bağımsız contacts sayfası (artık company altında değil, kendi başına da erişilebilir)

---

### Adım 8: Company UI Güncelleme
**Dosyalar:**
- `components/crm/company-form-dialog.tsx` — source, sourceDetail alanları ekle; status dropdown'ını prospect | active | inactive | churned ile güncelle

---

### Adım 9: Activity UI Güncelleme
**Dosyalar:**
- `components/crm/activity-form-dialog.tsx` — contactId seçici ekle, networking type ekle
- `components/crm/activity-feed.tsx` — contact ve request bilgisini göster

---

### Adım 10: Dashboard Güncelleme
**Dosyalar:**
- `components/dashboard/kpi-cards.tsx` — openRequests, newContacts KPI'ları ekle
- `components/dashboard/follow-ups-panel.tsx` — Contact bazlı takipleri dahil et
- `hooks/use-dashboard.ts` — Yeni query'leri entegre et

---

## Faz 0.5: İç Talepler + Quick Action

### Adım 11: Request UI Oluşturma
**Yeni dosyalar:**
- `components/crm/request-list.tsx` — Talep listesi (filtreleme: status, type, assignee)
- `components/crm/request-form-dialog.tsx` — Talep oluşturma/düzenleme formu

**Sayfa:**
- `app/(auth)/crm/requests/page.tsx` — Talepler sayfası

**Sidebar:**
- `components/layout/app-sidebar.tsx` — Requests menü öğesi ekle

---

### Adım 12: Quick Action Panel Geliştirme
**Dosya:** `components/layout/quick-action-button.tsx` (mevcut, genişletilecek)

Değişiklikler:
- FAB menüsü: Görüşme Kaydet, Hızlı Not, Takip Planla, Talep Oluştur
- Hızlı Aktivite Formu (sheet/dialog)
  - Tip seçimi (icon butonları)
  - Kişi/şirket arama (son kullanılanlar üstte)
  - Özet
  - nextAction opsiyonel
- Hızlı Talep Formu (sheet/dialog)
  - Başlık, tür, bağlam, öncelik, atanan, tarih, açıklama

---

### Adım 13: Dashboard Yeni Paneller
**Yeni dosyalar:**
- `components/dashboard/networking-panel.tsx` — Yeni tanışmalar ve networking kişiler
- `components/dashboard/requests-panel.tsx` — Açık talepler paneli

**Güncelleme:**
- `app/(auth)/dashboard/page.tsx` — Yeni panelleri ekle
- `hooks/use-dashboard.ts` — networkingContacts, openRequests query'leri

---

## Uygulama Sırası (Önerilen)

| Sıra | Adım | Bağımlılık | Tahmini Kapsam |
|------|------|------------|----------------|
| 1 | Types güncelleme | - | Tek dosya |
| 2 | Contact service | Types | Tek dosya, kapsamlı |
| 3 | Company service | Types | Tek dosya, küçük |
| 4 | Activity service | Types | Tek dosya, orta |
| 5 | Request service | Types | Yeni dosya |
| 6 | Dashboard service | Contact, Request service | Tek dosya |
| 7 | Contact UI | Contact service | 3 dosya |
| 8 | Company UI | Company service | 1 dosya |
| 9 | Activity UI | Activity service | 2 dosya |
| 10 | Dashboard UI | Dashboard service | 3 dosya |
| 11 | Request UI | Request service | 3 yeni dosya |
| 12 | Quick Action | Activity + Request service | 1 dosya, kapsamlı |
| 13 | Dashboard paneller | Dashboard service | 2 yeni dosya |

**Toplam etkilenen dosya sayısı:** ~20 dosya (12 güncelleme + 8 yeni)

---

## Dikkat Edilecekler

1. **Mevcut veri uyumluluğu**: Firestore'da mevcut contact kayıtları varsa, `stage` ve `source` alanları olmayacak. Servis katmanında varsayılan değerler atanmalı (okuma sırasında `stage ?? 'client'`, `source ?? null`).

2. **Company status migrasyonu**: Mevcut `active` kayıtlar sorunsuz çalışacak. `inactive` da aynı. Yeni `prospect` ve `churned` sadece yeni kayıtlarda kullanılacak.

3. **Denormalizasyon tutarlılığı**: Contact name değiştiğinde, activity ve request'lerdeki `contactName` alanları da güncellenmeli (batch update).

4. **Firestore index'leri**: Contact için yeni composite index'ler gerekebilir:
   - `stage + nextActionDate` (dashboard sorguları)
   - `ownerId + stage` (kullanıcı bazlı filtre)
   - `source + createdAt` (kaynak analizi)
