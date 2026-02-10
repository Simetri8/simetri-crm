import { companyService } from './companies';
import { contactService } from './contacts';
import { dealService } from './deals';
import { proposalService } from './proposals';
import { workOrderService } from './work-orders';
import { deliverableService } from './deliverables';
import { taskService } from './tasks';
import { activityService } from './activities';
import { requestService } from './requests';
import { timeEntryService } from './time-entries';
import { db } from './config';
import {
  collection,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import type {
  DealStage,
  WorkOrderStatus,
  TaskStatus,
  BlockedReason,
  ContactStage,
  ContactSource,
  CompanyStatus,
  CompanySource,
  ActivityType,
  RequestType,
  RequestPriority,
} from '@/lib/types';

// ---------------------------------------------------------------------------
// Wipe All Data
// ---------------------------------------------------------------------------

const ALL_COLLECTIONS = [
  'activities',
  'tasks',
  'deliverables',
  'time_entries',
  'proposals',
  'requests',
  'work_orders',
  'deals',
  'contacts',
  'companies',
  'catalog_items',
];

/**
 * Tüm koleksiyonlardaki verileri siler (users hariç).
 * Firestore batch limiti 500 olduğundan büyük koleksiyonları parçalı siler.
 */
export async function wipeAllData(): Promise<void> {
  console.log('🗑️ Wiping all data...');

  for (const colName of ALL_COLLECTIONS) {
    const colRef = collection(db, colName);
    const snapshot = await getDocs(colRef);

    if (snapshot.empty) {
      console.log(`  ⏭️ ${colName}: empty`);
      continue;
    }

    // Batch limiti 500
    const docs = snapshot.docs;
    for (let i = 0; i < docs.length; i += 500) {
      const batch = writeBatch(db);
      const chunk = docs.slice(i, i + 500);
      chunk.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    console.log(`  🗑️ ${colName}: ${docs.length} docs deleted`);
  }

  console.log('✅ All data wiped successfully!');
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Belirtilen tarih için Date nesnesi döndürür (yerel saat 10:00) */
function d(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day, 10, 0, 0);
}

/** Geçmiş tarih (bugünden N gün önce) */
function daysAgo(n: number): Date {
  const dt = new Date();
  dt.setDate(dt.getDate() - n);
  dt.setHours(10, 0, 0, 0);
  return dt;
}

/** Gelecek tarih (bugünden N gün sonra) */
function daysFromNow(n: number): Date {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  dt.setHours(10, 0, 0, 0);
  return dt;
}

// ---------------------------------------------------------------------------
// Seed Data
// ---------------------------------------------------------------------------

/**
 * Geniş kapsamlı seed data oluşturur — Ocak & Şubat 2026.
 * Dashboard KPI'ları, paneller ve tüm CRM/Ops ekranları için veri sağlar.
 */
export async function seedFlowData(userId: string): Promise<string> {
  console.log('🌱 Starting comprehensive seed data (Jan-Feb 2026)...');

  // =========================================================================
  // 1. ŞİRKETLER
  // =========================================================================

  const companies: {
    id: string;
    name: string;
    status: CompanyStatus;
    source: CompanySource | null;
    nextAction: string | null;
    nextActionDate: Date | null;
  }[] = [];

  const companyDefs: {
    name: string;
    status: CompanyStatus;
    source: CompanySource | null;
    tags: string[];
    nextAction: string | null;
    nextActionDate: Date | null;
  }[] = [
    {
      name: 'Vertex Yazılım A.Ş.',
      status: 'active',
      source: 'referral',
      tags: ['enterprise', 'yazılım'],
      nextAction: 'Q1 planlama toplantısı',
      nextActionDate: d(2026, 2, 10),
    },
    {
      name: 'Nova Digital Agency',
      status: 'active',
      source: 'inbound',
      tags: ['ajans', 'dijital'],
      nextAction: 'Proje ilerleme sunumu',
      nextActionDate: d(2026, 2, 14),
    },
    {
      name: 'Orion Lojistik',
      status: 'prospect',
      source: 'event',
      tags: ['lojistik', 'b2b'],
      nextAction: 'İlk demo hazırlığı',
      nextActionDate: d(2026, 2, 5),
    },
    {
      name: 'Pulse E-ticaret',
      status: 'prospect',
      source: 'outbound',
      tags: ['e-ticaret'],
      nextAction: 'Karar verici ile tanışma',
      nextActionDate: daysAgo(3), // GECİKMİŞ
    },
    {
      name: 'Atlas Enerji',
      status: 'active',
      source: 'referral',
      tags: ['enerji', 'enterprise'],
      nextAction: null,
      nextActionDate: null,
    },
    {
      name: 'Delta Medya',
      status: 'inactive',
      source: 'inbound',
      tags: ['medya'],
      nextAction: 'Reaktivasyon araması',
      nextActionDate: daysAgo(10), // GECİKMİŞ
    },
    {
      name: 'Zenith Sağlık',
      status: 'churned',
      source: 'event',
      tags: ['sağlık'],
      nextAction: null,
      nextActionDate: null,
    },
  ];

  for (const def of companyDefs) {
    const id = await companyService.add(
      {
        name: def.name,
        status: def.status,
        source: def.source,
        tags: def.tags,
        nextAction: def.nextAction,
        nextActionDate: def.nextActionDate,
        ownerId: userId,
      },
      userId
    );
    companies.push({
      id,
      name: def.name,
      status: def.status,
      source: def.source,
      nextAction: def.nextAction,
      nextActionDate: def.nextActionDate,
    });
    console.log(`✅ Company: ${def.name}`);
  }

  // =========================================================================
  // 2. KİŞİLER (Bağımsız + Şirketli, çeşitli stage/source)
  // =========================================================================

  const contacts: { id: string; name: string; companyId: string | null }[] = [];

  const contactDefs: {
    fullName: string;
    companyIndex: number | null; // null = bağımsız
    title: string | null;
    email: string;
    phone: string;
    isPrimary: boolean;
    stage: ContactStage;
    source: ContactSource | null;
    sourceDetail?: string;
    tags: string[];
    nextAction: string | null;
    nextActionDate: Date | null;
    notes: string | null;
  }[] = [
    // Vertex Yazılım kişileri
    {
      fullName: 'Mehmet Kaya',
      companyIndex: 0,
      title: 'CTO',
      email: 'mehmet@vertex.com',
      phone: '+90 555 101 0001',
      isPrimary: true,
      stage: 'client',
      source: 'referral',
      tags: ['karar-verici'],
      nextAction: 'Yeni modül demosunu göster',
      nextActionDate: d(2026, 2, 12),
      notes: 'Teknik kararları veriyor',
    },
    {
      fullName: 'Zeynep Arslan',
      companyIndex: 0,
      title: 'Proje Yöneticisi',
      email: 'zeynep@vertex.com',
      phone: '+90 555 101 0002',
      isPrimary: false,
      stage: 'client',
      source: 'referral',
      tags: [],
      nextAction: null,
      nextActionDate: null,
      notes: 'Günlük iletişim noktası',
    },
    // Nova Digital kişileri
    {
      fullName: 'Can Demir',
      companyIndex: 1,
      title: 'Genel Müdür',
      email: 'can@novadigital.com',
      phone: '+90 555 201 0001',
      isPrimary: true,
      stage: 'client',
      source: 'inbound',
      tags: ['karar-verici'],
      nextAction: 'Fatura durumu hakkında konuş',
      nextActionDate: d(2026, 2, 7), // BUGÜN
      notes: null,
    },
    {
      fullName: 'Elif Yıldız',
      companyIndex: 1,
      title: 'Kreatif Direktör',
      email: 'elif@novadigital.com',
      phone: '+90 555 201 0002',
      isPrimary: false,
      stage: 'warm',
      source: 'inbound',
      tags: [],
      nextAction: 'Tasarım sistemi önerisini gönder',
      nextActionDate: d(2026, 2, 11),
      notes: null,
    },
    // Orion Lojistik kişisi
    {
      fullName: 'Burak Şahin',
      companyIndex: 2,
      title: 'IT Direktörü',
      email: 'burak@orionloj.com',
      phone: '+90 555 301 0001',
      isPrimary: true,
      stage: 'prospect',
      source: 'event',
      sourceDetail: 'Webrazzi Summit 2026',
      tags: ['karar-verici'],
      nextAction: 'Ürün demosu ayarla',
      nextActionDate: d(2026, 2, 6), // DÜN (GECİKMİŞ)
      notes: 'Summit stand ziyaretinden tanışma',
    },
    // Pulse E-ticaret kişisi
    {
      fullName: 'Selin Koç',
      companyIndex: 3,
      title: 'CEO',
      email: 'selin@pulsecom.com',
      phone: '+90 555 401 0001',
      isPrimary: true,
      stage: 'prospect',
      source: 'outbound',
      tags: ['karar-verici'],
      nextAction: 'İkinci görüşme için randevu al',
      nextActionDate: daysAgo(2), // GECİKMİŞ
      notes: 'Cold email dönüşü',
    },
    // Atlas Enerji kişisi
    {
      fullName: 'Deniz Güneş',
      companyIndex: 4,
      title: 'Dijital Dönüşüm Müdürü',
      email: 'deniz@atlasenerji.com',
      phone: '+90 555 501 0001',
      isPrimary: true,
      stage: 'client',
      source: 'referral',
      tags: [],
      nextAction: 'Proje kapanış raporu gönder',
      nextActionDate: d(2026, 2, 20),
      notes: null,
    },
    // Bağımsız kişiler (companyId = null) — Networking
    {
      fullName: 'Alp Tekin',
      companyIndex: null,
      title: 'Serbest Danışman',
      email: 'alp@gmail.com',
      phone: '+90 555 601 0001',
      isPrimary: false,
      stage: 'networking',
      source: 'linkedin',
      tags: ['freelance', 'danışman'],
      nextAction: 'Kahve buluşması için gün belirle',
      nextActionDate: d(2026, 2, 8),
      notes: 'LinkedIn üzerinden bağlandık',
    },
    {
      fullName: 'Merve Aydın',
      companyIndex: null,
      title: 'Startup Kurucusu',
      email: 'merve@startup.co',
      phone: '+90 555 602 0001',
      isPrimary: false,
      stage: 'networking',
      source: 'event',
      sourceDetail: 'İstanbul Tech Meetup',
      tags: ['startup'],
      nextAction: 'İş birliği fırsatlarını konuş',
      nextActionDate: d(2026, 2, 15),
      notes: 'Meetup sonrası tanıştık',
    },
    {
      fullName: 'Okan Kılıç',
      companyIndex: null,
      title: null,
      email: 'okan@email.com',
      phone: '+90 555 603 0001',
      isPrimary: false,
      stage: 'new',
      source: 'other',
      tags: [],
      nextAction: 'Tanışma mesajı gönder',
      nextActionDate: d(2026, 2, 9),
      notes: 'Tavsiye yoluyla geldi',
    },
    // Son 7 günde oluşturulan kişiler (newContacts KPI)
    {
      fullName: 'Aylin Çelik',
      companyIndex: null,
      title: 'Pazarlama Müdürü',
      email: 'aylin@celik.com',
      phone: '+90 555 604 0001',
      isPrimary: false,
      stage: 'new',
      source: 'linkedin',
      tags: [],
      nextAction: 'İlk görüşme ayarla',
      nextActionDate: daysFromNow(3),
      notes: null,
    },
    {
      fullName: 'Emre Tan',
      companyIndex: null,
      title: 'CTO',
      email: 'emre@tantech.com',
      phone: '+90 555 605 0001',
      isPrimary: false,
      stage: 'new',
      source: 'event',
      sourceDetail: 'DevFest 2026',
      tags: ['tech-lead'],
      nextAction: 'Portfolio gönder',
      nextActionDate: daysFromNow(5),
      notes: null,
    },
    {
      fullName: 'Naz Bayraktar',
      companyIndex: 2,
      title: 'Satın Alma Uzmanı',
      email: 'naz@orionloj.com',
      phone: '+90 555 302 0001',
      isPrimary: false,
      stage: 'warm',
      source: 'event',
      tags: [],
      nextAction: null,
      nextActionDate: null,
      notes: 'Burak Şahin yönlendirdi',
    },
  ];

  for (const def of contactDefs) {
    const companyId = def.companyIndex !== null ? companies[def.companyIndex].id : null;
    const id = await contactService.add(
      {
        companyId,
        fullName: def.fullName,
        title: def.title,
        email: def.email,
        phone: def.phone,
        isPrimary: def.isPrimary,
        stage: def.stage,
        source: def.source,
        sourceDetail: def.sourceDetail,
        tags: def.tags,
        nextAction: def.nextAction,
        nextActionDate: def.nextActionDate,
        ownerId: userId,
        notes: def.notes,
      },
      userId
    );
    contacts.push({ id, name: def.fullName, companyId });
    console.log(`✅ Contact: ${def.fullName}`);
  }

  // =========================================================================
  // 3. DEAL'LER (Pipeline çeşitliliği)
  // =========================================================================

  const deals: { id: string; stage: DealStage; companyIndex: number; contactIndex: number }[] = [];

  const dealDefs: {
    companyIndex: number;
    contactIndex: number;
    title: string;
    stage: DealStage;
    expectedCloseDate: Date;
    budgetMinor: number;
    nextAction: string | null;
    nextActionDate: Date | null;
  }[] = [
    // LEAD
    {
      companyIndex: 2,
      contactIndex: 4, // Burak Şahin
      title: 'Orion - Depo Yönetim Sistemi',
      stage: 'lead',
      expectedCloseDate: d(2026, 4, 15),
      budgetMinor: 80000000,
      nextAction: 'İhtiyaç analizi toplantısı',
      nextActionDate: d(2026, 2, 10),
    },
    {
      companyIndex: 3,
      contactIndex: 5, // Selin Koç
      title: 'Pulse - E-ticaret Entegrasyonu',
      stage: 'lead',
      expectedCloseDate: d(2026, 5, 1),
      budgetMinor: 45000000,
      nextAction: 'Scope dokümanı hazırla',
      nextActionDate: daysAgo(1), // GECİKMİŞ
    },
    // QUALIFIED
    {
      companyIndex: 2,
      contactIndex: 4,
      title: 'Orion - Filo Takip Modülü',
      stage: 'qualified',
      expectedCloseDate: d(2026, 3, 30),
      budgetMinor: 55000000,
      nextAction: 'Teknik gereksinimler toplantısı',
      nextActionDate: d(2026, 2, 12),
    },
    // PROPOSAL-PREP
    {
      companyIndex: 0,
      contactIndex: 0, // Mehmet Kaya
      title: 'Vertex - Mobil Uygulama v2',
      stage: 'proposal-prep',
      expectedCloseDate: d(2026, 3, 15),
      budgetMinor: 120000000,
      nextAction: 'Teklif taslağını tamamla',
      nextActionDate: d(2026, 2, 8),
    },
    // PROPOSAL-SENT
    {
      companyIndex: 1,
      contactIndex: 2, // Can Demir
      title: 'Nova - Web Sitesi Yenileme',
      stage: 'proposal-sent',
      expectedCloseDate: d(2026, 3, 1),
      budgetMinor: 35000000,
      nextAction: 'Teklif takibi yap',
      nextActionDate: d(2026, 2, 7), // BUGÜN
    },
    // NEGOTIATION
    {
      companyIndex: 4,
      contactIndex: 6, // Deniz Güneş
      title: 'Atlas - IoT Dashboard',
      stage: 'negotiation',
      expectedCloseDate: d(2026, 2, 28),
      budgetMinor: 95000000,
      nextAction: 'Son fiyat teklifini gönder',
      nextActionDate: d(2026, 2, 9),
    },
    // WON
    {
      companyIndex: 0,
      contactIndex: 0,
      title: 'Vertex - ERP Entegrasyonu',
      stage: 'won',
      expectedCloseDate: d(2026, 1, 15),
      budgetMinor: 200000000,
      nextAction: null,
      nextActionDate: null,
    },
    {
      companyIndex: 1,
      contactIndex: 2,
      title: 'Nova - Sosyal Medya Aracı',
      stage: 'won',
      expectedCloseDate: d(2026, 1, 20),
      budgetMinor: 60000000,
      nextAction: null,
      nextActionDate: null,
    },
    {
      companyIndex: 4,
      contactIndex: 6,
      title: 'Atlas - Raporlama Modülü',
      stage: 'won',
      expectedCloseDate: d(2026, 1, 10),
      budgetMinor: 75000000,
      nextAction: null,
      nextActionDate: null,
    },
    // LOST
    {
      companyIndex: 3,
      contactIndex: 5,
      title: 'Pulse - CRM Kurulumu',
      stage: 'lost',
      expectedCloseDate: d(2026, 1, 25),
      budgetMinor: 30000000,
      nextAction: null,
      nextActionDate: null,
    },
  ];

  for (const def of dealDefs) {
    const id = await dealService.add(
      {
        companyId: companies[def.companyIndex].id,
        primaryContactId: contacts[def.contactIndex].id,
        title: def.title,
        stage: def.stage,
        expectedCloseDate: def.expectedCloseDate,
        estimatedBudgetMinor: def.budgetMinor,
        currency: 'TRY',
        nextAction: def.nextAction,
        nextActionDate: def.nextActionDate,
        ownerId: userId,
      },
      userId
    );
    deals.push({
      id,
      stage: def.stage,
      companyIndex: def.companyIndex,
      contactIndex: def.contactIndex,
    });
    console.log(`✅ Deal: ${def.title} (${def.stage})`);
  }

  // =========================================================================
  // 4. TEKLİFLER (proposal-prep ve sonrası deal'ler için)
  // =========================================================================

  const proposalItems = [
    {
      catalogItemId: null,
      title: 'Yazılım Geliştirme',
      description: 'Full-stack uygulama geliştirme',
      quantity: 160,
      unit: 'hour' as const,
      unitPriceMinor: 120000,
      taxRate: 20,
    },
    {
      catalogItemId: null,
      title: 'Proje Yönetimi',
      description: 'Sprint planlama ve koordinasyon',
      quantity: 40,
      unit: 'hour' as const,
      unitPriceMinor: 150000,
      taxRate: 20,
    },
  ];

  // Deal index 3 (proposal-prep) → draft
  const proposalDraft = await proposalService.add(
    { dealId: deals[3].id, version: 1, currency: 'TRY', pricesIncludeTax: false, items: proposalItems },
    userId
  );
  console.log(`✅ Proposal: draft (${proposalDraft})`);

  // Deal index 4 (proposal-sent) → sent
  const proposalSent = await proposalService.add(
    { dealId: deals[4].id, version: 1, currency: 'TRY', pricesIncludeTax: false, items: proposalItems },
    userId
  );
  await proposalService.update(proposalSent, { status: 'sent' }, userId);
  console.log(`✅ Proposal: sent (${proposalSent})`);

  // Deal index 5 (negotiation) → sent
  const proposalNeg = await proposalService.add(
    { dealId: deals[5].id, version: 1, currency: 'TRY', pricesIncludeTax: false, items: proposalItems },
    userId
  );
  await proposalService.update(proposalNeg, { status: 'sent' }, userId);
  console.log(`✅ Proposal: sent/negotiation (${proposalNeg})`);

  // Won deal'ler → accepted
  for (const wonIdx of [6, 7, 8]) {
    const pId = await proposalService.add(
      { dealId: deals[wonIdx].id, version: 1, currency: 'TRY', pricesIncludeTax: false, items: proposalItems },
      userId
    );
    await proposalService.update(pId, { status: 'accepted' }, userId);
    console.log(`✅ Proposal: accepted (${pId})`);
  }

  // Lost deal → rejected
  const proposalLost = await proposalService.add(
    { dealId: deals[9].id, version: 1, currency: 'TRY', pricesIncludeTax: false, items: proposalItems },
    userId
  );
  await proposalService.update(proposalLost, { status: 'rejected' }, userId);
  console.log(`✅ Proposal: rejected (${proposalLost})`);

  // =========================================================================
  // 5. İŞ EMİRLERİ (Won deal'ler + standalone)
  // =========================================================================

  const workOrders: { id: string; companyIndex: number; status: WorkOrderStatus }[] = [];

  const woDefs: {
    companyIndex: number;
    dealIndex: number | null;
    title: string;
    status: WorkOrderStatus;
    startDate: Date;
    targetDeliveryDate: Date;
    scope: string;
    paymentStatus: 'unplanned' | 'deposit-requested' | 'deposit-received' | 'invoiced' | 'paid';
  }[] = [
    // Vertex ERP — active, yakın teslim, deposit alındı
    {
      companyIndex: 0,
      dealIndex: 6,
      title: 'Vertex ERP Entegrasyonu',
      status: 'active',
      startDate: d(2026, 1, 20),
      targetDeliveryDate: d(2026, 2, 14), // Bu hafta teslim!
      scope: 'ERP modülleri ile API entegrasyonu',
      paymentStatus: 'deposit-received',
    },
    // Nova Sosyal Medya — active, ileri tarihli
    {
      companyIndex: 1,
      dealIndex: 7,
      title: 'Nova Sosyal Medya Aracı',
      status: 'active',
      startDate: d(2026, 1, 25),
      targetDeliveryDate: d(2026, 3, 15),
      scope: 'Sosyal medya yönetim paneli',
      paymentStatus: 'deposit-received',
    },
    // Atlas Raporlama — active, GECİKMİŞ teslim
    {
      companyIndex: 4,
      dealIndex: 8,
      title: 'Atlas Raporlama Modülü',
      status: 'active',
      startDate: d(2026, 1, 5),
      targetDeliveryDate: daysAgo(5), // GECİKMİŞ!
      scope: 'BI dashboard ve raporlama araçları',
      paymentStatus: 'invoiced',
    },
    // Standalone — on-hold
    {
      companyIndex: 0,
      dealIndex: null,
      title: 'Vertex Bakım Sözleşmesi',
      status: 'on-hold',
      startDate: d(2026, 1, 1),
      targetDeliveryDate: d(2026, 6, 30),
      scope: 'Aylık bakım ve destek',
      paymentStatus: 'unplanned',
    },
    // Completed
    {
      companyIndex: 1,
      dealIndex: null,
      title: 'Nova Landing Page',
      status: 'completed',
      startDate: d(2026, 1, 5),
      targetDeliveryDate: d(2026, 1, 25),
      scope: 'Kampanya landing page tasarım ve geliştirme',
      paymentStatus: 'paid',
    },
    // Active — bu hafta teslim
    {
      companyIndex: 4,
      dealIndex: null,
      title: 'Atlas Veri Göçü',
      status: 'active',
      startDate: d(2026, 2, 1),
      targetDeliveryDate: d(2026, 2, 12), // Bu hafta!
      scope: 'Legacy sistem verilerinin yeni platforma aktarımı',
      paymentStatus: 'deposit-requested',
    },
  ];

  for (const def of woDefs) {
    const id = await workOrderService.add(
      {
        companyId: companies[def.companyIndex].id,
        dealId: def.dealIndex !== null ? deals[def.dealIndex].id : null,
        title: def.title,
        status: def.status,
        startDate: def.startDate,
        targetDeliveryDate: def.targetDeliveryDate,
        scopeSummary: def.scope,
        paymentStatus: def.paymentStatus,
        ownerId: userId,
      },
      userId
    );
    workOrders.push({ id, companyIndex: def.companyIndex, status: def.status });
    console.log(`✅ Work Order: ${def.title} (${def.status})`);
  }

  // =========================================================================
  // 6. TESLİMATLAR & GÖREVLER
  // =========================================================================

  // Vertex ERP (WO index 0 — active, yakın teslim)
  const d1 = await deliverableService.add(
    { workOrderId: workOrders[0].id, title: 'API Entegrasyon Katmanı', status: 'in-progress', targetDate: d(2026, 2, 10) },
    userId
  );
  const d2 = await deliverableService.add(
    { workOrderId: workOrders[0].id, title: 'Veri Senkronizasyonu', status: 'blocked', targetDate: d(2026, 2, 14) },
    userId
  );
  console.log(`✅ Deliverables for Vertex ERP`);

  // Tasks for Vertex ERP deliverables
  const taskDefs: {
    woIndex: number;
    deliverableId: string | null;
    title: string;
    status: TaskStatus;
    blocked: BlockedReason | null;
    dueDate: Date;
  }[] = [
    { woIndex: 0, deliverableId: d1, title: 'REST API endpoint\'leri oluştur', status: 'done', blocked: null, dueDate: d(2026, 2, 5) },
    { woIndex: 0, deliverableId: d1, title: 'Hata yönetimi ve loglama', status: 'in-progress', blocked: null, dueDate: d(2026, 2, 9) },
    { woIndex: 0, deliverableId: d2, title: 'Veri mapping dokümanı', status: 'done', blocked: null, dueDate: d(2026, 2, 7) },
    { woIndex: 0, deliverableId: d2, title: 'Senkronizasyon servisi', status: 'blocked', blocked: 'waiting-client', dueDate: d(2026, 2, 13) },
    { woIndex: 0, deliverableId: null, title: 'Genel test planı hazırla', status: 'backlog', blocked: null, dueDate: d(2026, 2, 14) },
  ];

  // Nova Sosyal Medya (WO index 1 — active)
  const d3 = await deliverableService.add(
    { workOrderId: workOrders[1].id, title: 'UI Tasarım', status: 'delivered', targetDate: d(2026, 2, 15) },
    userId
  );
  const d4 = await deliverableService.add(
    { workOrderId: workOrders[1].id, title: 'Backend API', status: 'in-progress', targetDate: d(2026, 3, 1) },
    userId
  );
  const d5 = await deliverableService.add(
    { workOrderId: workOrders[1].id, title: 'Dashboard Modülü', status: 'not-started', targetDate: d(2026, 3, 15) },
    userId
  );
  console.log(`✅ Deliverables for Nova Sosyal Medya`);

  taskDefs.push(
    { woIndex: 1, deliverableId: d3, title: 'Wireframe hazırla', status: 'done', blocked: null, dueDate: d(2026, 2, 1) },
    { woIndex: 1, deliverableId: d3, title: 'Figma prototip', status: 'done', blocked: null, dueDate: d(2026, 2, 10) },
    { woIndex: 1, deliverableId: d4, title: 'Auth API', status: 'in-progress', blocked: null, dueDate: d(2026, 2, 20) },
    { woIndex: 1, deliverableId: d4, title: 'Post CRUD API', status: 'backlog', blocked: null, dueDate: d(2026, 2, 25) },
    { woIndex: 1, deliverableId: d5, title: 'Dashboard wireframe', status: 'backlog', blocked: null, dueDate: d(2026, 3, 5) },
  );

  // Atlas Raporlama (WO index 2 — active, overdue) + blocked deliverable
  const d6 = await deliverableService.add(
    { workOrderId: workOrders[2].id, title: 'Veri Ambarı Tasarımı', status: 'approved', targetDate: d(2026, 1, 20) },
    userId
  );
  const d7 = await deliverableService.add(
    { workOrderId: workOrders[2].id, title: 'Dashboard UI', status: 'blocked', targetDate: daysAgo(3), notes: 'Müşteri veri formatı bekleniyor' },
    userId
  );
  console.log(`✅ Deliverables for Atlas Raporlama`);

  taskDefs.push(
    { woIndex: 2, deliverableId: d6, title: 'ER diyagram oluştur', status: 'done', blocked: null, dueDate: d(2026, 1, 15) },
    { woIndex: 2, deliverableId: d6, title: 'Migration script\'leri', status: 'done', blocked: null, dueDate: d(2026, 1, 18) },
    { woIndex: 2, deliverableId: d7, title: 'Chart kütüphanesi seç', status: 'done', blocked: null, dueDate: d(2026, 1, 25) },
    { woIndex: 2, deliverableId: d7, title: 'Dashboard bileşenleri', status: 'blocked', blocked: 'waiting-client', dueDate: daysAgo(2) },
  );

  // Atlas Veri Göçü (WO index 5 — active, bu hafta)
  const d8 = await deliverableService.add(
    { workOrderId: workOrders[5].id, title: 'Veri Temizliği', status: 'in-progress', targetDate: d(2026, 2, 8) },
    userId
  );
  const d9 = await deliverableService.add(
    { workOrderId: workOrders[5].id, title: 'Göç Scriptleri', status: 'not-started', targetDate: d(2026, 2, 12) },
    userId
  );
  console.log(`✅ Deliverables for Atlas Veri Göçü`);

  taskDefs.push(
    { woIndex: 5, deliverableId: d8, title: 'Duplikat kayıtları temizle', status: 'in-progress', blocked: null, dueDate: d(2026, 2, 7) },
    { woIndex: 5, deliverableId: d8, title: 'Format dönüşümleri', status: 'backlog', blocked: null, dueDate: d(2026, 2, 9) },
    { woIndex: 5, deliverableId: d9, title: 'Migration script yaz', status: 'backlog', blocked: null, dueDate: d(2026, 2, 11) },
    { woIndex: 5, deliverableId: d9, title: 'Test ortamında çalıştır', status: 'backlog', blocked: null, dueDate: d(2026, 2, 12) },
  );

  for (const t of taskDefs) {
    await taskService.add(
      {
        workOrderId: workOrders[t.woIndex].id,
        deliverableId: t.deliverableId,
        title: t.title,
        status: t.status,
        blockedReason: t.blocked,
        assigneeId: null,
        dueDate: t.dueDate,
      },
      userId
    );
  }
  console.log(`✅ ${taskDefs.length} tasks created`);

  // =========================================================================
  // 7. AKTİVİTELER (çeşitli tipler, Ocak-Şubat 2026)
  // =========================================================================

  const activityDefs: {
    contactIndex: number | null;
    companyIndex: number | null;
    dealIndex: number | null;
    type: ActivityType;
    summary: string;
    details: string | null;
    occurredAt: Date;
    nextAction: string | null;
    nextActionDate: Date | null;
  }[] = [
    // Calls
    {
      contactIndex: 0, companyIndex: 0, dealIndex: null, type: 'call',
      summary: 'Q1 planlama görüşmesi', details: 'Yeni modül gereksinimleri konuşuldu',
      occurredAt: d(2026, 1, 15), nextAction: 'Gereksinim dokümanı gönder', nextActionDate: d(2026, 1, 20),
    },
    {
      contactIndex: 4, companyIndex: 2, dealIndex: 0, type: 'call',
      summary: 'Depo sistemi ön görüşme', details: 'İhtiyaçlar hakkında ilk bilgi alındı',
      occurredAt: d(2026, 1, 28), nextAction: 'Demo hazırla', nextActionDate: d(2026, 2, 5),
    },
    {
      contactIndex: 5, companyIndex: 3, dealIndex: 1, type: 'call',
      summary: 'E-ticaret entegrasyon görüşmesi', details: 'Mevcut altyapıları öğrenildi',
      occurredAt: d(2026, 2, 1), nextAction: 'Teknik analiz yap', nextActionDate: d(2026, 2, 8),
    },
    // Meetings
    {
      contactIndex: 2, companyIndex: 1, dealIndex: 4, type: 'meeting',
      summary: 'Web sitesi teklif sunumu', details: 'Teklif detayları anlatıldı, olumlu geri dönüş',
      occurredAt: d(2026, 1, 30), nextAction: 'Teklif takibi', nextActionDate: d(2026, 2, 7),
    },
    {
      contactIndex: 6, companyIndex: 4, dealIndex: 5, type: 'meeting',
      summary: 'IoT Dashboard müzakere toplantısı', details: 'Fiyat ve kapsam üzerine görüşüldü',
      occurredAt: d(2026, 2, 3), nextAction: 'Revize teklif gönder', nextActionDate: d(2026, 2, 9),
    },
    // Emails
    {
      contactIndex: 0, companyIndex: 0, dealIndex: 3, type: 'email',
      summary: 'Mobil uygulama v2 kapsam dokümanı gönderildi', details: null,
      occurredAt: d(2026, 2, 4), nextAction: 'Geri dönüş bekle', nextActionDate: d(2026, 2, 8),
    },
    {
      contactIndex: 3, companyIndex: 1, dealIndex: null, type: 'email',
      summary: 'Tasarım sistemi önerisi gönderildi', details: 'Design token yaklaşımı önerildi',
      occurredAt: d(2026, 2, 5), nextAction: null, nextActionDate: null,
    },
    // Notes
    {
      contactIndex: null, companyIndex: 4, dealIndex: null, type: 'note',
      summary: 'Atlas enerji sektör analizi tamamlandı', details: 'Rakip analizi ve fiyatlandırma notları eklendi',
      occurredAt: d(2026, 1, 22), nextAction: null, nextActionDate: null,
    },
    // Networking
    {
      contactIndex: 7, companyIndex: null, dealIndex: null, type: 'networking',
      summary: 'Alp Tekin ile LinkedIn bağlantısı', details: 'Ortak tanıdık üzerinden bağlandık, serbest danışman',
      occurredAt: d(2026, 1, 25), nextAction: 'Kahve buluşması ayarla', nextActionDate: d(2026, 2, 8),
    },
    {
      contactIndex: 8, companyIndex: null, dealIndex: null, type: 'networking',
      summary: 'İstanbul Tech Meetup tanışma', details: 'Startup kurucusu, AI alanında çalışıyor',
      occurredAt: d(2026, 1, 30), nextAction: 'İş birliği fırsatlarını konuş', nextActionDate: d(2026, 2, 15),
    },
    // Decision
    {
      contactIndex: 2, companyIndex: 1, dealIndex: 7, type: 'decision',
      summary: 'Nova sosyal medya projesi onaylandı', details: 'Sözleşme imzalandı, depozito istendi',
      occurredAt: d(2026, 1, 22), nextAction: null, nextActionDate: null,
    },
    // More recent activities
    {
      contactIndex: 0, companyIndex: 0, dealIndex: 6, type: 'meeting',
      summary: 'Vertex ERP sprint review', details: 'Sprint 3 tamamlandı, API katmanı bitti',
      occurredAt: d(2026, 2, 5), nextAction: 'Sprint 4 planla', nextActionDate: d(2026, 2, 10),
    },
    {
      contactIndex: 6, companyIndex: 4, dealIndex: null, type: 'call',
      summary: 'Atlas veri göçü durum kontrolü', details: 'Veri temizliği devam ediyor',
      occurredAt: d(2026, 2, 6), nextAction: 'Migration testleri başlat', nextActionDate: d(2026, 2, 11),
    },
  ];

  for (const def of activityDefs) {
    await activityService.add(
      {
        contactId: def.contactIndex !== null ? contacts[def.contactIndex].id : null,
        companyId: def.companyIndex !== null ? companies[def.companyIndex].id : null,
        dealId: def.dealIndex !== null ? deals[def.dealIndex].id : null,
        type: def.type,
        summary: def.summary,
        details: def.details,
        occurredAt: def.occurredAt,
        nextAction: def.nextAction,
        nextActionDate: def.nextActionDate,
      },
      userId
    );
  }
  console.log(`✅ ${activityDefs.length} activities created`);

  // =========================================================================
  // 8. TALEPLER (İç Talepler — çeşitli tip/öncelik/durum)
  // =========================================================================

  const requestDefs: {
    title: string;
    description: string;
    type: RequestType;
    priority: RequestPriority;
    contactIndex: number | null;
    companyIndex: number | null;
    dealIndex: number | null;
    dueDate: Date | null;
  }[] = [
    {
      title: 'Orion için teknik değerlendirme',
      description: 'Depo yönetim sistemi için mevcut altyapı analizi',
      type: 'technical-assessment',
      priority: 'urgent',
      contactIndex: 4, companyIndex: 2, dealIndex: 0,
      dueDate: d(2026, 2, 10),
    },
    {
      title: 'Pulse e-ticaret demo kurulumu',
      description: 'Shopify entegrasyon demo ortamı hazırla',
      type: 'demo-setup',
      priority: 'normal',
      contactIndex: 5, companyIndex: 3, dealIndex: 1,
      dueDate: d(2026, 2, 12),
    },
    {
      title: 'Atlas IoT maliyet tahmini',
      description: 'IoT sensör ve dashboard maliyet analizi',
      type: 'cost-estimate',
      priority: 'normal',
      contactIndex: 6, companyIndex: 4, dealIndex: 5,
      dueDate: d(2026, 2, 8),
    },
    {
      title: 'Nova kampanya tasarımı',
      description: 'Yeni sosyal medya kampanya görselleri',
      type: 'design',
      priority: 'low',
      contactIndex: 3, companyIndex: 1, dealIndex: null,
      dueDate: d(2026, 2, 20),
    },
    {
      title: 'Vertex blog içerik hazırlığı',
      description: 'Yeni ERP modülü için tanıtım blog yazısı',
      type: 'content',
      priority: 'low',
      contactIndex: null, companyIndex: 0, dealIndex: null,
      dueDate: d(2026, 2, 28),
    },
    {
      title: 'Genel sunum şablonu güncelle',
      description: 'Yeni marka kimliğine uygun teklif sunum şablonu',
      type: 'other',
      priority: 'normal',
      contactIndex: null, companyIndex: null, dealIndex: null,
      dueDate: d(2026, 2, 15),
    },
  ];

  const requestIds: string[] = [];
  for (const def of requestDefs) {
    const id = await requestService.add(
      {
        title: def.title,
        description: def.description,
        type: def.type,
        priority: def.priority,
        contactId: def.contactIndex !== null ? contacts[def.contactIndex].id : null,
        companyId: def.companyIndex !== null ? companies[def.companyIndex].id : null,
        dealId: def.dealIndex !== null ? deals[def.dealIndex].id : null,
        dueDate: def.dueDate,
      },
      userId
    );
    requestIds.push(id);
    console.log(`✅ Request: ${def.title}`);
  }

  // Bazı talepleri in-progress ve done yap (ilk 2'si open kalır)
  await requestService.updateStatus(requestIds[2], 'in-progress', userId);
  await requestService.updateStatus(requestIds[3], 'in-progress', userId);
  await requestService.updateStatus(requestIds[4], 'done', userId, 'Blog yazısı yayınlandı');
  await requestService.updateStatus(requestIds[5], 'done', userId, 'Şablon güncellendi ve paylaşıldı');
  console.log(`✅ Request statuses updated`);

  // =========================================================================
  // 9. ZAMAN GİRİŞLERİ (Timesheet kuyruğu için submitted olanlar)
  // =========================================================================

  // Hafta: 2026-W06 (Şubat 2-8)
  const timeEntryDefs: {
    woIndex: number;
    deliverableId: string | null;
    date: Date;
    durationMinutes: number;
    billable: boolean;
    note: string;
  }[] = [
    // Vertex ERP üzerinde çalışma
    { woIndex: 0, deliverableId: d1, date: d(2026, 2, 3), durationMinutes: 480, billable: true, note: 'API geliştirme' },
    { woIndex: 0, deliverableId: d1, date: d(2026, 2, 4), durationMinutes: 420, billable: true, note: 'Hata düzeltme ve test' },
    { woIndex: 0, deliverableId: d2, date: d(2026, 2, 5), durationMinutes: 360, billable: true, note: 'Veri mapping çalışması' },
    { woIndex: 0, deliverableId: null, date: d(2026, 2, 6), durationMinutes: 240, billable: false, note: 'Sprint review hazırlığı' },
    // Nova üzerinde çalışma
    { woIndex: 1, deliverableId: d4, date: d(2026, 2, 3), durationMinutes: 300, billable: true, note: 'Auth API tasarımı' },
    { woIndex: 1, deliverableId: d4, date: d(2026, 2, 4), durationMinutes: 360, billable: true, note: 'Auth API implementasyonu' },
    { woIndex: 1, deliverableId: d4, date: d(2026, 2, 5), durationMinutes: 240, billable: true, note: 'Token yönetimi' },
    // Atlas Veri Göçü
    { woIndex: 5, deliverableId: d8, date: d(2026, 2, 5), durationMinutes: 300, billable: true, note: 'Veri temizliği scripti' },
    { woIndex: 5, deliverableId: d8, date: d(2026, 2, 6), durationMinutes: 420, billable: true, note: 'Duplikat temizliği' },
    // Geçmiş hafta (W05) — approved olmamış
    { woIndex: 0, deliverableId: d1, date: d(2026, 1, 28), durationMinutes: 480, billable: true, note: 'API endpoint geliştirme' },
    { woIndex: 0, deliverableId: d1, date: d(2026, 1, 29), durationMinutes: 480, billable: true, note: 'Entegrasyon testleri' },
    { woIndex: 1, deliverableId: d3, date: d(2026, 1, 30), durationMinutes: 360, billable: true, note: 'UI review' },
  ];

  const timeEntryIds: string[] = [];
  for (const def of timeEntryDefs) {
    const id = await timeEntryService.add(
      {
        workOrderId: workOrders[def.woIndex].id,
        deliverableId: def.deliverableId,
        date: def.date,
        durationMinutes: def.durationMinutes,
        billable: def.billable,
        note: def.note,
      },
      userId
    );
    timeEntryIds.push(id);
  }
  console.log(`✅ ${timeEntryDefs.length} time entries created`);

  // submitted durumuna geçir (onay bekleyen olacaklar)
  for (const teId of timeEntryIds) {
    await timeEntryService.submit(teId, userId);
  }
  console.log(`✅ Time entries set to submitted`);

  // =========================================================================
  // ÖZET
  // =========================================================================

  console.log('🎉 Comprehensive seed data completed!');
  console.log(`📊 Summary:
  - ${companies.length} Companies (prospect, active, inactive, churned)
  - ${contacts.length} Contacts (client, prospect, networking, new, warm)
  - ${deals.length} Deals (lead→won→lost pipeline)
  - 7 Proposals (draft, sent, accepted, rejected)
  - ${workOrders.length} Work Orders (active, on-hold, completed)
  - 9 Deliverables (all statuses)
  - ${taskDefs.length} Tasks (all statuses)
  - ${activityDefs.length} Activities (call, meeting, email, note, networking, decision)
  - ${requestDefs.length} Requests (all types & priorities, open/in-progress/done)
  - ${timeEntryDefs.length} Time Entries (submitted, pending approval)

  Dashboard KPIs covered:
  ✓ Geciken Takipler — companies/contacts/deals with overdue nextActionDate
  ✓ Bugün Yapılacaklar — entities with today's nextActionDate
  ✓ Yeni Kişiler — contacts created in last 7 days
  ✓ Açık Talepler — open + in-progress requests
  ✓ Açık İş Emirleri — active + on-hold work orders
  ✓ Onay Bekleyen — submitted time entries
  ✓ Bu hafta teslim — work orders with this week delivery
  ✓ Pipeline summary — deals in each stage
  ✓ Networking panel — contacts with networking stage
  ✓ Work order risks — overdue + blocked deliverables
  `);

  return companies[0].id;
}
