import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/**
 * Anon-key Supabase client. Safe to use anywhere (browser or server) — the
 * anon key is public by design and every table access it can make is
 * constrained by RLS (see supabase/schema.sql: insert-only on `results`,
 * reads only via the get_result_by_id RPC).
 */
export function getSupabaseAnonClient(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  cached = createClient(url, anonKey, { auth: { persistSession: false } });
  return cached;
}
