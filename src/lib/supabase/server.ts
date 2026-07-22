import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/**
 * Service-role Supabase client — bypasses RLS entirely. Import this ONLY
 * from server-only code (app/api/** route handlers). The `server-only`
 * import makes any accidental client-bundle inclusion a build-time error.
 * Currently used exclusively by app/api/stats to read the aggregate views,
 * which are intentionally never granted to the anon role.
 */
export function getSupabaseServiceRoleClient(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  }
  cached = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
  return cached;
}
