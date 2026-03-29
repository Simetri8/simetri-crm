import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { adminDb } from '@/lib/firebase/admin';
import {
  companySummarySchema,
  dashboardSnapshotSchema,
  dealSummarySchema,
  listCompaniesInputSchema,
  listDealsInputSchema,
  toIsoOrNull,
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

export function createMcpServer(context: AuditContext) {
  const server = new McpServer(
    {
      name: 'simetri-planner-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        logging: {},
      },
    }
  );

  server.registerTool(
    'health_check',
    {
      title: 'Health Check',
      description: 'MCP servis durumunu ve zamanı döndürür',
      inputSchema: {},
      outputSchema: z.object({
        ok: z.boolean(),
        service: z.string(),
        now: z.string(),
      }),
      annotations: {
        readOnlyHint: true,
      },
    },
    async () =>
      withAudit(context, 'health_check', async () =>
        resultWithStructuredContent({
          ok: true,
          service: 'simetri-planner-mcp',
          now: new Date().toISOString(),
        })
      )
  );

  server.registerTool(
    'list_companies',
    {
      title: 'List Companies',
      description: 'Sirket listesini filtreleyerek getirir',
      inputSchema: listCompaniesInputSchema.shape,
      outputSchema: z.object({
        items: z.array(companySummarySchema),
        totalReturned: z.number().int().nonnegative(),
      }),
      annotations: {
        readOnlyHint: true,
      },
    },
    async (args) =>
      withAudit(context, 'list_companies', async () => {
        const input = listCompaniesInputSchema.parse(args);
        let query = adminDb.collection('companies').orderBy('updatedAt', 'desc').limit(input.limit);

        if (input.status) {
          query = query.where('status', '==', input.status);
        }
        if (input.isArchived !== undefined) {
          query = query.where('isArchived', '==', input.isArchived);
        }

        const snapshot = await query.get();
        const items = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: String(data.name ?? ''),
            status: (data.status as string | undefined) ?? null,
            ownerId: (data.ownerId as string | undefined) ?? null,
            nextAction: (data.nextAction as string | undefined) ?? null,
            nextActionDate: toIsoOrNull(data.nextActionDate),
            updatedAt: toIsoOrNull(data.updatedAt),
            isArchived:
              typeof data.isArchived === 'boolean' ? data.isArchived : null,
          };
        });

        return resultWithStructuredContent({
          items,
          totalReturned: items.length,
        });
      })
  );

  server.registerTool(
    'list_deals',
    {
      title: 'List Deals',
      description: 'Firsat listesini filtreleyerek getirir',
      inputSchema: listDealsInputSchema.shape,
      outputSchema: z.object({
        items: z.array(dealSummarySchema),
        totalReturned: z.number().int().nonnegative(),
      }),
      annotations: {
        readOnlyHint: true,
      },
    },
    async (args) =>
      withAudit(context, 'list_deals', async () => {
        const input = listDealsInputSchema.parse(args);
        let query = adminDb.collection('deals').orderBy('updatedAt', 'desc').limit(input.limit);

        if (input.stage) {
          query = query.where('stage', '==', input.stage);
        }
        if (input.isArchived !== undefined) {
          query = query.where('isArchived', '==', input.isArchived);
        }

        const snapshot = await query.get();
        const items = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: String(data.title ?? ''),
            stage: (data.stage as string | undefined) ?? null,
            companyId: (data.companyId as string | undefined) ?? null,
            companyName: (data.companyName as string | undefined) ?? null,
            ownerId: (data.ownerId as string | undefined) ?? null,
            nextAction: (data.nextAction as string | undefined) ?? null,
            nextActionDate: toIsoOrNull(data.nextActionDate),
            updatedAt: toIsoOrNull(data.updatedAt),
            isArchived:
              typeof data.isArchived === 'boolean' ? data.isArchived : null,
          };
        });

        return resultWithStructuredContent({
          items,
          totalReturned: items.length,
        });
      })
  );

  server.registerTool(
    'get_dashboard_snapshot',
    {
      title: 'Dashboard Snapshot',
      description: 'Sirket ve firsat ozet sayimlarini getirir',
      inputSchema: {},
      outputSchema: dashboardSnapshotSchema,
      annotations: {
        readOnlyHint: true,
      },
    },
    async () =>
      withAudit(context, 'get_dashboard_snapshot', async () => {
        const [companiesSnapshot, dealsSnapshot] = await Promise.all([
          adminDb.collection('companies').select().get(),
          adminDb.collection('deals').select().get(),
        ]);

        let activeCompanies = 0;
        let archivedCompanies = 0;
        companiesSnapshot.docs.forEach((doc) => {
          const isArchived = doc.data().isArchived === true;
          if (isArchived) archivedCompanies += 1;
          else activeCompanies += 1;
        });

        let wonDeals = 0;
        let lostDeals = 0;
        dealsSnapshot.docs.forEach((doc) => {
          const stage = doc.data().stage as string | undefined;
          if (stage === 'won') wonDeals += 1;
          if (stage === 'lost') lostDeals += 1;
        });

        const result = {
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
        };

        return resultWithStructuredContent(result);
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
              service: 'simetri-planner-mcp',
              version: '1.0.0',
              tools: ['health_check', 'list_companies', 'list_deals', 'get_dashboard_snapshot'],
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

