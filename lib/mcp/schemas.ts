import { z } from 'zod';
import { COMPANY_STATUS, DEAL_STAGES } from '@/lib/types';

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

