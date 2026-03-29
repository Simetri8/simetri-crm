import { createHash, timingSafeEqual } from 'node:crypto';

export type AuthSuccess = {
  ok: true;
  keyFingerprint: string;
  clientIp: string | null;
};

export type AuthFailure = {
  ok: false;
  status: 401 | 403 | 500;
  error: string;
};

export type AuthResult = AuthSuccess | AuthFailure;

function toList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseAcceptedApiKeys(): string[] {
  return [
    ...toList(process.env.MCP_API_KEY),
    ...toList(process.env.MCP_API_KEYS),
    ...toList(process.env.MCP_API_KEY_PREVIOUS),
  ];
}

function secureStringEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function getBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice('Bearer '.length).trim();
  return token || null;
}

function parseAllowedIps(): string[] {
  return toList(process.env.MCP_ALLOWED_IPS);
}

export function extractClientIp(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const firstIp = forwarded.split(',')[0]?.trim();
    if (firstIp) return firstIp;
  }
  const realIp = request.headers.get('x-real-ip')?.trim();
  return realIp || null;
}

function createFingerprint(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex').slice(0, 12);
}

export function verifyApiKeyAuth(request: Request): AuthResult {
  const acceptedKeys = parseAcceptedApiKeys();
  if (acceptedKeys.length === 0) {
    return {
      ok: false,
      status: 500,
      error: 'MCP API key yapılandırması eksik',
    };
  }

  const token = getBearerToken(request.headers.get('authorization'));
  if (!token) {
    return {
      ok: false,
      status: 401,
      error: 'Authorization Bearer token gerekli',
    };
  }

  const matchedKey = acceptedKeys.find((apiKey) => secureStringEquals(token, apiKey));
  if (!matchedKey) {
    return {
      ok: false,
      status: 401,
      error: 'Geçersiz API key',
    };
  }

  const allowedIps = parseAllowedIps();
  const clientIp = extractClientIp(request);
  if (allowedIps.length > 0 && (!clientIp || !allowedIps.includes(clientIp))) {
    return {
      ok: false,
      status: 403,
      error: 'Bu IP adresine erişim izni yok',
    };
  }

  return {
    ok: true,
    keyFingerprint: createFingerprint(matchedKey),
    clientIp,
  };
}

