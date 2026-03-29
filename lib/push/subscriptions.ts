export type StoredPushSubscription = {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};

type UserPushData = {
  pushSubscription?: unknown;
  pushSubscriptions?: unknown;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isStoredPushSubscription(value: unknown): value is StoredPushSubscription {
  if (!isObject(value)) return false;
  if (typeof value.endpoint !== 'string' || value.endpoint.length === 0) return false;
  if (!isObject(value.keys)) return false;
  return (
    typeof value.keys.p256dh === 'string' &&
    value.keys.p256dh.length > 0 &&
    typeof value.keys.auth === 'string' &&
    value.keys.auth.length > 0
  );
}

function dedupeByEndpoint(subscriptions: StoredPushSubscription[]): StoredPushSubscription[] {
  const byEndpoint = new Map<string, StoredPushSubscription>();
  subscriptions.forEach((sub) => {
    byEndpoint.set(sub.endpoint, sub);
  });
  return Array.from(byEndpoint.values());
}

export function normalizeUserPushSubscriptions(userData?: UserPushData): StoredPushSubscription[] {
  if (!userData) return [];
  const normalized: StoredPushSubscription[] = [];

  if (Array.isArray(userData.pushSubscriptions)) {
    userData.pushSubscriptions.forEach((item) => {
      if (isStoredPushSubscription(item)) normalized.push(item);
    });
  }

  if (isStoredPushSubscription(userData.pushSubscription)) {
    normalized.push(userData.pushSubscription);
  }

  return dedupeByEndpoint(normalized);
}

export function upsertPushSubscription(
  existing: StoredPushSubscription[],
  incoming: StoredPushSubscription
): StoredPushSubscription[] {
  return dedupeByEndpoint([...existing, incoming]);
}

export function shouldRemoveSubscriptionOnError(error: unknown): boolean {
  if (!isObject(error)) return false;
  const statusCode = error.statusCode;
  return statusCode === 404 || statusCode === 410;
}

