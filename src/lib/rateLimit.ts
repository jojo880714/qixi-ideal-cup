import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const WINDOW = "60 s";
const MAX_REQUESTS = 5;

let cachedLimiter: Ratelimit | null | undefined;

/**
 * Builds (once) the Upstash-backed limiter if UPSTASH_REDIS_REST_URL/TOKEN
 * are configured. Returns null if not configured, so callers can fall back.
 */
function getUpstashLimiter(): Ratelimit | null {
  if (cachedLimiter !== undefined) return cachedLimiter;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    cachedLimiter = null;
    return cachedLimiter;
  }

  cachedLimiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(MAX_REQUESTS, WINDOW),
    prefix: "qixi-ideal-cup",
    analytics: false,
  });
  return cachedLimiter;
}

// Dev-only fallback. Each serverless instance has its own memory, and
// instances are recycled constantly on Vercel — this does NOT throttle
// anything in production. It exists purely so local development works
// without an Upstash account. Production MUST set the Upstash env vars.
const memoryHits = new Map<string, number[]>();
const MEMORY_WINDOW_MS = 60_000;

function memoryRateLimit(key: string): { success: boolean } {
  const now = Date.now();
  const hits = (memoryHits.get(key) ?? []).filter((t) => now - t < MEMORY_WINDOW_MS);
  hits.push(now);
  memoryHits.set(key, hits);
  return { success: hits.length <= MAX_REQUESTS };
}

let warnedNoUpstash = false;

/**
 * Checks whether `identifier` (typically the client IP) is within the
 * allowed write rate: MAX_REQUESTS per WINDOW. Backed by Upstash Redis in
 * any environment where it's configured; falls back to an in-memory (dev
 * only) limiter otherwise.
 */
export async function checkRateLimit(identifier: string): Promise<{ success: boolean }> {
  const limiter = getUpstashLimiter();
  if (limiter) {
    const { success } = await limiter.limit(identifier);
    return { success };
  }

  if (!warnedNoUpstash) {
    warnedNoUpstash = true;
    console.warn(
      "[rateLimit] UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN not set — using an " +
        "in-memory fallback limiter. This does NOT protect production traffic (每個 " +
        "serverless instance 各自計數，重啟即歸零). Configure Upstash before launch.",
    );
  }
  return memoryRateLimit(identifier);
}

/** Extracts the best-effort client IP from standard proxy headers (Vercel sets x-forwarded-for). */
export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}
