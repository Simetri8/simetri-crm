import type {
  CompanyStatus,
  CompanySource,
  ContactStage,
  ContactSource,
  DealStage,
  LostReason,
  ProposalStatus,
  WorkOrderStatus,
  PaymentStatus,
  DeliverableStatus,
  TaskStatus,
  BlockedReason,
  ActivityType,
  TimeEntryStatus,
  ChangeRequestImpact,
  ChangeRequestStatus,
  CatalogItemType,
  Unit,
  Currency,
  RequestType,
  RequestPriority,
  RequestStatus,
  StatusConfig,
} from '@/lib/types';

// =============================================================================
// COMPANY STATUS
// =============================================================================

export const COMPANY_STATUS_CONFIG: Record<CompanyStatus, StatusConfig> = {
  prospect: { label: 'Aday', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  active: { label: 'Aktif', color: 'text-green-700', bgColor: 'bg-green-100' },
  inactive: { label: 'Pasif', color: 'text-gray-500', bgColor: 'bg-gray-100' },
  churned: { label: 'Kaybedildi', color: 'text-red-700', bgColor: 'bg-red-100' },
};

export const COMPANY_SOURCE_LABELS: Record<CompanySource, string> = {
  event: 'Etkinlik',
  referral: 'Referans',
  inbound: 'Gelen',
  outbound: 'Giden',
  other: 'Diğer',
};

// =============================================================================
// CONTACT STAGE & SOURCE
// =============================================================================

export const CONTACT_STAGE_CONFIG: Record<ContactStage, StatusConfig> = {
  new: { label: 'Yeni', color: 'text-slate-700', bgColor: 'bg-slate-100' },
  networking: { label: 'Networking', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  warm: { label: 'Sıcak', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  prospect: { label: 'Aday', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  client: { label: 'Müşteri', color: 'text-green-700', bgColor: 'bg-green-100' },
  inactive: { label: 'Pasif', color: 'text-gray-500', bgColor: 'bg-gray-100' },
};

export const CONTACT_SOURCE_LABELS: Record<ContactSource, string> = {
  event: 'Etkinlik',
  referral: 'Referans',
  inbound: 'Gelen',
  outbound: 'Giden',
  linkedin: 'LinkedIn',
  other: 'Diğer',
};

// =============================================================================
// DEAL STAGE
// =============================================================================

export const DEAL_STAGE_CONFIG: Record<DealStage, StatusConfig> = {
  lead: { label: 'Lead', color: 'text-slate-700', bgColor: 'bg-slate-100' },
  qualified: { label: 'Nitelikli', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  'proposal-prep': { label: 'Teklif Hazırlık', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  'proposal-sent': { label: 'Teklif Gönderildi', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  negotiation: { label: 'Müzakere', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  won: { label: 'Kazanıldı', color: 'text-green-700', bgColor: 'bg-green-100' },
  lost: { label: 'Kaybedildi', color: 'text-red-700', bgColor: 'bg-red-100' },
};

export const DEAL_STAGE_ORDER: DealStage[] = [
  'lead',
  'qualified',
  'proposal-prep',
  'proposal-sent',
  'negotiation',
  'won',
  'lost',
];

// =============================================================================
// LOST REASON
// =============================================================================

export const LOST_REASON_LABELS: Record<LostReason, string> = {
  price: 'Fiyat',
  timing: 'Zamanlama',
  competitor: 'Rakip',
  'no-response': 'Dönüş Yok',
  cancelled: 'İptal Edildi',
  other: 'Diğer',
};

// =============================================================================
// PROPOSAL STATUS
// =============================================================================

export const PROPOSAL_STATUS_CONFIG: Record<ProposalStatus, StatusConfig> = {
  draft: { label: 'Taslak', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  sent: { label: 'Gönderildi', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  accepted: { label: 'Kabul Edildi', color: 'text-green-700', bgColor: 'bg-green-100' },
  rejected: { label: 'Reddedildi', color: 'text-red-700', bgColor: 'bg-red-100' },
};

// =============================================================================
// WORK ORDER STATUS
// =============================================================================

export const WORK_ORDER_STATUS_CONFIG: Record<WorkOrderStatus, StatusConfig> = {
  active: { label: 'Aktif', color: 'text-green-700', bgColor: 'bg-green-100' },
  'on-hold': { label: 'Beklemede', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  completed: { label: 'Tamamlandı', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  cancelled: { label: 'İptal', color: 'text-red-700', bgColor: 'bg-red-100' },
};

// =============================================================================
// PAYMENT STATUS
// =============================================================================

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, StatusConfig> = {
  unplanned: { label: 'Planlanmadı', color: 'text-gray-500', bgColor: 'bg-gray-100' },
  'deposit-requested': { label: 'Ön Ödeme İstendi', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  'deposit-received': { label: 'Ön Ödeme Alındı', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  invoiced: { label: 'Faturalandı', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  paid: { label: 'Ödendi', color: 'text-green-700', bgColor: 'bg-green-100' },
};

// =============================================================================
// DELIVERABLE STATUS
// =============================================================================

export const DELIVERABLE_STATUS_CONFIG: Record<DeliverableStatus, StatusConfig> = {
  'not-started': { label: 'Başlamadı', color: 'text-gray-500', bgColor: 'bg-gray-100' },
  'in-progress': { label: 'Devam Ediyor', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  blocked: { label: 'Engellendi', color: 'text-red-700', bgColor: 'bg-red-100' },
  delivered: { label: 'Teslim Edildi', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  approved: { label: 'Onaylandı', color: 'text-green-700', bgColor: 'bg-green-100' },
};

// =============================================================================
// TASK STATUS
// =============================================================================

export const TASK_STATUS_CONFIG: Record<TaskStatus, StatusConfig> = {
  backlog: { label: 'Beklemede', color: 'text-gray-500', bgColor: 'bg-gray-100' },
  'in-progress': { label: 'Devam Ediyor', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  blocked: { label: 'Engellendi', color: 'text-red-700', bgColor: 'bg-red-100' },
  done: { label: 'Tamamlandı', color: 'text-green-700', bgColor: 'bg-green-100' },
};

// =============================================================================
// BLOCKED REASON
// =============================================================================

export const BLOCKED_REASON_LABELS: Record<BlockedReason, string> = {
  'waiting-client': 'Müşteri Bekleniyor',
  'internal-approval': 'İç Onay Bekleniyor',
  payment: 'Ödeme Bekleniyor',
  dependency: 'Bağımlılık',
  other: 'Diğer',
};

// =============================================================================
// ACTIVITY TYPE
// =============================================================================

export const ACTIVITY_TYPE_CONFIG: Record<ActivityType, StatusConfig & { icon?: string }> = {
  call: { label: 'Arama', color: 'text-green-700', bgColor: 'bg-green-100' },
  meeting: { label: 'Toplantı', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  email: { label: 'E-posta', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  note: { label: 'Not', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  file: { label: 'Dosya', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  decision: { label: 'Karar', color: 'text-rose-700', bgColor: 'bg-rose-100' },
  networking: { label: 'Networking', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
  system: { label: 'Sistem', color: 'text-gray-500', bgColor: 'bg-gray-100' },
};

// =============================================================================
// TIME ENTRY STATUS
// =============================================================================

export const TIME_ENTRY_STATUS_CONFIG: Record<TimeEntryStatus, StatusConfig> = {
  draft: { label: 'Taslak', color: 'text-gray-500', bgColor: 'bg-gray-100' },
  submitted: { label: 'Gönderildi', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  approved: { label: 'Onaylandı', color: 'text-green-700', bgColor: 'bg-green-100' },
  locked: { label: 'Kilitli', color: 'text-purple-700', bgColor: 'bg-purple-100' },
};

// =============================================================================
// CHANGE REQUEST IMPACT
// =============================================================================

export const CHANGE_REQUEST_IMPACT_CONFIG: Record<ChangeRequestImpact, StatusConfig> = {
  low: { label: 'Düşük', color: 'text-green-700', bgColor: 'bg-green-100' },
  medium: { label: 'Orta', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  high: { label: 'Yüksek', color: 'text-red-700', bgColor: 'bg-red-100' },
};

// =============================================================================
// CHANGE REQUEST STATUS
// =============================================================================

export const CHANGE_REQUEST_STATUS_CONFIG: Record<ChangeRequestStatus, StatusConfig> = {
  draft: { label: 'Taslak', color: 'text-gray-500', bgColor: 'bg-gray-100' },
  sent: { label: 'Gönderildi', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  approved: { label: 'Onaylandı', color: 'text-green-700', bgColor: 'bg-green-100' },
  rejected: { label: 'Reddedildi', color: 'text-red-700', bgColor: 'bg-red-100' },
};

// =============================================================================
// CATALOG ITEM TYPE
// =============================================================================

export const CATALOG_ITEM_TYPE_LABELS: Record<CatalogItemType, string> = {
  service: 'Hizmet',
  product: 'Ürün',
  license: 'Lisans',
};

// =============================================================================
// UNIT
// =============================================================================

export const UNIT_LABELS: Record<Unit, string> = {
  hour: 'Saat',
  day: 'Gün',
  month: 'Ay',
  piece: 'Adet',
  project: 'Proje',
};

// =============================================================================
// CURRENCY
// =============================================================================

export const CURRENCY_CONFIG: Record<Currency, { label: string; symbol: string }> = {
  TRY: { label: 'Türk Lirası', symbol: '₺' },
  USD: { label: 'ABD Doları', symbol: '$' },
  EUR: { label: 'Euro', symbol: '€' },
};

// =============================================================================
// REQUEST TYPE, PRIORITY & STATUS
// =============================================================================

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  'technical-assessment': 'Teknik Değerlendirme',
  'demo-setup': 'Demo Kurulum',
  'cost-estimate': 'Maliyet Tahmini',
  design: 'Tasarım',
  content: 'İçerik',
  other: 'Diğer',
};

export const REQUEST_PRIORITY_CONFIG: Record<RequestPriority, StatusConfig> = {
  low: { label: 'Düşük', color: 'text-gray-500', bgColor: 'bg-gray-100' },
  normal: { label: 'Normal', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  urgent: { label: 'Acil', color: 'text-red-700', bgColor: 'bg-red-100' },
};

export const REQUEST_STATUS_CONFIG: Record<RequestStatus, StatusConfig> = {
  open: { label: 'Açık', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  'in-progress': { label: 'Devam Ediyor', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  done: { label: 'Tamamlandı', color: 'text-green-700', bgColor: 'bg-green-100' },
  cancelled: { label: 'İptal', color: 'text-red-700', bgColor: 'bg-red-100' },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Para tutarini minor unit'ten (kurus/cent) major unit'e cevirir
 */
export function formatMoney(amountMinor: number, currency: Currency): string {
  const { symbol } = CURRENCY_CONFIG[currency];
  const amount = amountMinor / 100;
  return `${symbol}${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
}

/**
 * Para tutarini major unit'ten minor unit'e cevirir
 */
export function toMinorUnit(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Para tutarini minor unit'ten major unit'e cevirir
 */
export function toMajorUnit(amountMinor: number): number {
  return amountMinor / 100;
}

/**
 * Dakikayi saat:dakika formatina cevirir
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}s ${mins}dk`;
}

/**
 * Dakikayi ondalikli saat formatina cevirir (ornegin: 2.5 saat)
 */
export function formatDurationDecimal(minutes: number): string {
  const hours = minutes / 60;
  return `${hours.toFixed(1)} saat`;
}

/**
 * Hafta anahtari olusturur (ISO week number)
 */
export function getWeekKey(date: Date): string {
  const year = date.getFullYear();
  const oneJan = new Date(year, 0, 1);
  const days = Math.floor((date.getTime() - oneJan.getTime()) / 86400000);
  const weekNumber = Math.ceil((days + oneJan.getDay() + 1) / 7);
  return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}
