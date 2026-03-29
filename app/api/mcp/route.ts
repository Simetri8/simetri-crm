import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { verifyApiKeyAuth } from '@/lib/mcp/auth';
import { checkRateLimit } from '@/lib/mcp/rate-limit';
import { createMcpServer } from '@/lib/mcp/tools';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type SessionRecord = {
  transport: WebStandardStreamableHTTPServerTransport;
  keyFingerprint: string;
};

const globalState = globalThis as typeof globalThis & {
  __simetriMcpSessions?: Map<string, SessionRecord>;
};

const sessionMap = globalState.__simetriMcpSessions ?? new Map<string, SessionRecord>();
globalState.__simetriMcpSessions = sessionMap;

function allowedOrigins(): string[] {
  const raw = process.env.MCP_ALLOWED_ORIGINS;
  if (!raw) return [];
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function withCors(response: Response, request: Request): Response {
  const next = new Response(response.body, response);
  const origin = request.headers.get('origin');
  const allowList = allowedOrigins();

  if (origin && allowList.includes(origin)) {
    next.headers.set('Access-Control-Allow-Origin', origin);
    next.headers.set('Vary', 'Origin');
  }

  next.headers.set(
    'Access-Control-Allow-Headers',
    'Authorization, Content-Type, MCP-Session-Id, MCP-Protocol-Version, Last-Event-ID'
  );
  next.headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  return next;
}

function jsonError(
  status: number,
  message: string,
  request: Request,
  extraHeaders?: Record<string, string>
): Response {
  const response = NextResponse.json({ error: message }, { status });
  if (extraHeaders) {
    Object.entries(extraHeaders).forEach(([key, value]) =>
      response.headers.set(key, value)
    );
  }
  return withCors(response, request);
}

function getSessionId(request: Request): string | null {
  return request.headers.get('mcp-session-id');
}

function canUseSession(sessionId: string, keyFingerprint: string): boolean {
  const record = sessionMap.get(sessionId);
  if (!record) return false;
  return record.keyFingerprint === keyFingerprint;
}

export async function OPTIONS(request: Request) {
  return withCors(new Response(null, { status: 204 }), request);
}

export async function GET(request: Request) {
  return handleMcpRequest(request);
}

export async function POST(request: Request) {
  return handleMcpRequest(request);
}

export async function DELETE(request: Request) {
  return handleMcpRequest(request);
}

async function handleMcpRequest(request: Request): Promise<Response> {
  const auth = verifyApiKeyAuth(request);
  if (!auth.ok) {
    return jsonError(auth.status, auth.error, request);
  }

  const rateLimitKey = `${auth.keyFingerprint}:${auth.clientIp ?? 'unknown'}`;
  const limitState = checkRateLimit(rateLimitKey);
  if (!limitState.allowed) {
    return jsonError(429, 'Rate limit asildi', request, {
      'Retry-After': String(limitState.retryAfterSeconds),
      'X-RateLimit-Limit': String(limitState.limit),
      'X-RateLimit-Remaining': String(limitState.remaining),
    });
  }

  const sessionId = getSessionId(request);

  try {
    if (request.method === 'POST') {
      let parsedBody: unknown;
      try {
        parsedBody = await request.json();
      } catch {
        return jsonError(400, 'Gecersiz JSON body', request);
      }

      if (sessionId) {
        if (!canUseSession(sessionId, auth.keyFingerprint)) {
          return jsonError(403, 'Bu session için yetki yok', request);
        }
        const existing = sessionMap.get(sessionId);
        if (!existing) {
          return jsonError(404, 'Session bulunamadi', request);
        }
        const response = await existing.transport.handleRequest(request, {
          parsedBody,
        });
        return withCors(response, request);
      }

      if (!isInitializeRequest(parsedBody)) {
        return jsonError(
          400,
          'Yeni session için initialize istegi gerekli',
          request
        );
      }

      const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (newSessionId) => {
          sessionMap.set(newSessionId, {
            transport,
            keyFingerprint: auth.keyFingerprint,
          });
        },
        onsessionclosed: (closedSessionId) => {
          sessionMap.delete(closedSessionId);
        },
      });

      transport.onclose = () => {
        if (transport.sessionId) {
          sessionMap.delete(transport.sessionId);
        }
      };

      const server = createMcpServer({
        sessionId: undefined,
        keyFingerprint: auth.keyFingerprint,
        clientIp: auth.clientIp,
      });

      await server.connect(transport);
      const response = await transport.handleRequest(request, { parsedBody });
      return withCors(response, request);
    }

    if (!sessionId) {
      return jsonError(400, 'Session ID gerekli', request);
    }
    if (!canUseSession(sessionId, auth.keyFingerprint)) {
      return jsonError(403, 'Bu session için yetki yok', request);
    }

    const existing = sessionMap.get(sessionId);
    if (!existing) {
      return jsonError(404, 'Session bulunamadi', request);
    }

    const response = await existing.transport.handleRequest(request);

    if (request.method === 'DELETE') {
      sessionMap.delete(sessionId);
    }

    return withCors(response, request);
  } catch (error) {
    console.error('MCP route error:', error);
    return jsonError(500, 'Internal Server Error', request);
  }
}

