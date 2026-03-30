type RateLimitRecord = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitRecord>();

function getRecord(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const record = {
      count: 1,
      resetAt: now + windowMs
    };
    buckets.set(key, record);
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: record.resetAt
    };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: limit - existing.count,
    resetAt: existing.resetAt
  };
}

export function checkRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  return getRecord(input.key, input.limit, input.windowMs);
}

export function getRequestIdentifier(headersLike: Headers, fallback = "anonymous") {
  const forwardedFor = headersLike.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || fallback;
  }

  return headersLike.get("x-real-ip") || fallback;
}
