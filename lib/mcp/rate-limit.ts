type RateLimitState = {
  windowStartMs: number;
  count: number;
};

type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
  limit: number;
  remaining: number;
};

const WINDOW_MS = 60_000;

const globalState = globalThis as typeof globalThis & {
  __simetriMcpRateLimit?: Map<string, RateLimitState>;
};

const stateMap = globalState.__simetriMcpRateLimit ?? new Map<string, RateLimitState>();
globalState.__simetriMcpRateLimit = stateMap;

function getLimitPerMinute(): number {
  const raw = Number(process.env.MCP_RATE_LIMIT_PER_MINUTE ?? 60);
  if (!Number.isFinite(raw) || raw <= 0) return 60;
  return Math.floor(raw);
}

function getState(key: string, now: number): RateLimitState {
  const existing = stateMap.get(key);
  if (!existing || now - existing.windowStartMs >= WINDOW_MS) {
    const next: RateLimitState = { windowStartMs: now, count: 0 };
    stateMap.set(key, next);
    return next;
  }
  return existing;
}

export function checkRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const limit = getLimitPerMinute();
  const state = getState(key, now);
  state.count += 1;

  const remaining = Math.max(0, limit - state.count);
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((state.windowStartMs + WINDOW_MS - now) / 1000)
  );

  return {
    allowed: state.count <= limit,
    retryAfterSeconds,
    limit,
    remaining,
  };
}

