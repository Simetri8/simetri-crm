import { z } from 'zod';
import {
  COMPANY_STATUS,
  CONTACT_STAGES,
  DEAL_STAGES,
  DELIVERABLE_STATUSES,
  TASK_STATUSES,
  WORK_ORDER_STATUSES,
} from '@/lib/types';

export const paginationSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
});

export const listCompaniesInputSchema = paginationSchema.extend({
  status: z.enum(COMPANY_STATUS).optional(),
  isArchived: z.boolean().optional(),
});

export const listDealsInputSchema = paginationSchema.extend({
  stage: z.enum(DEAL_STAGES).optional(),
  isArchived: z.boolean().optional(),
});

export const listContactsInputSchema = paginationSchema.extend({
  stage: z.enum(CONTACT_STAGES).optional(),
  ownerId: z.string().min(1).optional(),
  companyId: z.string().min(1).optional(),
});

export const listWorkOrdersInputSchema = paginationSchema.extend({
  status: z.enum(WORK_ORDER_STATUSES).optional(),
  companyId: z.string().min(1).optional(),
  dealId: z.string().min(1).optional(),
});

export const listDeliverablesInputSchema = paginationSchema.extend({
  workOrderId: z.string().min(1),
  status: z.enum(DELIVERABLE_STATUSES).optional(),
});

export const listTasksInputSchema = paginationSchema.extend({
  workOrderId: z.string().min(1).optional(),
  deliverableId: z.string().min(1).optional(),
  status: z.enum(TASK_STATUSES).optional(),
  assigneeId: z.string().min(1).optional(),
});

export const nextActionInputSchema = z.object({
  nextAction: z.string().trim().nullable(),
  nextActionDate: z.string().datetime().nullable(),
  userId: z.string().min(1).optional(),
});

export const searchEntitiesInputSchema = z.object({
  query: z.string().trim().min(1),
  types: z
    .array(z.enum(['contacts', 'companies', 'deals']))
    .min(1)
    .default(['contacts', 'companies', 'deals']),
  limit: z.number().int().min(1).max(100).default(20),
});

export const contactSummarySchema = z.object({
  id: z.string(),
  fullName: z.string(),
  companyId: z.string().nullable(),
  companyName: z.string().nullable(),
  stage: z.string().nullable(),
  ownerId: z.string().nullable(),
  nextAction: z.string().nullable(),
  nextActionDate: z.string().nullable(),
  updatedAt: z.string().nullable(),
});

export const companySummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string().nullable(),
  ownerId: z.string().nullable(),
  nextAction: z.string().nullable(),
  nextActionDate: z.string().nullable(),
  updatedAt: z.string().nullable(),
  isArchived: z.boolean().nullable(),
});

export const dealSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  stage: z.string().nullable(),
  companyId: z.string().nullable(),
  companyName: z.string().nullable(),
  ownerId: z.string().nullable(),
  nextAction: z.string().nullable(),
  nextActionDate: z.string().nullable(),
  updatedAt: z.string().nullable(),
  isArchived: z.boolean().nullable(),
});

export const workOrderSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.string().nullable(),
  companyId: z.string().nullable(),
  companyName: z.string().nullable(),
  dealId: z.string().nullable(),
  dealTitle: z.string().nullable(),
  ownerId: z.string().nullable(),
  targetDeliveryDate: z.string().nullable(),
  updatedAt: z.string().nullable(),
});

export const deliverableSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.string().nullable(),
  workOrderId: z.string().nullable(),
  ownerId: z.string().nullable(),
  updatedAt: z.string().nullable(),
});

export const taskSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.string().nullable(),
  workOrderId: z.string().nullable(),
  deliverableId: z.string().nullable(),
  assigneeId: z.string().nullable(),
  updatedAt: z.string().nullable(),
});

export const activitySummarySchema = z.object({
  id: z.string(),
  type: z.string().nullable(),
  subject: z.string().nullable(),
  details: z.string().nullable(),
  contactId: z.string().nullable(),
  companyId: z.string().nullable(),
  dealId: z.string().nullable(),
  createdAt: z.string().nullable(),
});

export const dashboardSnapshotSchema = z.object({
  companies: z.object({
    total: z.number().int().nonnegative(),
    active: z.number().int().nonnegative(),
    archived: z.number().int().nonnegative(),
  }),
  deals: z.object({
    total: z.number().int().nonnegative(),
    open: z.number().int().nonnegative(),
    won: z.number().int().nonnegative(),
    lost: z.number().int().nonnegative(),
  }),
});

type TimestampLike = { toDate: () => Date };

function isTimestampLike(value: unknown): value is TimestampLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  );
}

export function toIsoOrNull(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  if (isTimestampLike(value)) return value.toDate().toISOString();
  return null;
}

export function toDateOrNull(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

