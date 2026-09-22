// Best-effort, dependency-free rate limiter. In-memory, so it only
// protects a single running Node process - on a multi-instance/
// serverless deployment (multiple Lambda/edge instances), each
// instance has its own counters, so the *effective* limit is
// (perInstanceLimit x instanceCount), not a hard global cap. That's an
// acceptable trade-off for slowing down card-testing/abuse without
// adding an external dependency (Redis/Upstash) that this project
// doesn't otherwise need - swap this for a shared store if the
// deployment target has multiple concurrent instances and a hard cap
// is required.
interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Opportunistic cleanup on every call instead of a timer - this module
// has no long-lived background process to hang one off of, and the
// bucket count is naturally bounded by how many distinct keys are
// actively hitting the limiter.
function evictExpired(now: number) {
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(key);
  }
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  if (buckets.size > 5000) evictExpired(now);

  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}
