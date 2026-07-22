import { getSupabaseAnonClient } from "./client";
import type { ResultRow } from "./types";

/**
 * Fetches a single result by id through the get_result_by_id RPC (see
 * supabase/schema.sql) — the only read path anon has, and it can't be used
 * to list rows since it always requires an exact id.
 */
export async function fetchResultById(id: string): Promise<ResultRow | null> {
  const supabase = getSupabaseAnonClient();
  const { data, error } = await supabase.rpc("get_result_by_id", { p_id: id });
  if (error || !data) return null;
  const row = Array.isArray(data) ? data[0] : data;
  return (row ?? null) as ResultRow | null;
}
