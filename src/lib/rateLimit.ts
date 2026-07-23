import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getSupabaseAnonClient } from "@/lib/supabase/client";

const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 5;

/* -------------------- Upstash (optional, highest priority) -------------------- */

let cachedLimiter: Ratelimit | null | undefined;

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
    limiter: Ratelimit.slidingWindow(MAX_REQUESTS, `${WINDOW_SECONDS} s`),
    prefix: "qixi-ideal-cup",
    analytics: false,
  });
  return cachedLimiter;
}

/* -------------------- Supabase-backed (default in this deployment) -------------------- */

// Distributed fixed-window limiter backed by the same Supabase Postgres the
// app already uses (see check_rate_limit() in supabase/schema.sql). Shared
// across all serverless instances, so it actually throttles in production —
// no separate Redis/Upstash account required. anon can only reach the
// counter through the SECURITY DEFINER function, never the table directly.
function supabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

async function supabaseRateLimit(
  identifier: string,
  max: number,
  windowSeconds: number,
): Promise<{ success: boolean }> {
  const supabase = getSupabaseAnonClient();
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_ip: identifier,
    p_max: max,
    p_window_seconds: windowSeconds,
  });
  // Fail open on infrastructure error: a transient DB hiccup must not block
  // legitimate completions. Abuse is still bounded by the in-memory guard
  // that runs in the same instance for the current window.
  if (error) {
    console.error("[rateLimit] supabase check_rate_limit failed, failing open:", error.message);
    return memoryRateLimit(identifier, max, windowSeconds);
  }
  return { success: data === true };
}

/* -------------------- In-memory (last-resort / local dev) -------------------- */

const memoryHits = new Map<string, number[]>();

function memoryRateLimit(key: string, max: number, windowSeconds: number): { success: boolean } {
  const now = Date.now();
  const hits = (memoryHits.get(key) ?? []).filter((t) => now - t < windowSeconds * 1000);
  hits.push(now);
  memoryHits.set(key, hits);
  return { success: hits.length <= max };
}

/**
 * Generic per-identifier limiter. Backend priority:
 *   1. Upstash Redis, if configured (only used for the default write limit)
 *   2. Supabase Postgres (default here — distributed, no extra account)
 *   3. In-memory (local dev only; per-instance, not for production)
 */
export async function checkRateLimitN(
  identifier: string,
  max: number,
  windowSeconds: number,
): Promise<{ success: boolean }> {
  // Upstash limiter is preconfigured for the write limit only; for custom
  // limits (e.g. the lenient tracking limit) use Supabase / memory directly.
  if (max === MAX_REQUESTS && windowSeconds === WINDOW_SECONDS) {
    const upstash = getUpstashLimiter();
    if (upstash) {
      const { success } = await upstash.limit(identifier);
      return { success };
    }
  }
  if (supabaseConfigured()) {
    const key = `${identifier}:${max}:${windowSeconds}`;
    return supabaseRateLimit(key, max, windowSeconds);
  }
  return memoryRateLimit(identifier, max, windowSeconds);
}

/** Write-endpoint limit: MAX_REQUESTS per WINDOW_SECONDS (used by /api/results). */
export async function checkRateLimit(identifier: string): Promise<{ success: boolean }> {
  return checkRateLimitN(identifier, MAX_REQUESTS, WINDOW_SECONDS);
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
