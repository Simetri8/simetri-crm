# Simetri CRM — Ajans CRM & İş Takip Uygulaması

> Yazılım geliştirme ve dijital ajansların **müşteri ilişkileri**, **teklif yönetimi**, **iş emri/teslimat takibi**, **zaman kaydı** ve **iletişim geçmişini** tek yerden yönettiği iş odaklı CRM uygulaması.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Backend-FFCA28?logo=firebase)](https://firebase.google.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Deploy](https://img.shields.io/badge/Deploy-Railway-0B0D0E?logo=railway)](https://railway.app/)

---

## 🎯 Çözdüğü Problemler

| Problem                                                            | Çözüm                                                              |
| ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| **Kayıp bağlantılar** — etkinlikte tanışılan kişi unutuldu         | Contact-First CRM — kişi merkezli kayıt ve ilişki takibi           |
| **Unutulan takipler** — müşteriye dönüş yapılmadı                  | Next Action sistemi — her kayıtta sonraki adım + tarih             |
| **Dağınık iletişim** — notlar farklı kanallarda kayboldu           | Tek Activity Feed — görüşme, not, dosya, karar tek akışta          |
| **Teslimata dönüşmeyen işler** — kapsam belirsiz, görevler dağınık | İş Emri + Teslimat yapısı — deal → work order → deliverable → task |

---

## 🏗️ Teknoloji Yığını

| Katman          | Teknoloji                                        |
| --------------- | ------------------------------------------------ |
| **Frontend**    | Next.js 16 (App Router), React 19, TypeScript    |
| **UI**          | Tailwind CSS 4 + shadcn/ui (Radix UI primitives) |
| **State**       | Jotai, React Hook Form + Zod                     |
| **Backend**     | Firebase (Auth + Firestore + Storage)            |
| **Drag & Drop** | @dnd-kit                                         |
| **Tablo**       | @tanstack/react-table                            |
| **PDF**         | jsPDF + jspdf-autotable                          |
| **Animasyon**   | Motion (Framer Motion)                           |
| **Deploy**      | Railway                                          |

---

## 📁 Proje Yapısı

```
simetri-crm/
├── app/                    # Next.js App Router sayfaları & rotaları
│   └── (auth)/crm/        # CRM modül sayfaları (dashboard, contacts, deals, vb.)
├── components/             # UI bileşenleri
│   ├── crm/                # CRM'e özgü bileşenler
│   └── ui/                 # shadcn/ui genel bileşenler
├── hooks/                  # Custom React hook'ları
├── lib/                    # Servis katmanı, tipler, yardımcı fonksiyonlar
│   ├── services/           # Firebase Firestore CRUD servisleri
│   └── types/              # TypeScript tip tanımları
├── docs/                   # Proje dokümantasyonu
└── public/                 # Statik dosyalar
```

---

## 🚀 Kurulum

### Gereksinimler

- Node.js 18+
- npm veya yarn
- Firebase projesi (Auth + Firestore etkin)

### 1. Depoyu klonlayın

```bash
git clone https://github.com/<your-org>/simetri-crm.git
cd simetri-crm
```

### 2. Bağımlılıkları yükleyin

```bash
npm install
```

### 3. Ortam değişkenlerini ayarlayın

`.env.example` dosyasını `.env.local` olarak kopyalayın ve Firebase bilgilerinizi doldurun:

```bash
cp .env.example .env.local
```

### 4. Geliştirme sunucusunu başlatın

```bash
npm run dev
```

Uygulama varsayılan olarak [http://localhost:3000](http://localhost:3000) adresinde çalışır.

---

## 📜 Komutlar

| Komut           | Açıklama                                 |
| --------------- | ---------------------------------------- |
| `npm run dev`   | Geliştirme sunucusunu başlatır (Webpack) |
| `npm run build` | Üretim derlemesi oluşturur               |
| `npm run start` | Üretim sunucusunu başlatır               |
| `npm run lint`  | ESLint ile kod kontrolü yapar            |

---

## 🔄 İş Akışı Özeti

```
Tanışma → Kişi Oluştur → İlişki Kur → Fırsat Belirle → Deal Aç
    → Teklif Hazırla → Gönder → Müzakere → Kazan/Kaybet
    → İş Emri Oluştur → Teslimatları Tanımla → Görevleri Ata
    → Zaman Girişi → Haftalık Onay → Kilitle
```

### İlişki Aşamaları (Contact Stages)

| Aşama        | Açıklama                              |
| ------------ | ------------------------------------- |
| `new`        | Yeni tanışıldı, henüz etkileşim yok   |
| `networking` | Aktif ilişki kurma, iş konuşulmamış   |
| `warm`       | İyi ilişki var, potansiyel iş sinyali |
| `prospect`   | Somut iş fırsatı belirdi              |
| `client`     | Aktif iş ilişkisi var                 |
| `inactive`   | İletişim kesildi                      |

### Deal Pipeline Aşamaları

`lead` → `qualified` → `proposal-prep` → `proposal-sent` → `negotiation` → `won` | `lost`

### Task Kanban Durumları

`backlog` → `in-progress` → `blocked` → `done`

---

## 📊 Veri Modeli (Firestore Koleksiyonları)

| Koleksiyon        | Açıklama                                               |
| ----------------- | ------------------------------------------------------ |
| `contacts`        | Kişiler — bağımsız, şirketsiz olabilir (Contact-First) |
| `companies`       | Müşteri şirketleri                                     |
| `deals`           | Satış fırsatları / Pipeline kartları                   |
| `proposals`       | Teklifler (kalem, KDV, versiyon)                       |
| `work_orders`     | İş emirleri (deal kazanıldığında otomatik oluşur)      |
| `deliverables`    | Teslimatlar (iş emrine bağlı, 3-7 adet)                |
| `tasks`           | Görevler (teslimata bağlı)                             |
| `activities`      | İletişim ve not akışı (Activity Feed)                  |
| `requests`        | İç talepler (satış → teknik ekip)                      |
| `time_entries`    | Zaman girişleri (timesheet)                            |
| `catalog_items`   | Hizmet/kalem kataloğu (opsiyonel)                      |
| `change_requests` | Kapsam değişiklikleri (opsiyonel)                      |

---

## 🗺️ MVP Yol Haritası

- [x] **Faz 0** — Contact-First Dönüşüm (kişi/şirket/aktivite model revizyonu)
- [ ] **Faz 0.5** — İç Talepler + Quick Action Panel
- [x] **Faz 1** — CRM Temeli (şirket/kişi CRUD, deal pipeline, activity feed)
- [ ] **Faz 2** — Teklif (katalog, KDV, versiyon, PDF)
- [ ] **Faz 3** — Operasyon (iş emri, teslimat, görev, kanban)
- [ ] **Faz 4** — Zaman Takibi (timesheet, onay, kilitleme)

---

## 📖 Dokümantasyon

| Doküman                                                         | Açıklama                                                           |
| --------------------------------------------------------------- | ------------------------------------------------------------------ |
| [`00-Proje-Dokümantasyonu.md`](docs/00-Proje-Dokümantasyonu.md) | Ana ürün tasarım dokümanı (veri modeli, iş akışları, yol haritası) |

---

## MCP (Remote Streamable HTTP)

Bu projede AI agent entegrasyonu için API key korumalı MCP endpointi bulunur:

- Endpoint: `https://<domain>/api/mcp`
- Transport: Streamable HTTP
- Auth: `Authorization: Bearer <MCP_API_KEY>`

### Ortam Değişkenleri

- `MCP_API_KEY` (zorunlu)
- `MCP_API_KEY_PREVIOUS` (opsiyonel, key rotasyonu)
- `MCP_API_KEYS` (opsiyonel, çoklu aktif key)
- `MCP_RATE_LIMIT_PER_MINUTE` (varsayılan: `60`)
- `MCP_ALLOWED_IPS` (opsiyonel)
- `MCP_ALLOWED_ORIGINS` (opsiyonel)

### Güvenlik Notları

- Endpoint internetten erişilecekse TLS zorunlu olmalıdır.
- API key değerlerini repoda tutmayın; sadece secret manager / runtime env üzerinden verin.
- Reverse proxy tarafında `/api/mcp` için ek rate limit ve request body limit tanımlayın.

### Örnek Client Konfigürasyonu

```json
{
  "mcpServers": {
    "simetri-remote": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://<domain>/api/mcp",
        "--header",
        "Authorization: Bearer <MCP_API_KEY>"
      ]
    }
  }
}
```

Sunucuda varsayılan olarak şu araçlar yayınlanır: `health_check`, `list_companies`, `list_deals`, `get_dashboard_snapshot`.

---

## 📄 Lisans

Bu proje özel bir projedir. Tüm hakları saklıdır.
