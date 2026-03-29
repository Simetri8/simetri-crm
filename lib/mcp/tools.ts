import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import webpush from 'web-push';
import { adminDb } from '@/lib/firebase/admin';
import {
  normalizeUserPushSubscriptions,
  shouldRemoveSubscriptionOnError,
  type StoredPushSubscription,
} from '@/lib/push/subscriptions';
import {
  CONTACT_STAGES,
  DEAL_STAGES,
  DELIVERABLE_STATUSES,
  TASK_STATUSES,
  WORK_ORDER_STATUSES,
} from '@/lib/types';
import {
  activitySummarySchema,
  companySummarySchema,
  contactSummarySchema,
  dashboardSnapshotSchema,
  dealSummarySchema,
  deliverableSummarySchema,
  listCompaniesInputSchema,
  listContactsInputSchema,
  listDealsInputSchema,
  listDeliverablesInputSchema,
  listTasksInputSchema,
  listWorkOrdersInputSchema,
  nextActionInputSchema,
  searchEntitiesInputSchema,
  taskSummarySchema,
  toDateOrNull,
  toIsoOrNull,
  workOrderSummarySchema,
} from '@/lib/mcp/schemas';

type AuditContext = {
  sessionId: string | undefined;
  keyFingerprint: string;
  clientIp: string | null;
};

function logAudit(event: Record<string, unknown>) {
  console.info(
    JSON.stringify({
      source: 'mcp',
      at: new Date().toISOString(),
      ...event,
    })
  );
}

