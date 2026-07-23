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

async function supabaseRateLimit(identifier: string): Promise<{ success: boolean }> {
  const supabase = getSupabaseAnonClient();
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_ip: identifier,
    p_max: MAX_REQUESTS,
    p_window_seconds: WINDOW_SECONDS,
  });
  // Fail open on infrastructure error: a transient DB hiccup must not block
  // legitimate completions. Abuse is still bounded by the in-memory guard
  // that runs in the same instance for the current window.
  if (error) {
    console.error("[rateLimit] supabase check_rate_limit failed, failing open:", error.message);
    return memoryRateLimit(identifier);
  }
  return { success: data === true };
}

/* -------------------- In-memory (last-resort / local dev) -------------------- */

const memoryHits = new Map<string, number[]>();

function memoryRateLimit(key: string): { success: boolean } {
  const now = Date.now();
  const hits = (memoryHits.get(key) ?? []).filter((t) => now - t < WINDOW_SECONDS * 1000);
  hits.push(now);
  memoryHits.set(key, hits);
  return { success: hits.length <= MAX_REQUESTS };
}

/**
 * Checks whether `identifier` (client IP) is within the allowed write rate:
 * MAX_REQUESTS per WINDOW_SECONDS. Backend priority:
 *   1. Upstash Redis, if configured (UPSTASH_REDIS_REST_URL/TOKEN)
 *   2. Supabase Postgres (default here — distributed, no extra account)
 *   3. In-memory (local dev only; per-instance, not for production)
 */
export async function checkRateLimit(identifier: string): Promise<{ success: boolean }> {
  const upstash = getUpstashLimiter();
  if (upstash) {
    const { success } = await upstash.limit(identifier);
    return { success };
  }
  if (supabaseConfigured()) {
    return supabaseRateLimit(identifier);
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
