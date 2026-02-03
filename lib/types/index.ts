import { Timestamp } from 'firebase/firestore';

// =============================================================================
// ENUMS - Status, Stage, Reason vb.
// =============================================================================

export const COMPANY_STATUS = ['active', 'inactive'] as const;
export type CompanyStatus = (typeof COMPANY_STATUS)[number];

export const DEAL_STAGES = [
  'lead',
  'qualified',
  'proposal-prep',
  'proposal-sent',
  'negotiation',
  'won',
  'lost',
] as const;
export type DealStage = (typeof DEAL_STAGES)[number];

export const LOST_REASONS = [
  'price',
  'timing',
  'competitor',
  'no-response',
  'cancelled',
  'other',
] as const;
export type LostReason = (typeof LOST_REASONS)[number];

export const CATALOG_ITEM_TYPES = ['service', 'product', 'license'] as const;
export type CatalogItemType = (typeof CATALOG_ITEM_TYPES)[number];

export const UNITS = ['hour', 'day', 'month', 'piece', 'project'] as const;
export type Unit = (typeof UNITS)[number];

export const CURRENCIES = ['TRY', 'USD', 'EUR'] as const;
export type Currency = (typeof CURRENCIES)[number];

export const PROPOSAL_STATUSES = ['draft', 'sent', 'accepted', 'rejected'] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export const WORK_ORDER_STATUSES = ['active', 'on-hold', 'completed', 'cancelled'] as const;
export type WorkOrderStatus = (typeof WORK_ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = [
  'unplanned',
  'deposit-requested',
  'deposit-received',
  'invoiced',
  'paid',
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const DELIVERABLE_STATUSES = [
  'not-started',
  'in-progress',
  'blocked',
  'delivered',
  'approved',
] as const;
export type DeliverableStatus = (typeof DELIVERABLE_STATUSES)[number];

export const TASK_STATUSES = ['backlog', 'in-progress', 'blocked', 'done'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const BLOCKED_REASONS = [
  'waiting-client',
  'internal-approval',
  'payment',
  'dependency',
  'other',
] as const;
export type BlockedReason = (typeof BLOCKED_REASONS)[number];

export const ACTIVITY_TYPES = [
  'call',
  'meeting',
  'email',
  'note',
  'file',
  'decision',
  'system',
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const ACTIVITY_SOURCES = ['user', 'system'] as const;
export type ActivitySource = (typeof ACTIVITY_SOURCES)[number];

export const SYSTEM_EVENTS = [
  'call_attempt',
  'chat_summary',
  'deal_stage_changed',
  'proposal_sent',
  'proposal_accepted',
  'proposal_rejected',
  'work_order_status_changed',
  'deliverable_status_changed',
] as const;
export type SystemEvent = (typeof SYSTEM_EVENTS)[number];

export const TIME_ENTRY_STATUSES = ['draft', 'submitted', 'approved', 'locked'] as const;
export type TimeEntryStatus = (typeof TIME_ENTRY_STATUSES)[number];

export const CHANGE_REQUEST_IMPACTS = ['low', 'medium', 'high'] as const;
export type ChangeRequestImpact = (typeof CHANGE_REQUEST_IMPACTS)[number];

export const CHANGE_REQUEST_STATUSES = ['draft', 'sent', 'approved', 'rejected'] as const;
export type ChangeRequestStatus = (typeof CHANGE_REQUEST_STATUSES)[number];

// =============================================================================
// BASE TYPES - Ortak alanlar
// =============================================================================

export type BaseEntity = {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string; // userId
  updatedBy: string; // userId
  isArchived: boolean;
};

export type NextActionFields = {
  nextAction: string | null;
  nextActionDate: Timestamp | null;
  ownerId: string | null;
  lastActivityAt: Timestamp | null;
};

// =============================================================================
// USER
// =============================================================================

export type User = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  pushSubscription?: PushSubscriptionJSON | null;
  createdAt: Timestamp;
};

// =============================================================================
// COMPANY (Musteri Şirketleri)
// =============================================================================

export type Company = BaseEntity &
  NextActionFields & {
    name: string;
    status: CompanyStatus;
    tags: string[];
  };

export type CompanyFormData = {
  name: string;
  status: CompanyStatus;
  tags: string[];
  nextAction?: string | null;
  nextActionDate?: Date | null;
  ownerId?: string | null;
};

// =============================================================================
// CONTACT (Kisiler)
// =============================================================================

export type Contact = Omit<BaseEntity, 'isArchived'> & {
  companyId: string;
  companyName: string; // Denormalized
  fullName: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  isPrimary: boolean;
  notes: string | null;
};

export type ContactFormData = {
  companyId: string;
  fullName: string;
  title?: string | null;
  email?: string | null;
  phone?: string | null;
  isPrimary?: boolean;
  notes?: string | null;
};

// =============================================================================
// DEAL (Satis Firsatlari / Pipeline Karti)
// =============================================================================

export type Deal = BaseEntity &
  NextActionFields & {
    companyId: string;
    companyName: string; // Denormalized
    primaryContactId: string;
    primaryContactName: string; // Denormalized
    title: string;
    stage: DealStage;
    lostReason: LostReason | null;
    expectedCloseDate: Timestamp | null;
    estimatedBudgetMinor: number | null; // Kurus/cent
    currency: Currency;
  };

export type DealFormData = {
  companyId: string;
  primaryContactId: string;
  title: string;
  stage?: DealStage;
  expectedCloseDate?: Date | null;
  estimatedBudgetMinor?: number | null;
  currency?: Currency;
  nextAction?: string | null;
  nextActionDate?: Date | null;
  ownerId?: string | null;
};

// =============================================================================
// CATALOG ITEM (Hizmet/Kalem Katalogu)
// =============================================================================

export type CatalogItem = Omit<BaseEntity, 'isArchived'> & {
  name: string;
  type: CatalogItemType;
  unit: Unit;
  defaultUnitPriceMinor: number; // Kurus/cent
  currency: Currency;
  taxRate: number; // Yuzde (ornegin 20 = %20)
  isActive: boolean;
  description: string | null;
};

export type CatalogItemFormData = {
  name: string;
  type: CatalogItemType;
  unit: Unit;
  defaultUnitPriceMinor: number;
  currency: Currency;
  taxRate: number;
  isActive?: boolean;
  description?: string | null;
};

// =============================================================================
// PROPOSAL (Teklifler)
// =============================================================================

export type ProposalItem = {
  catalogItemId: string | null;
  title: string;
  description: string | null;
  quantity: number;
  unit: Unit;
  unitPriceMinor: number; // Kurus/cent
  taxRate: number;
};

export type Proposal = BaseEntity & {
  dealId: string;
  dealTitle: string; // Denormalized
  companyId: string;
  companyName: string; // Denormalized
  version: number;
  status: ProposalStatus;
  currency: Currency;
  pricesIncludeTax: boolean;
  items: ProposalItem[];
  subtotalMinor: number;
  taxTotalMinor: number;
  grandTotalMinor: number;
  sentAt: Timestamp | null;
  acceptedAt: Timestamp | null;
  acceptedByName: string | null;
  acceptanceNote: string | null;
};

export type ProposalFormDataItem = {
  catalogItemId?: string | null;
  title: string;
  description?: string | null;
  quantity: number;
  unit: Unit;
  unitPriceMinor: number;
  taxRate: number;
};

export type ProposalFormData = {
  dealId: string;
  version?: number;
  currency?: Currency;
  pricesIncludeTax?: boolean;
  items: ProposalFormDataItem[];
};

// =============================================================================
// WORK ORDER (Is Emirleri)
// =============================================================================

export type WorkOrder = BaseEntity &
  Omit<NextActionFields, 'nextAction' | 'nextActionDate'> & {
    companyId: string;
    companyName: string; // Denormalized
    dealId: string | null;
    dealTitle: string | null; // Denormalized
    proposalId: string | null;
    title: string;
    status: WorkOrderStatus;
    startDate: Timestamp | null;
    targetDeliveryDate: Timestamp; // Zorunlu
    scopeSummary: string | null;
    paymentStatus: PaymentStatus;
  };

export type WorkOrderFormData = {
  companyId: string;
  dealId?: string | null;
  proposalId?: string | null;
  title: string;
  status?: WorkOrderStatus;
  startDate?: Date | null;
  targetDeliveryDate: Date;
  scopeSummary?: string | null;
  paymentStatus?: PaymentStatus;
  ownerId?: string | null;
};

// =============================================================================
// DELIVERABLE (Teslimatlar)
// =============================================================================

export type Deliverable = Omit<BaseEntity, 'isArchived'> & {
  workOrderId: string;
  workOrderTitle: string; // Denormalized
  title: string;
  status: DeliverableStatus;
  targetDate: Timestamp | null;
  notes: string | null;
};

export type DeliverableFormData = {
  workOrderId: string;
  title: string;
  status?: DeliverableStatus;
  targetDate?: Date | null;
  notes?: string | null;
};

// =============================================================================
// TASK (Gorevler)
// =============================================================================

export type Task = Omit<BaseEntity, 'isArchived'> & {
  workOrderId: string;
  workOrderTitle: string; // Denormalized
  deliverableId: string | null;
  deliverableTitle: string | null; // Denormalized
  title: string;
  status: TaskStatus;
  blockedReason: BlockedReason | null;
  assigneeId: string | null;
  assigneeName: string | null; // Denormalized
  dueDate: Timestamp | null;
};

export type TaskFormData = {
  workOrderId: string;
  deliverableId?: string | null;
  title: string;
  status?: TaskStatus;
  blockedReason?: BlockedReason | null;
  assigneeId?: string | null;
  dueDate?: Date | null;
};

// =============================================================================
// ACTIVITY (Iletisim ve Not Akisi)
// =============================================================================

export type Activity = Omit<BaseEntity, 'isArchived' | 'updatedAt' | 'updatedBy'> & {
  companyId: string | null;
  companyName: string | null; // Denormalized
  dealId: string | null;
  dealTitle: string | null; // Denormalized
  workOrderId: string | null;
  workOrderTitle: string | null; // Denormalized
  type: ActivityType;
  source: ActivitySource;
  systemEvent: SystemEvent | null;
  summary: string;
  details: string | null;
  nextAction: string | null;
  nextActionDate: Timestamp | null;
  occurredAt: Timestamp;
};

export type ActivityFormData = {
  companyId?: string | null;
  dealId?: string | null;
  workOrderId?: string | null;
  type: ActivityType;
  summary: string;
  details?: string | null;
  nextAction?: string | null;
  nextActionDate?: Date | null;
  occurredAt?: Date;
};

// =============================================================================
// TIME ENTRY (Zaman Girisleri)
// =============================================================================

export type TimeEntry = Omit<BaseEntity, 'isArchived'> & {
  userId: string;
  userName: string; // Denormalized
  workOrderId: string | null;
  workOrderTitle: string | null; // Denormalized
  deliverableId: string | null;
  deliverableTitle: string | null; // Denormalized
  taskId: string | null;
  taskTitle: string | null; // Denormalized
  date: Timestamp;
  durationMinutes: number;
  billable: boolean;
  note: string | null;
  weekKey: string; // Ornegin: "2026-W05"
  status: TimeEntryStatus;
};

export type TimeEntryFormData = {
  workOrderId?: string | null;
  deliverableId?: string | null;
  taskId?: string | null;
  date: Date;
  durationMinutes: number;
  billable?: boolean;
  note?: string | null;
};

// =============================================================================
// CHANGE REQUEST (Kapsam Degisiklikleri - Opsiyonel)
// =============================================================================

export type ChangeRequest = BaseEntity & {
  workOrderId: string;
  workOrderTitle: string; // Denormalized
  title: string;
  description: string | null;
  impact: ChangeRequestImpact;
  status: ChangeRequestStatus;
  approvedAt: Timestamp | null;
  approvedByName: string | null;
};

export type ChangeRequestFormData = {
  workOrderId: string;
  title: string;
  description?: string | null;
  impact?: ChangeRequestImpact;
};

// =============================================================================
// DASHBOARD TYPES
// =============================================================================

export type DashboardKPIs = {
  overdueNextActions: number;
  todayNextActions: number;
  openWorkOrders: number;
  pendingTimesheets: number;
};

export type FollowUpItem = {
  type: 'company' | 'deal';
  id: string;
  title: string;
  nextAction: string | null;
  nextActionDate: Timestamp | null;
  ownerId: string | null;
  ownerName: string | null;
  lastActivityAt: Timestamp | null;
  isOverdue: boolean;
};

export type PipelineStageSummary = {
  stage: DealStage;
  count: number;
  sumEstimatedBudgetMinor: number;
};

export type WorkOrderRiskItem = {
  workOrderId: string;
  title: string;
  companyName: string;
  targetDeliveryDate: Timestamp;
  status: WorkOrderStatus;
  blockedDeliverables: number;
  paymentStatus: PaymentStatus;
  isOverdue: boolean;
  isDueSoon: boolean; // 7 gün içinde
};

export type TimesheetQueueItem = {
  userId: string;
  userName: string;
  weekKey: string;
  submittedMinutes: number;
  entryCount: number;
};

// =============================================================================
// UI HELPER TYPES
// =============================================================================

export type SelectOption<T = string> = {
  value: T;
  label: string;
};

export type StatusConfig = {
  label: string;
  color: string;
  bgColor: string;
};