function asText(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function resultWithStructuredContent<T>(data: T) {
  return {
    content: [{ type: 'text' as const, text: asText(data) }],
    structuredContent: data,
  };
}

async function withAudit<T>(
  context: AuditContext,
  toolName: string,
  fn: () => Promise<T>
): Promise<T> {
  const startedAt = Date.now();
  try {
    const result = await fn();
    logAudit({
      level: 'info',
      event: 'tool_call',
      toolName,
      status: 'ok',
      durationMs: Date.now() - startedAt,
      sessionId: context.sessionId ?? null,
      keyFingerprint: context.keyFingerprint,
      clientIp: context.clientIp,
    });
    return result;
  } catch (error) {
    logAudit({
      level: 'error',
      event: 'tool_call',
      toolName,
      status: 'error',
      durationMs: Date.now() - startedAt,
      sessionId: context.sessionId ?? null,
      keyFingerprint: context.keyFingerprint,
      clientIp: context.clientIp,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

function pickString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function pickBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function ensureString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function normalizeNullableString(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function parseDate(value: string | null | undefined): Date | null {
  return toDateOrNull(value);
}

function ensureWebPushConfigured(): { ok: true } | { ok: false; error: string } {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    return {
      ok: false,
      error: 'VAPID anahtarlari eksik. NEXT_PUBLIC_VAPID_PUBLIC_KEY ve VAPID_PRIVATE_KEY gerekli.',
    };
  }

  webpush.setVapidDetails('mailto:bilgi@simetri.app', publicKey, privateKey);
  return { ok: true };
}

function actor(userId?: string): string {
  return userId?.trim() || 'mcp-agent';
}

function mapContactSummary(id: string, data: Record<string, unknown>) {
  return {
    id,
    fullName: ensureString(data.fullName),
    companyId: pickString(data.companyId),
    companyName: pickString(data.companyName),
    stage: pickString(data.stage),
    ownerId: pickString(data.ownerId),
    nextAction: pickString(data.nextAction),
    nextActionDate: toIsoOrNull(data.nextActionDate),
    updatedAt: toIsoOrNull(data.updatedAt),
  };
}

function mapCompanySummary(id: string, data: Record<string, unknown>) {
  return {
    id,
    name: ensureString(data.name),
    status: pickString(data.status),
    ownerId: pickString(data.ownerId),
    nextAction: pickString(data.nextAction),
    nextActionDate: toIsoOrNull(data.nextActionDate),
    updatedAt: toIsoOrNull(data.updatedAt),
    isArchived: pickBoolean(data.isArchived),
  };
}

function mapDealSummary(id: string, data: Record<string, unknown>) {
  return {
    id,
    title: ensureString(data.title),
    stage: pickString(data.stage),
    companyId: pickString(data.companyId),
    companyName: pickString(data.companyName),
    ownerId: pickString(data.ownerId),
    nextAction: pickString(data.nextAction),
    nextActionDate: toIsoOrNull(data.nextActionDate),
    updatedAt: toIsoOrNull(data.updatedAt),
    isArchived: pickBoolean(data.isArchived),
  };
}

function mapWorkOrderSummary(id: string, data: Record<string, unknown>) {
  return {
    id,
    title: ensureString(data.title),
    status: pickString(data.status),
    companyId: pickString(data.companyId),
    companyName: pickString(data.companyName),
    dealId: pickString(data.dealId),
    dealTitle: pickString(data.dealTitle),
    ownerId: pickString(data.ownerId),
    targetDeliveryDate: toIsoOrNull(data.targetDeliveryDate),
    updatedAt: toIsoOrNull(data.updatedAt),
  };
}

function mapDeliverableSummary(id: string, data: Record<string, unknown>) {
  return {
    id,
    title: ensureString(data.title),
    status: pickString(data.status),
    workOrderId: pickString(data.workOrderId),
    ownerId: pickString(data.ownerId),
    updatedAt: toIsoOrNull(data.updatedAt),
  };
}

function mapTaskSummary(id: string, data: Record<string, unknown>) {
  return {
    id,
    title: ensureString(data.title),
    status: pickString(data.status),
    workOrderId: pickString(data.workOrderId),
    deliverableId: pickString(data.deliverableId),
    assigneeId: pickString(data.assigneeId),
    updatedAt: toIsoOrNull(data.updatedAt),
  };
}

function mapActivitySummary(id: string, data: Record<string, unknown>) {
  return {
    id,
    type: pickString(data.type),
    subject: pickString(data.subject),
    details: pickString(data.details),
    contactId: pickString(data.contactId),
    companyId: pickString(data.companyId),
    dealId: pickString(data.dealId),
    createdAt: toIsoOrNull(data.createdAt),
  };
}

export function createMcpServer(context: AuditContext) {
  const server = new McpServer(
    { name: 'simetri-crm-mcp', version: '1.1.0' },
    { capabilities: { logging: {} } }
  );

  const mutationResultSchema = z.object({
    success: z.boolean(),
    id: z.string().optional(),
    message: z.string().optional(),
  });

  const contactCreateSchema = z.object({
    fullName: z.string().trim().min(1),
    email: z.string().trim().email().optional(),
    phone: z.string().trim().optional(),
    stage: z.enum(CONTACT_STAGES).optional(),
    source: z.string().trim().optional(),
    sourceDetail: z.string().trim().optional(),
    ownerId: z.string().trim().optional(),
    companyId: z.string().trim().nullable().optional(),
    companyName: z.string().trim().nullable().optional(),
    nextAction: z.string().trim().nullable().optional(),
    nextActionDate: z.string().datetime().nullable().optional(),
    userId: z.string().trim().optional(),
  });

  const companyCreateSchema = z.object({
    name: z.string().trim().min(1),
    status: z.enum(['prospect', 'active', 'inactive', 'churned']).optional(),
    website: z.string().trim().optional(),
    address: z.string().trim().optional(),
    source: z.string().trim().optional(),
    sourceDetail: z.string().trim().optional(),
    ownerId: z.string().trim().optional(),
    nextAction: z.string().trim().nullable().optional(),
    nextActionDate: z.string().datetime().nullable().optional(),
    userId: z.string().trim().optional(),
  });

  const dealCreateSchema = z.object({
    title: z.string().trim().min(1),
    stage: z.enum(DEAL_STAGES).optional(),
    companyId: z.string().trim().nullable().optional(),
    companyName: z.string().trim().nullable().optional(),
    primaryContactId: z.string().trim().nullable().optional(),
    primaryContactName: z.string().trim().nullable().optional(),
    estimatedBudgetMinor: z.number().int().nullable().optional(),
    currency: z.string().trim().optional(),
    ownerId: z.string().trim().optional(),
    nextAction: z.string().trim().nullable().optional(),
    nextActionDate: z.string().datetime().nullable().optional(),
    userId: z.string().trim().optional(),
  });

  const workOrderCreateSchema = z.object({
    title: z.string().trim().min(1),
    companyId: z.string().trim().nullable().optional(),
    companyName: z.string().trim().nullable().optional(),
    dealId: z.string().trim().nullable().optional(),
    dealTitle: z.string().trim().nullable().optional(),
    status: z.enum(WORK_ORDER_STATUSES).optional(),
    ownerId: z.string().trim().optional(),
    targetDeliveryDate: z.string().datetime().nullable().optional(),
    userId: z.string().trim().optional(),
  });

  const deliverableCreateSchema = z.object({
    title: z.string().trim().min(1),
    workOrderId: z.string().trim().min(1),
    status: z.enum(DELIVERABLE_STATUSES).optional(),
    ownerId: z.string().trim().optional(),
    dueDate: z.string().datetime().nullable().optional(),
    userId: z.string().trim().optional(),
  });

  const taskCreateSchema = z.object({
    title: z.string().trim().min(1),
    workOrderId: z.string().trim().nullable().optional(),
    deliverableId: z.string().trim().nullable().optional(),
    status: z.enum(TASK_STATUSES).optional(),
    assigneeId: z.string().trim().nullable().optional(),
    dueDate: z.string().datetime().nullable().optional(),
    userId: z.string().trim().optional(),
  });

  const simpleUpdateSchema = z.object({
    id: z.string().trim().min(1),
    data: z.record(z.string(), z.unknown()),
    userId: z.string().trim().optional(),
  });

  const tools: string[] = [];
  const register = (
    name: string,
    config: Record<string, unknown>,
    handler: (args: unknown) => Promise<unknown> | unknown
  ) => {
    tools.push(name);
    server.registerTool(name, config as never, handler as never);
  };

  register(
    'health_check',
    {
      title: 'Health Check',
      description: 'MCP servis durumunu ve zamanı döndürür',
      inputSchema: {},
      outputSchema: z.object({ ok: z.boolean(), service: z.string(), now: z.string() }),
      annotations: { readOnlyHint: true },
    },
    async () =>
      withAudit(context, 'health_check', async () =>
        resultWithStructuredContent({
          ok: true,
          service: 'simetri-crm-mcp',
          now: new Date().toISOString(),
        })
      )
  );

  register(
    'get_dashboard_snapshot',
    {
      title: 'Dashboard Snapshot',
      description: 'Sirket/firsat/kisi/is emri ozet sayimlarini getirir',
      inputSchema: {},
      outputSchema: dashboardSnapshotSchema.extend({
        contacts: z.object({ total: z.number().int().nonnegative() }),
        workOrders: z.object({
          total: z.number().int().nonnegative(),
          active: z.number().int().nonnegative(),
        }),
      }),
      annotations: { readOnlyHint: true },
    },
    async () =>
      withAudit(context, 'get_dashboard_snapshot', async () => {
        const [companiesSnapshot, dealsSnapshot, contactsSnapshot, workOrdersSnapshot] =
          await Promise.all([
            adminDb.collection('companies').select().get(),
            adminDb.collection('deals').select().get(),
            adminDb.collection('contacts').select().get(),
            adminDb.collection('work_orders').select().get(),
          ]);

        let activeCompanies = 0;
        let archivedCompanies = 0;
        companiesSnapshot.docs.forEach((doc) => {
          if (doc.data().isArchived === true) archivedCompanies += 1;
          else activeCompanies += 1;
        });

        let wonDeals = 0;
        let lostDeals = 0;
        dealsSnapshot.docs.forEach((doc) => {
          const stage = doc.data().stage as string | undefined;
          if (stage === 'won') wonDeals += 1;
          if (stage === 'lost') lostDeals += 1;
        });

        let activeWorkOrders = 0;
        workOrdersSnapshot.docs.forEach((doc) => {
          if (doc.data().status === 'active') activeWorkOrders += 1;
        });

        return resultWithStructuredContent({
          companies: {
            total: companiesSnapshot.size,
            active: activeCompanies,
            archived: archivedCompanies,
          },
          deals: {
            total: dealsSnapshot.size,
            open: Math.max(0, dealsSnapshot.size - wonDeals - lostDeals),
            won: wonDeals,
            lost: lostDeals,
          },
          contacts: {
            total: contactsSnapshot.size,
          },
          workOrders: {
            total: workOrdersSnapshot.size,
            active: activeWorkOrders,
          },
        });
      })
  );

  register(
    'search_entities',
    {
      title: 'Search Entities',
      description: 'Kisi/sirket/firsat koleksiyonlarinda metin aramasi yapar',
      inputSchema: searchEntitiesInputSchema.shape,
      outputSchema: z.object({
        contacts: z.array(contactSummarySchema),
        companies: z.array(companySummarySchema),
        deals: z.array(dealSummarySchema),
      }),
      annotations: { readOnlyHint: true },
    },
    async (args) =>
      withAudit(context, 'search_entities', async () => {
        const input = searchEntitiesInputSchema.parse(args);
        const query = input.query.toLocaleLowerCase('tr-TR');
        const result = {
          contacts: [] as Array<z.infer<typeof contactSummarySchema>>,
          companies: [] as Array<z.infer<typeof companySummarySchema>>,
          deals: [] as Array<z.infer<typeof dealSummarySchema>>,
        };

        if (input.types.includes('contacts')) {
          const snapshot = await adminDb.collection('contacts').limit(input.limit * 3).get();
          result.contacts = snapshot.docs
            .map((doc) => mapContactSummary(doc.id, doc.data() as Record<string, unknown>))
            .filter((item) =>
              `${item.fullName} ${item.companyName ?? ''}`
                .toLocaleLowerCase('tr-TR')
                .includes(query)
            )
            .slice(0, input.limit);
        }

        if (input.types.includes('companies')) {
          const snapshot = await adminDb.collection('companies').limit(input.limit * 3).get();
          result.companies = snapshot.docs
            .map((doc) => mapCompanySummary(doc.id, doc.data() as Record<string, unknown>))
            .filter((item) => item.name.toLocaleLowerCase('tr-TR').includes(query))
            .slice(0, input.limit);
        }

        if (input.types.includes('deals')) {
          const snapshot = await adminDb.collection('deals').limit(input.limit * 3).get();
          result.deals = snapshot.docs
            .map((doc) => mapDealSummary(doc.id, doc.data() as Record<string, unknown>))
            .filter((item) =>
              `${item.title} ${item.companyName ?? ''}`
                .toLocaleLowerCase('tr-TR')
                .includes(query)
            )
            .slice(0, input.limit);
        }

        return resultWithStructuredContent(result);
      })
  );

  // Networking / Contacts
  register(
    'list_contacts',
    {
      title: 'List Contacts',
      description: 'Networking/CRM kisi listesini getirir',
      inputSchema: listContactsInputSchema.shape,
      outputSchema: z.object({
        items: z.array(contactSummarySchema),
        totalReturned: z.number().int().nonnegative(),
      }),
      annotations: { readOnlyHint: true },
    },
    async (args) =>
      withAudit(context, 'list_contacts', async () => {
        const input = listContactsInputSchema.parse(args);
        let query = adminDb.collection('contacts').limit(input.limit);
        if (input.stage) query = query.where('stage', '==', input.stage);
        if (input.ownerId) query = query.where('ownerId', '==', input.ownerId);
        if (input.companyId) query = query.where('companyId', '==', input.companyId);

        const snapshot = await query.get();
        const items = snapshot.docs.map((doc) =>
          mapContactSummary(doc.id, doc.data() as Record<string, unknown>)
        );
        return resultWithStructuredContent({ items, totalReturned: items.length });
      })
  );

  register(
    'get_contact',
    {
      title: 'Get Contact',
      description: 'Tek bir kisi kaydini getirir',
      inputSchema: z.object({ id: z.string().min(1) }).shape,
      outputSchema: z.object({ item: contactSummarySchema.nullable() }),
      annotations: { readOnlyHint: true },
    },
    async (args) =>
      withAudit(context, 'get_contact', async () => {
        const { id } = z.object({ id: z.string().min(1) }).parse(args);
        const snap = await adminDb.collection('contacts').doc(id).get();
        return resultWithStructuredContent({
          item: snap.exists
            ? mapContactSummary(id, snap.data() as Record<string, unknown>)
            : null,
        });
      })
  );

  register(
    'create_contact',
    {
      title: 'Create Contact',
      description: 'Yeni kisi kaydi olusturur',
      inputSchema: contactCreateSchema.shape,
      outputSchema: mutationResultSchema,
    },
    async (args) =>
      withAudit(context, 'create_contact', async () => {
        const input = contactCreateSchema.parse(args);
        const now = new Date();
        const uid = actor(input.userId);
        const ref = await adminDb.collection('contacts').add({
          fullName: input.fullName,
          email: normalizeNullableString(input.email),
          phone: normalizeNullableString(input.phone),
          stage: input.stage ?? 'new',
          source: normalizeNullableString(input.source),
          sourceDetail: normalizeNullableString(input.sourceDetail),
          ownerId: normalizeNullableString(input.ownerId) ?? uid,
          companyId: normalizeNullableString(input.companyId ?? null),
          companyName: normalizeNullableString(input.companyName ?? null),
          nextAction: normalizeNullableString(input.nextAction ?? null),
          nextActionDate: parseDate(input.nextActionDate),
          createdAt: now,
          updatedAt: now,
          createdBy: uid,
          updatedBy: uid,
        });

        return resultWithStructuredContent({ success: true, id: ref.id });
      })
  );

  register(
    'update_contact',
    {
      title: 'Update Contact',
      description: 'Kisi kaydini gunceller',
      inputSchema: simpleUpdateSchema.shape,
      outputSchema: mutationResultSchema,
    },
    async (args) =>
      withAudit(context, 'update_contact', async () => {
        const input = simpleUpdateSchema.parse(args);
        const uid = actor(input.userId);
        await adminDb.collection('contacts').doc(input.id).set(
          {
            ...input.data,
            updatedAt: new Date(),
            updatedBy: uid,
          },
          { merge: true }
        );
        return resultWithStructuredContent({ success: true, id: input.id });
      })
  );

  register(
    'set_contact_next_action',
    {
      title: 'Set Contact Next Action',
      description: 'Kisi kaydinin sonraki aksiyonunu gunceller',
      inputSchema: z.object({ id: z.string().min(1), ...nextActionInputSchema.shape }).shape,
      outputSchema: mutationResultSchema,
    },
    async (args) =>
      withAudit(context, 'set_contact_next_action', async () => {
        const input = z
          .object({ id: z.string().min(1), ...nextActionInputSchema.shape })
          .parse(args);
        const uid = actor(input.userId);
        await adminDb.collection('contacts').doc(input.id).set(
          {
            nextAction: normalizeNullableString(input.nextAction),
            nextActionDate: parseDate(input.nextActionDate),
            updatedAt: new Date(),
            updatedBy: uid,
          },
          { merge: true }
        );
        return resultWithStructuredContent({ success: true, id: input.id });
      })
  );

  register(
    'list_networking_queue',
    {
      title: 'List Networking Queue',
      description: 'Networking odakli kisi kuyrugunu getirir',
      inputSchema: z.object({ limit: z.number().int().min(1).max(100).default(20) }).shape,
      outputSchema: z.object({ items: z.array(contactSummarySchema), totalReturned: z.number().int() }),
      annotations: { readOnlyHint: true },
    },
    async (args) =>
      withAudit(context, 'list_networking_queue', async () => {
        const { limit } = z.object({ limit: z.number().int().min(1).max(100).default(20) }).parse(args);
        const snapshot = await adminDb
          .collection('contacts')
          .where('stage', 'in', ['new', 'networking', 'warm'])
          .limit(limit)
          .get();
        const items = snapshot.docs.map((doc) =>
          mapContactSummary(doc.id, doc.data() as Record<string, unknown>)
        );
        return resultWithStructuredContent({ items, totalReturned: items.length });
      })
  );

  register(
    'log_contact_activity',
    {
      title: 'Log Contact Activity',
      description: 'Kisiya bagli aktivite kaydi olusturur',
      inputSchema: z
        .object({
          contactId: z.string().min(1),
          companyId: z.string().nullable().optional(),
          dealId: z.string().nullable().optional(),
          type: z.string().trim().default('note'),
          subject: z.string().trim().min(1),
          details: z.string().trim().optional(),
          userId: z.string().trim().optional(),
        })
        .shape,
      outputSchema: mutationResultSchema,
    },
    async (args) =>
      withAudit(context, 'log_contact_activity', async () => {
        const input = z
          .object({
            contactId: z.string().min(1),
            companyId: z.string().nullable().optional(),
            dealId: z.string().nullable().optional(),
            type: z.string().trim().default('note'),
            subject: z.string().trim().min(1),
            details: z.string().trim().optional(),
            userId: z.string().trim().optional(),
          })
          .parse(args);
        const uid = actor(input.userId);
        const ref = await adminDb.collection('activities').add({
          type: input.type,
          subject: input.subject,
          details: normalizeNullableString(input.details) ?? '',
          contactId: input.contactId,
          companyId: normalizeNullableString(input.companyId ?? null),
          dealId: normalizeNullableString(input.dealId ?? null),
          createdAt: new Date(),
          createdBy: uid,
        });
        return resultWithStructuredContent({ success: true, id: ref.id });
      })
  );

  register(
    'link_contact_to_company',
    {
      title: 'Link Contact to Company',
      description: 'Kisiyi bir sirket ile esler',
      inputSchema: z
        .object({
          contactId: z.string().min(1),
          companyId: z.string().min(1),
          companyName: z.string().optional(),
          userId: z.string().optional(),
        })
        .shape,
      outputSchema: mutationResultSchema,
    },
    async (args) =>
      withAudit(context, 'link_contact_to_company', async () => {
        const input = z
          .object({
            contactId: z.string().min(1),
            companyId: z.string().min(1),
            companyName: z.string().optional(),
            userId: z.string().optional(),
          })
          .parse(args);
        let companyName = input.companyName;
        if (!companyName) {
          const companySnap = await adminDb.collection('companies').doc(input.companyId).get();
          companyName = ensureString(companySnap.data()?.name);
        }
        await adminDb.collection('contacts').doc(input.contactId).set(
          {
            companyId: input.companyId,
            companyName: normalizeNullableString(companyName),
            updatedAt: new Date(),
            updatedBy: actor(input.userId),
          },
          { merge: true }
        );
        return resultWithStructuredContent({ success: true, id: input.contactId });
      })
  );

  register(
    'unlink_contact_company',
    {
      title: 'Unlink Contact Company',
      description: 'Kisiyi sirketten bagimsiz hale getirir',
      inputSchema: z.object({ contactId: z.string().min(1), userId: z.string().optional() }).shape,
      outputSchema: mutationResultSchema,
    },
    async (args) =>
      withAudit(context, 'unlink_contact_company', async () => {
        const input = z.object({ contactId: z.string().min(1), userId: z.string().optional() }).parse(args);
        await adminDb.collection('contacts').doc(input.contactId).set(
          {
            companyId: null,
            companyName: null,
            updatedAt: new Date(),
            updatedBy: actor(input.userId),
          },
          { merge: true }
        );
        return resultWithStructuredContent({ success: true, id: input.contactId });
      })
  );

  // Companies
  register(
    'list_companies',
    {
      title: 'List Companies',
      description: 'Sirket listesini filtreleyerek getirir',
      inputSchema: listCompaniesInputSchema.shape,
      outputSchema: z.object({ items: z.array(companySummarySchema), totalReturned: z.number().int() }),
      annotations: { readOnlyHint: true },
    },
    async (args) =>
      withAudit(context, 'list_companies', async () => {
        const input = listCompaniesInputSchema.parse(args);
        let query = adminDb.collection('companies').limit(input.limit);
        if (input.status) query = query.where('status', '==', input.status);
        if (input.isArchived !== undefined) query = query.where('isArchived', '==', input.isArchived);

        const snapshot = await query.get();
        const items = snapshot.docs.map((doc) =>
          mapCompanySummary(doc.id, doc.data() as Record<string, unknown>)
        );
        return resultWithStructuredContent({ items, totalReturned: items.length });
      })
  );

  register(
    'get_company',
    {
      title: 'Get Company',
      description: 'Sirket detayini getirir',
      inputSchema: z.object({ id: z.string().min(1) }).shape,
      outputSchema: z.object({ item: companySummarySchema.nullable() }),
      annotations: { readOnlyHint: true },
    },
    async (args) =>
      withAudit(context, 'get_company', async () => {
        const { id } = z.object({ id: z.string().min(1) }).parse(args);
        const snap = await adminDb.collection('companies').doc(id).get();
        return resultWithStructuredContent({
          item: snap.exists ? mapCompanySummary(id, snap.data() as Record<string, unknown>) : null,
        });
      })
  );

  register(
    'create_company',
    {
      title: 'Create Company',
      description: 'Yeni sirket kaydi olusturur',
      inputSchema: companyCreateSchema.shape,
      outputSchema: mutationResultSchema,
    },
    async (args) =>
      withAudit(context, 'create_company', async () => {
        const input = companyCreateSchema.parse(args);
        const uid = actor(input.userId);
        const now = new Date();
        const ref = await adminDb.collection('companies').add({
          name: input.name,
          status: input.status ?? 'prospect',
          website: normalizeNullableString(input.website),
          address: normalizeNullableString(input.address),
          source: normalizeNullableString(input.source),
          sourceDetail: normalizeNullableString(input.sourceDetail),
          ownerId: normalizeNullableString(input.ownerId) ?? uid,
          nextAction: normalizeNullableString(input.nextAction ?? null),
          nextActionDate: parseDate(input.nextActionDate),
          isArchived: false,
          createdAt: now,
          updatedAt: now,
          createdBy: uid,
          updatedBy: uid,
        });
        return resultWithStructuredContent({ success: true, id: ref.id });
      })
  );

  register(
    'update_company',
    {
      title: 'Update Company',
      description: 'Sirket kaydini gunceller',
      inputSchema: simpleUpdateSchema.shape,
      outputSchema: mutationResultSchema,
    },
    async (args) =>
      withAudit(context, 'update_company', async () => {
        const input = simpleUpdateSchema.parse(args);
        await adminDb.collection('companies').doc(input.id).set(
          {
            ...input.data,
            updatedAt: new Date(),
            updatedBy: actor(input.userId),
          },
          { merge: true }
        );
        return resultWithStructuredContent({ success: true, id: input.id });
      })
  );

  register(
    'set_company_next_action',
    {
      title: 'Set Company Next Action',
      description: 'Sirket sonraki aksiyon bilgisini gunceller',
      inputSchema: z.object({ id: z.string().min(1), ...nextActionInputSchema.shape }).shape,
      outputSchema: mutationResultSchema,
    },
    async (args) =>
      withAudit(context, 'set_company_next_action', async () => {
        const input = z
          .object({ id: z.string().min(1), ...nextActionInputSchema.shape })
          .parse(args);
        await adminDb.collection('companies').doc(input.id).set(
          {
            nextAction: normalizeNullableString(input.nextAction),
            nextActionDate: parseDate(input.nextActionDate),
            updatedAt: new Date(),
            updatedBy: actor(input.userId),
          },
          { merge: true }
        );
        return resultWithStructuredContent({ success: true, id: input.id });
      })
  );

  register(
    'archive_company',
    {
      title: 'Archive Company',
      description: 'Sirketi soft-delete ile arsivler',
      inputSchema: z.object({ id: z.string().min(1), userId: z.string().optional() }).shape,
      outputSchema: mutationResultSchema,
    },
    async (args) =>
      withAudit(context, 'archive_company', async () => {
        const input = z.object({ id: z.string().min(1), userId: z.string().optional() }).parse(args);
        await adminDb.collection('companies').doc(input.id).set(
          {
            isArchived: true,
            updatedAt: new Date(),
            updatedBy: actor(input.userId),
          },
          { merge: true }
        );
        return resultWithStructuredContent({ success: true, id: input.id });
      })
  );

  // Deals
  register(
    'list_deals',
    {
      title: 'List Deals',
      description: 'Firsat listesini filtreleyerek getirir',
      inputSchema: listDealsInputSchema.shape,
      outputSchema: z.object({ items: z.array(dealSummarySchema), totalReturned: z.number().int() }),
      annotations: { readOnlyHint: true },
    },
    async (args) =>
      withAudit(context, 'list_deals', async () => {
        const input = listDealsInputSchema.parse(args);
        let query = adminDb.collection('deals').limit(input.limit);
        if (input.stage) query = query.where('stage', '==', input.stage);
        if (input.isArchived !== undefined) query = query.where('isArchived', '==', input.isArchived);
        const snapshot = await query.get();
        const items = snapshot.docs.map((doc) =>
          mapDealSummary(doc.id, doc.data() as Record<string, unknown>)
        );
        return resultWithStructuredContent({ items, totalReturned: items.length });
      })
  );

  register(
    'get_deal',
    {
      title: 'Get Deal',
      description: 'Tek bir firsat kaydini getirir',
      inputSchema: z.object({ id: z.string().min(1) }).shape,
      outputSchema: z.object({ item: dealSummarySchema.nullable() }),
      annotations: { readOnlyHint: true },
    },
    async (args) =>
      withAudit(context, 'get_deal', async () => {
        const { id } = z.object({ id: z.string().min(1) }).parse(args);
        const snap = await adminDb.collection('deals').doc(id).get();
        return resultWithStructuredContent({
          item: snap.exists ? mapDealSummary(id, snap.data() as Record<string, unknown>) : null,
        });
      })
  );

  register(
    'create_deal',
    {
      title: 'Create Deal',
      description: 'Yeni firsat olusturur',
      inputSchema: dealCreateSchema.shape,
      outputSchema: mutationResultSchema,
    },
    async (args) =>
      withAudit(context, 'create_deal', async () => {
        const input = dealCreateSchema.parse(args);
        const uid = actor(input.userId);
        const now = new Date();
        const ref = await adminDb.collection('deals').add({
          title: input.title,
          stage: input.stage ?? 'lead',
          companyId: normalizeNullableString(input.companyId ?? null),
          companyName: normalizeNullableString(input.companyName ?? null),
          primaryContactId: normalizeNullableString(input.primaryContactId ?? null),
          primaryContactName: normalizeNullableString(input.primaryContactName ?? null),
          estimatedBudgetMinor: input.estimatedBudgetMinor ?? null,
          currency: normalizeNullableString(input.currency) ?? 'TRY',
          ownerId: normalizeNullableString(input.ownerId) ?? uid,
          nextAction: normalizeNullableString(input.nextAction ?? null),
          nextActionDate: parseDate(input.nextActionDate),
          isArchived: false,
          createdAt: now,
          updatedAt: now,
          createdBy: uid,
          updatedBy: uid,
          lastActivityAt: now,
        });
        return resultWithStructuredContent({ success: true, id: ref.id });
      })
  );

  register(
    'update_deal',
    {
      title: 'Update Deal',
      description: 'Firsat kaydini gunceller',
      inputSchema: simpleUpdateSchema.shape,
      outputSchema: mutationResultSchema,
    },
    async (args) =>
      withAudit(context, 'update_deal', async () => {
        const input = simpleUpdateSchema.parse(args);
        await adminDb.collection('deals').doc(input.id).set(
          { ...input.data, updatedAt: new Date(), updatedBy: actor(input.userId) },
          { merge: true }
        );
        return resultWithStructuredContent({ success: true, id: input.id });
      })
  );

  register(
    'move_deal_stage',
    {
      title: 'Move Deal Stage',
      description: 'Deal pipeline asamasini degistirir',
      inputSchema: z
        .object({
          id: z.string().min(1),
          stage: z.enum(DEAL_STAGES),
          lostReason: z.string().nullable().optional(),
          userId: z.string().optional(),
        })
        .shape,
      outputSchema: mutationResultSchema,
    },
    async (args) =>
      withAudit(context, 'move_deal_stage', async () => {
        const input = z
          .object({
            id: z.string().min(1),
            stage: z.enum(DEAL_STAGES),
            lostReason: z.string().nullable().optional(),
            userId: z.string().optional(),
          })
          .parse(args);
        await adminDb.collection('deals').doc(input.id).set(
          {
            stage: input.stage,
            lostReason: normalizeNullableString(input.lostReason ?? null),
            updatedAt: new Date(),
            updatedBy: actor(input.userId),
          },
          { merge: true }
        );
        return resultWithStructuredContent({ success: true, id: input.id });
      })
  );

  register(
    'set_deal_next_action',
    {
      title: 'Set Deal Next Action',
      description: 'Deal sonraki aksiyon bilgisini gunceller',
      inputSchema: z.object({ id: z.string().min(1), ...nextActionInputSchema.shape }).shape,
      outputSchema: mutationResultSchema,
    },
    async (args) =>
      withAudit(context, 'set_deal_next_action', async () => {
        const input = z
          .object({ id: z.string().min(1), ...nextActionInputSchema.shape })
          .parse(args);
        await adminDb.collection('deals').doc(input.id).set(
          {
            nextAction: normalizeNullableString(input.nextAction),
            nextActionDate: parseDate(input.nextActionDate),
            updatedAt: new Date(),
            updatedBy: actor(input.userId),
          },
          { merge: true }
        );
        return resultWithStructuredContent({ success: true, id: input.id });
      })
  );

  register(
    'get_pipeline_summary',
    {
      title: 'Get Pipeline Summary',
      description: 'Deal pipeline asama bazli ozet sayimlarini getirir',
      inputSchema: {},
      outputSchema: z.object({
        summary: z.array(z.object({ stage: z.enum(DEAL_STAGES), count: z.number().int().nonnegative() })),
      }),
      annotations: { readOnlyHint: true },
    },
    async () =>
      withAudit(context, 'get_pipeline_summary', async () => {
        const snapshot = await adminDb.collection('deals').select().get();
        const counts = Object.fromEntries(DEAL_STAGES.map((stage) => [stage, 0])) as Record<
          (typeof DEAL_STAGES)[number],
          number
        >;
        snapshot.docs.forEach((doc) => {
          const stage = doc.data().stage as (typeof DEAL_STAGES)[number] | undefined;
          if (stage && stage in counts) counts[stage] += 1;
        });
        const summary = DEAL_STAGES.map((stage) => ({ stage, count: counts[stage] }));
        return resultWithStructuredContent({ summary });
      })
  );

  // Ops - Work Orders / Deliverables / Tasks
  register(
    'list_work_orders',
    {
      title: 'List Work Orders',
      description: 'Is emri listesini filtreleyerek getirir',
      inputSchema: listWorkOrdersInputSchema.shape,
      outputSchema: z.object({ items: z.array(workOrderSummarySchema), totalReturned: z.number().int() }),
      annotations: { readOnlyHint: true },
    },
    async (args) =>
      withAudit(context, 'list_work_orders', async () => {
        const input = listWorkOrdersInputSchema.parse(args);
        let query = adminDb.collection('work_orders').limit(input.limit);
        if (input.status) query = query.where('status', '==', input.status);
        if (input.companyId) query = query.where('companyId', '==', input.companyId);
        if (input.dealId) query = query.where('dealId', '==', input.dealId);
        const snapshot = await query.get();
        const items = snapshot.docs.map((doc) =>
          mapWorkOrderSummary(doc.id, doc.data() as Record<string, unknown>)
        );
        return resultWithStructuredContent({ items, totalReturned: items.length });
      })
  );

  register(
    'get_work_order',
    {
      title: 'Get Work Order',
      description: 'Tek bir is emri kaydini getirir',
      inputSchema: z.object({ id: z.string().min(1) }).shape,
      outputSchema: z.object({ item: workOrderSummarySchema.nullable() }),
      annotations: { readOnlyHint: true },
    },
    async (args) =>
      withAudit(context, 'get_work_order', async () => {
        const { id } = z.object({ id: z.string().min(1) }).parse(args);
        const snap = await adminDb.collection('work_orders').doc(id).get();
        return resultWithStructuredContent({
          item: snap.exists
            ? mapWorkOrderSummary(id, snap.data() as Record<string, unknown>)
            : null,
        });
      })
  );

  register(
    'create_work_order',
    {
      title: 'Create Work Order',
      description: 'Yeni is emri olusturur',
      inputSchema: workOrderCreateSchema.shape,
      outputSchema: mutationResultSchema,
    },
    async (args) =>
      withAudit(context, 'create_work_order', async () => {
        const input = workOrderCreateSchema.parse(args);
        const uid = actor(input.userId);
        const now = new Date();
        const ref = await adminDb.collection('work_orders').add({
          title: input.title,
          companyId: normalizeNullableString(input.companyId ?? null),
          companyName: normalizeNullableString(input.companyName ?? null),
          dealId: normalizeNullableString(input.dealId ?? null),
          dealTitle: normalizeNullableString(input.dealTitle ?? null),
          status: input.status ?? 'active',
          ownerId: normalizeNullableString(input.ownerId) ?? uid,
          targetDeliveryDate: parseDate(input.targetDeliveryDate),
          createdAt: now,
          updatedAt: now,
          createdBy: uid,
          updatedBy: uid,
        });
        return resultWithStructuredContent({ success: true, id: ref.id });
      })
  );

  register(
    'update_work_order_status',
    {
      title: 'Update Work Order Status',
      description: 'Is emri durumunu gunceller',
      inputSchema: z
        .object({
          id: z.string().min(1),
          status: z.enum(WORK_ORDER_STATUSES),
          userId: z.string().optional(),
        })
        .shape,
      outputSchema: mutationResultSchema,
    },
    async (args) =>
      withAudit(context, 'update_work_order_status', async () => {
        const input = z
          .object({
            id: z.string().min(1),
            status: z.enum(WORK_ORDER_STATUSES),
            userId: z.string().optional(),
          })
          .parse(args);
        await adminDb.collection('work_orders').doc(input.id).set(
          { status: input.status, updatedAt: new Date(), updatedBy: actor(input.userId) },
          { merge: true }
        );
        return resultWithStructuredContent({ success: true, id: input.id });
      })
  );

  register(
    'list_deliverables',
    {
      title: 'List Deliverables',
      description: 'Is emrine bagli teslimat listesini getirir',
      inputSchema: listDeliverablesInputSchema.shape,
      outputSchema: z.object({ items: z.array(deliverableSummarySchema), totalReturned: z.number().int() }),
      annotations: { readOnlyHint: true },
    },
    async (args) =>
      withAudit(context, 'list_deliverables', async () => {
        const input = listDeliverablesInputSchema.parse(args);
        let query = adminDb
          .collection('deliverables')
          .where('workOrderId', '==', input.workOrderId)
          .limit(input.limit);
        if (input.status) query = query.where('status', '==', input.status);
        const snapshot = await query.get();
        const items = snapshot.docs.map((doc) =>
          mapDeliverableSummary(doc.id, doc.data() as Record<string, unknown>)
        );
        return resultWithStructuredContent({ items, totalReturned: items.length });
      })
  );

  register(
    'create_deliverable',
    {
      title: 'Create Deliverable',
      description: 'Is emrine teslimat ekler',
      inputSchema: deliverableCreateSchema.shape,
      outputSchema: mutationResultSchema,
    },
    async (args) =>
      withAudit(context, 'create_deliverable', async () => {
        const input = deliverableCreateSchema.parse(args);
        const uid = actor(input.userId);
        const now = new Date();
        const ref = await adminDb.collection('deliverables').add({
          title: input.title,
          workOrderId: input.workOrderId,
          status: input.status ?? 'not-started',
          ownerId: normalizeNullableString(input.ownerId) ?? uid,
          dueDate: parseDate(input.dueDate),
          createdAt: now,
          updatedAt: now,
          createdBy: uid,
          updatedBy: uid,
        });
        return resultWithStructuredContent({ success: true, id: ref.id });
      })
  );

  register(
    'update_deliverable_status',
    {
      title: 'Update Deliverable Status',
      description: 'Teslimat durumunu gunceller',
      inputSchema: z
        .object({
          id: z.string().min(1),
          status: z.enum(DELIVERABLE_STATUSES),
          userId: z.string().optional(),
        })
        .shape,
      outputSchema: mutationResultSchema,
    },
    async (args) =>
      withAudit(context, 'update_deliverable_status', async () => {
        const input = z
          .object({
            id: z.string().min(1),
            status: z.enum(DELIVERABLE_STATUSES),
            userId: z.string().optional(),
          })
          .parse(args);
        await adminDb.collection('deliverables').doc(input.id).set(
          { status: input.status, updatedAt: new Date(), updatedBy: actor(input.userId) },
          { merge: true }
        );
        return resultWithStructuredContent({ success: true, id: input.id });
      })
  );

  register(
    'list_tasks',
    {
      title: 'List Tasks',
      description: 'Gorev listesini filtreleyerek getirir',
      inputSchema: listTasksInputSchema.shape,
      outputSchema: z.object({ items: z.array(taskSummarySchema), totalReturned: z.number().int() }),
      annotations: { readOnlyHint: true },
    },
    async (args) =>
      withAudit(context, 'list_tasks', async () => {
        const input = listTasksInputSchema.parse(args);
        let query = adminDb.collection('tasks').limit(input.limit);
        if (input.status) query = query.where('status', '==', input.status);
        if (input.workOrderId) query = query.where('workOrderId', '==', input.workOrderId);
        if (input.deliverableId) query = query.where('deliverableId', '==', input.deliverableId);
        if (input.assigneeId) query = query.where('assigneeId', '==', input.assigneeId);
        const snapshot = await query.get();
        const items = snapshot.docs.map((doc) =>
          mapTaskSummary(doc.id, doc.data() as Record<string, unknown>)
        );
        return resultWithStructuredContent({ items, totalReturned: items.length });
      })
  );

  register(
    'create_task',
    {
      title: 'Create Task',
      description: 'Yeni gorev olusturur',
      inputSchema: taskCreateSchema.shape,
      outputSchema: mutationResultSchema,
    },
    async (args) =>
      withAudit(context, 'create_task', async () => {
        const input = taskCreateSchema.parse(args);
        const uid = actor(input.userId);
        const now = new Date();
        const ref = await adminDb.collection('tasks').add({
          title: input.title,
          workOrderId: normalizeNullableString(input.workOrderId ?? null),
          deliverableId: normalizeNullableString(input.deliverableId ?? null),
          status: input.status ?? 'backlog',
          assigneeId: normalizeNullableString(input.assigneeId ?? null),
          dueDate: parseDate(input.dueDate),
          createdAt: now,
          updatedAt: now,
          createdBy: uid,
          updatedBy: uid,
        });
        return resultWithStructuredContent({ success: true, id: ref.id });
      })
  );

  register(
    'update_task_status',
    {
      title: 'Update Task Status',
      description: 'Gorev durumunu gunceller',
      inputSchema: z
        .object({
          id: z.string().min(1),
          status: z.enum(TASK_STATUSES),
          userId: z.string().optional(),
        })
        .shape,
      outputSchema: mutationResultSchema,
    },
    async (args) =>
      withAudit(context, 'update_task_status', async () => {
        const input = z
          .object({
            id: z.string().min(1),
            status: z.enum(TASK_STATUSES),
            userId: z.string().optional(),
          })
          .parse(args);
        await adminDb.collection('tasks').doc(input.id).set(
          { status: input.status, updatedAt: new Date(), updatedBy: actor(input.userId) },
          { merge: true }
        );
        return resultWithStructuredContent({ success: true, id: input.id });
      })
  );

  // Faz 2 faydali araclar
  register(
    'list_overdue_followups',
    {
      title: 'List Overdue Followups',
      description: 'Gecikmis takipleri entity tipine gore listeler',
      inputSchema: z
        .object({
          types: z
            .array(z.enum(['contacts', 'companies', 'deals']))
            .default(['contacts', 'companies', 'deals']),
          limit: z.number().int().min(1).max(200).default(50),
        })
        .shape,
      outputSchema: z.object({
        contacts: z.array(contactSummarySchema),
        companies: z.array(companySummarySchema),
        deals: z.array(dealSummarySchema),
      }),
      annotations: { readOnlyHint: true },
    },
    async (args) =>
      withAudit(context, 'list_overdue_followups', async () => {
        const input = z
          .object({
            types: z
              .array(z.enum(['contacts', 'companies', 'deals']))
              .default(['contacts', 'companies', 'deals']),
            limit: z.number().int().min(1).max(200).default(50),
          })
          .parse(args);
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const response = {
          contacts: [] as Array<z.infer<typeof contactSummarySchema>>,
          companies: [] as Array<z.infer<typeof companySummarySchema>>,
          deals: [] as Array<z.infer<typeof dealSummarySchema>>,
        };

        if (input.types.includes('contacts')) {
          const s = await adminDb.collection('contacts').limit(input.limit * 2).get();
          response.contacts = s.docs
            .map((doc) => mapContactSummary(doc.id, doc.data() as Record<string, unknown>))
            .filter((item) => {
              const d = toDateOrNull(item.nextActionDate);
              return !!d && d < startOfToday;
            })
            .slice(0, input.limit);
        }
        if (input.types.includes('companies')) {
          const s = await adminDb.collection('companies').limit(input.limit * 2).get();
          response.companies = s.docs
            .map((doc) => mapCompanySummary(doc.id, doc.data() as Record<string, unknown>))
            .filter((item) => {
              const d = toDateOrNull(item.nextActionDate);
              return !!d && d < startOfToday;
            })
            .slice(0, input.limit);
        }
        if (input.types.includes('deals')) {
          const s = await adminDb.collection('deals').limit(input.limit * 2).get();
          response.deals = s.docs
            .map((doc) => mapDealSummary(doc.id, doc.data() as Record<string, unknown>))
            .filter((item) => {
              const d = toDateOrNull(item.nextActionDate);
              return !!d && d < startOfToday;
            })
            .slice(0, input.limit);
        }

        return resultWithStructuredContent(response);
      })
  );

  register(
    'get_today_agenda',
    {
      title: 'Get Today Agenda',
      description: 'Bugun icin takip ve aktivite gundemini getirir',
      inputSchema: z.object({ limit: z.number().int().min(1).max(200).default(50) }).shape,
      outputSchema: z.object({
        followups: z.array(
          z.object({
            type: z.enum(['contact', 'company', 'deal']),
            id: z.string(),
            title: z.string(),
            nextAction: z.string().nullable(),
            nextActionDate: z.string().nullable(),
          })
        ),
        activities: z.array(activitySummarySchema),
      }),
      annotations: { readOnlyHint: true },
    },
    async (args) =>
      withAudit(context, 'get_today_agenda', async () => {
        const { limit } = z.object({ limit: z.number().int().min(1).max(200).default(50) }).parse(args);
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);

        const [contacts, companies, deals, activities] = await Promise.all([
          adminDb.collection('contacts').limit(limit * 2).get(),
          adminDb.collection('companies').limit(limit * 2).get(),
          adminDb.collection('deals').limit(limit * 2).get(),
          adminDb.collection('activities').orderBy('createdAt', 'desc').limit(limit).get(),
        ]);

        const followups = [
          ...contacts.docs
            .map((doc) => mapContactSummary(doc.id, doc.data() as Record<string, unknown>))
            .filter((item) => {
              const d = toDateOrNull(item.nextActionDate);
              return !!d && d >= start && d < end;
            })
            .map((item) => ({
              type: 'contact' as const,
              id: item.id,
              title: item.fullName,
              nextAction: item.nextAction,
              nextActionDate: item.nextActionDate,
            })),
          ...companies.docs
            .map((doc) => mapCompanySummary(doc.id, doc.data() as Record<string, unknown>))
            .filter((item) => {
              const d = toDateOrNull(item.nextActionDate);
              return !!d && d >= start && d < end;
            })
            .map((item) => ({
              type: 'company' as const,
              id: item.id,
              title: item.name,
              nextAction: item.nextAction,
              nextActionDate: item.nextActionDate,
            })),
          ...deals.docs
            .map((doc) => mapDealSummary(doc.id, doc.data() as Record<string, unknown>))
            .filter((item) => {
              const d = toDateOrNull(item.nextActionDate);
              return !!d && d >= start && d < end;
            })
            .map((item) => ({
              type: 'deal' as const,
              id: item.id,
              title: item.title,
              nextAction: item.nextAction,
              nextActionDate: item.nextActionDate,
            })),
        ].slice(0, limit);

        const activityItems = activities.docs
          .map((doc) => mapActivitySummary(doc.id, doc.data() as Record<string, unknown>))
          .slice(0, limit);

        return resultWithStructuredContent({ followups, activities: activityItems });
      })
  );

  register(
    'list_recent_activities',
    {
      title: 'List Recent Activities',
      description: 'Son aktiviteleri listeler',
      inputSchema: z.object({ limit: z.number().int().min(1).max(200).default(20) }).shape,
      outputSchema: z.object({ items: z.array(activitySummarySchema), totalReturned: z.number().int() }),
      annotations: { readOnlyHint: true },
    },
    async (args) =>
      withAudit(context, 'list_recent_activities', async () => {
        const { limit } = z.object({ limit: z.number().int().min(1).max(200).default(20) }).parse(args);
        const snapshot = await adminDb
          .collection('activities')
          .orderBy('createdAt', 'desc')
          .limit(limit)
          .get();
        const items = snapshot.docs.map((doc) =>
          mapActivitySummary(doc.id, doc.data() as Record<string, unknown>)
        );
        return resultWithStructuredContent({ items, totalReturned: items.length });
      })
  );

  register(
    'bulk_update_next_actions',
    {
      title: 'Bulk Update Next Actions',
      description: 'Toplu next action guncellemesi yapar',
      inputSchema: z
        .object({
          entityType: z.enum(['contacts', 'companies', 'deals']),
          ids: z.array(z.string().min(1)).min(1).max(100),
          nextAction: z.string().nullable(),
          nextActionDate: z.string().datetime().nullable(),
          userId: z.string().optional(),
        })
        .shape,
      outputSchema: z.object({ success: z.boolean(), updatedCount: z.number().int().nonnegative() }),
    },
    async (args) =>
      withAudit(context, 'bulk_update_next_actions', async () => {
        const input = z
          .object({
            entityType: z.enum(['contacts', 'companies', 'deals']),
            ids: z.array(z.string().min(1)).min(1).max(100),
            nextAction: z.string().nullable(),
            nextActionDate: z.string().datetime().nullable(),
            userId: z.string().optional(),
          })
          .parse(args);
        const uid = actor(input.userId);
        const batch = adminDb.batch();
        const collection = input.entityType;
        const nextAction = normalizeNullableString(input.nextAction);
        const nextActionDate = parseDate(input.nextActionDate);
        input.ids.forEach((id) => {
          batch.set(
            adminDb.collection(collection).doc(id),
            {
              nextAction,
              nextActionDate,
              updatedAt: new Date(),
              updatedBy: uid,
            },
            { merge: true }
          );
        });
        await batch.commit();
        return resultWithStructuredContent({ success: true, updatedCount: input.ids.length });
      })
  );

  register(
    'get_owner_workload',
    {
      title: 'Get Owner Workload',
      description: 'Owner bazli acik is ve takip yogunlugunu getirir',
      inputSchema: z.object({ ownerId: z.string().min(1) }).shape,
      outputSchema: z.object({
        ownerId: z.string(),
        contacts: z.object({ total: z.number().int(), networking: z.number().int() }),
        deals: z.object({ total: z.number().int(), open: z.number().int() }),
        workOrders: z.object({ total: z.number().int(), active: z.number().int() }),
        tasks: z.object({ assigned: z.number().int(), open: z.number().int() }),
      }),
      annotations: { readOnlyHint: true },
    },
    async (args) =>
      withAudit(context, 'get_owner_workload', async () => {
        const { ownerId } = z.object({ ownerId: z.string().min(1) }).parse(args);
        const [contactSnap, dealSnap, workOrderSnap, taskSnap] = await Promise.all([
          adminDb.collection('contacts').where('ownerId', '==', ownerId).get(),
          adminDb.collection('deals').where('ownerId', '==', ownerId).get(),
          adminDb.collection('work_orders').where('ownerId', '==', ownerId).get(),
          adminDb.collection('tasks').where('assigneeId', '==', ownerId).get(),
        ]);

        let networking = 0;
        contactSnap.docs.forEach((doc) => {
          const stage = doc.data().stage as string | undefined;
          if (stage === 'new' || stage === 'networking' || stage === 'warm') networking += 1;
        });

        let openDeals = 0;
        dealSnap.docs.forEach((doc) => {
          const stage = doc.data().stage as string | undefined;
          if (stage && stage !== 'won' && stage !== 'lost') openDeals += 1;
        });

        let activeWorkOrders = 0;
        workOrderSnap.docs.forEach((doc) => {
          if (doc.data().status === 'active') activeWorkOrders += 1;
        });

        let openTasks = 0;
        taskSnap.docs.forEach((doc) => {
          if (doc.data().status !== 'done') openTasks += 1;
        });

        return resultWithStructuredContent({
          ownerId,
          contacts: { total: contactSnap.size, networking },
          deals: { total: dealSnap.size, open: openDeals },
          workOrders: { total: workOrderSnap.size, active: activeWorkOrders },
          tasks: { assigned: taskSnap.size, open: openTasks },
        });
      })
  );

  register(
    'send_broadcast_push',
    {
      title: 'Send Broadcast Push',
      description: 'Aboneligi olan tum kullanicilara toplu push bildirimi gonderir',
      inputSchema: z
        .object({
          title: z.string().trim().min(1),
          body: z.string().trim().min(1),
          url: z.string().trim().min(1).optional(),
        })
        .shape,
      outputSchema: z.object({
        success: z.boolean(),
        message: z.string().optional(),
        totalUsers: z.number().int().nonnegative(),
        attempted: z.number().int().nonnegative(),
        sent: z.number().int().nonnegative(),
        failed: z.number().int().nonnegative(),
        failures: z.array(z.object({ userId: z.string(), error: z.string() })),
      }),
    },
    async (args) =>
      withAudit(context, 'send_broadcast_push', async () => {
        const input = z
          .object({
            title: z.string().trim().min(1),
            body: z.string().trim().min(1),
            url: z.string().trim().min(1).optional(),
          })
          .parse(args);

        const vapid = ensureWebPushConfigured();
        if (!vapid.ok) {
          return resultWithStructuredContent({
            success: false,
            message: vapid.error,
            totalUsers: 0,
            attempted: 0,
            sent: 0,
            failed: 0,
            failures: [],
          });
        }

        const usersSnapshot = await adminDb.collection('users').get();
        const targets: Array<{ userId: string; subscription: StoredPushSubscription }> = [];
        usersSnapshot.docs.forEach((doc) => {
          const subscriptions = normalizeUserPushSubscriptions(doc.data());
          subscriptions.forEach((subscription) => {
            targets.push({ userId: doc.id, subscription });
          });
        });

        if (targets.length === 0) {
          return resultWithStructuredContent({
            success: true,
            message: 'Push aboneligi olan kullanici bulunamadi.',
            totalUsers: usersSnapshot.size,
            attempted: 0,
            sent: 0,
            failed: 0,
            failures: [],
          });
        }

        const payload = JSON.stringify({
          title: input.title,
          body: input.body,
          url: input.url ?? '/dashboard',
          icon: '/logos/Simetri-CRM-logo-01.png',
        });

        const deliveryResults = await Promise.allSettled(
          targets.map((target) => {
            return webpush.sendNotification(target.subscription, payload);
          })
        );

        const failures: Array<{ userId: string; error: string }> = [];
        const staleByUser = new Map<string, Set<string>>();
        deliveryResults.forEach((result, index) => {
          if (result.status === 'rejected') {
            const target = targets[index];
            failures.push({
              userId: target?.userId ?? 'unknown',
              error: result.reason instanceof Error ? result.reason.message : String(result.reason),
            });
            if (target && shouldRemoveSubscriptionOnError(result.reason)) {
              const current = staleByUser.get(target.userId) ?? new Set<string>();
              current.add(target.subscription.endpoint);
              staleByUser.set(target.userId, current);
            }
          }
        });

        const cleanupPromises: Array<Promise<unknown>> = [];
        staleByUser.forEach((staleEndpoints, userId) => {
          const userDoc = usersSnapshot.docs.find((doc) => doc.id === userId);
          const existing = normalizeUserPushSubscriptions(
            (userDoc?.data() ?? {}) as Record<string, unknown>
          );
          const remaining = existing.filter((sub) => !staleEndpoints.has(sub.endpoint));
          cleanupPromises.push(
            adminDb
              .collection('users')
              .doc(userId)
              .set(
                {
                  pushSubscriptions: remaining,
                  pushSubscription: remaining[0] ?? null,
                },
                { merge: true }
              )
          );
        });
        await Promise.all(cleanupPromises);

        const attempted = targets.length;
        const failed = failures.length;
        const sent = attempted - failed;

        return resultWithStructuredContent({
          success: failed === 0,
          message:
            failed === 0
              ? 'Push bildirimi tum abonelere gonderildi.'
              : 'Bazi kullanicilara push gonderimi basarisiz oldu.',
          totalUsers: usersSnapshot.size,
          attempted,
          sent,
          failed,
          failures,
        });
      })
  );

  server.registerResource(
    'server-metadata',
    'simetri://mcp/metadata',
    {
      title: 'MCP Metadata',
      description: 'MCP endpoint metadata',
      mimeType: 'application/json',
    },
    async () => ({
      contents: [
        {
          uri: 'simetri://mcp/metadata',
          text: JSON.stringify(
            {
              service: 'simetri-crm-mcp',
              version: '1.1.0',
              totalTools: tools.length,
              tools,
            },
            null,
            2
          ),
        },
      ],
    })
  );

  return server;
}

