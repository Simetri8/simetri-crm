Bu doküman, ajansın “ileri teknik” ihtiyaçlarından ziyade **günlük satış ve müşteri süreçlerini** takip etmeyi kolaylaştıran **MVP dashboard** tasarımını anlatır.

Dashboard’un amacı: “Bugün neyi unutmamalıyım?” sorusuna 5 saniyede cevap vermek.

---

# Dashboard (MVP \- Ajans Günlük Kontrol)

**Tasarım deseni:** Bento Grid (izgara)  
**Hedef kullanıcı:** MVP’de tek kullanıcı: `admin`  
**Temel yaklaşım:** “Next Action + Activity + Pipeline + Work Order + Timesheet”

## 1. Dashboard’un cevaplaması gereken sorular

- Bugün kime dönüş yapmalıyım? (**Bugün planlı takipler**)
- Hangi takipler gecikti? (**Geciken next action’lar**)
- Pipeline’da hangi işler var ve nerede takılıyor? (**stage özetleri**)
- Operasyonda hangi işler riskli? (**teslim tarihi yaklaşan/geçen iş emirleri**)
- Kimde onay bekleyen zaman girişi var? (**timesheet onayı**)

## 2. Üst KPI Şeridi (Hızlı Nabız)

En üstte 4 kart önerilir:

1. **Geciken Takipler**  
   - Veri: `companies` + `deals` içinden `nextActionDate < today` ve `isArchived=false`  
   - Alt metin: “En eskisi: 9 gün”

2. **Bugün Yapılacaklar**  
   - Veri: `nextActionDate == today`  
   - Alt metin: “Sorumlusu bana ait: 6”

3. **Açık İş Emirleri**  
   - Veri: `work_orders.status == active | on-hold`  
   - Alt metin: “Bu hafta teslim: 3”

4. **Onay Bekleyen Zaman Girişleri**  
   - Veri: `time_entries.status == submitted` (pm/admin için)  
   - Alt metin: “Kilitlenmemiş hafta: 2”

> Not: Finans ve kaynak doluluk KPI’ları MVP’de şart değil; istenirse “phase 2” olarak eklenir.

## 3. Ana Paneller (Bento Grid içi)

### 3.1. Bugün & Geciken Takipler (Sol geniş alan)

**Liste**: şirket ve deal bazında tek liste (karışık olabilir), her satırda:

- İsim (Company / Deal başlığı)
- `nextAction` (kısa)
- `nextActionDate`
- `owner` (avatar)
- Son aktivite (`lastActivityAt`)
  - Not: `lastActivityAt`, kullanıcı aktiviteleri kadar sistem aktiviteleriyle de güncellenir (stage/status değişimleri vb.)

**Aksiyonlar**:

- “Tamamlandı” → kullanıcı yeni `nextAction` + tarih girmeden kapatamaz (takip disiplinini korur).
- “Aktivite ekle” (Call/Meeting/Note/Decision hızlı kısayol)

### 3.2. Pipeline Özeti (Orta alan)

Kanban’ın kendisini dashboard’a koymak yerine MVP’de **özet** önerilir:

- Stage başına kart sayısı (lead, qualified, proposal-sent, negotiation, won, lost)
- Stage başına toplam “beklenen bütçe” (deal’de `estimatedBudgetMinor`)
- “Proposal-sent” olup 7 gündür aktivite yok uyarısı (smart nudge)

### 3.3. Operasyon / İş Emri Riski (Sağ alan)

**Liste**: Açık iş emirleri içinde riskli olanlar öne çıkar:

- `targetDeliveryDate` geçmiş veya 7 gün içinde yaklaşanlar
- “blocked” deliverable sayısı yüksek olanlar
- “paymentStatus” = deposit-requested gibi operasyonu kilitleyen durumlar

Satırda: iş emri adı, müşteri, hedef tarih, durum, “blocked count”.

### 3.4. Timesheet Onay Paneli (Alt alan)

**PM/Admin** için:

- Kullanıcı bazında “bu hafta submitted toplam dk” + “incele/onayla/kilitle”

**Member** için:

- “Bu hafta kaç saat girdim?” + “Gönder (submit)” + eksik gün uyarısı

## 4. Smart Nudge Kuralları (MVP’de basit)

Bu uyarılar “AI” gerektirmez; basit kurallarla çıkar:

- **Takip gecikti**: `nextActionDate < today`
- **Teklif askıda**: deal stage `proposal-sent` ve `lastActivityAt <= today-7`
- **İş teslim gecikiyor**: work order `targetDeliveryDate < today` ve `status != completed`
- **Blocked işleri**: task/deliverable `status=blocked` ve `updatedAt <= today-3`

## 5. Teknik Uygulama Notları (MVP)

MVP’de hedef “basit ve doğru”dur:

- Dashboard, mümkünse birkaç küçük sorgu ile toplanır (her panel “limitli” okunur).
- “Liste” panellerinde `limit` + sayfalama kullanılır.
- Sorgular için denormalizasyon: `companies.lastActivityAt`, `deals.lastActivityAt` alanları write sırasında güncellenir.

**Gerekirse (sonra)** performans için `dashboard_stats` gibi agregasyon dokümanı eklenebilir; ancak MVP’de zorunlu değildir.

## 6. Örnek Dashboard Veri Yapısı (MVP)

```json
{
  "kpis": {
    "overdueNextActions": 12,
    "todayNextActions": 8,
    "openWorkOrders": 5,
    "pendingTimesheets": 3
  },
  "followUps": [
    {
      "type": "deal",
      "id": "deal_1",
      "title": "ABC Lojistik - Mobil Uygulama",
      "nextAction": "Teklif revizesi gönder",
      "nextActionDate": "2026-02-02",
      "ownerId": "uid_pm",
      "lastActivityAt": "2026-01-28"
    }
  ],
  "pipelineSummary": [
    { "stage": "lead", "count": 4, "sumEstimatedBudgetMinor": 25000000 },
    { "stage": "proposal-sent", "count": 3, "sumEstimatedBudgetMinor": 18000000 }
  ],
  "workOrderRisks": [
    {
      "workOrderId": "wo_9",
      "title": "XYZ - Web Site Revamp",
      "targetDeliveryDate": "2026-02-05",
      "status": "active",
      "blockedDeliverables": 2,
      "paymentStatus": "deposit-requested"
    }
  ],
  "timesheetQueue": [
    { "userId": "uid_1", "weekKey": "2026-W05", "submittedMinutes": 1920 }
  ]
}
```

Bu yapı, ajansın “takip disiplini”ni artırır: next action’lar görünür olur, işler teslimata bağlanır ve zaman onayı düzenli akar.