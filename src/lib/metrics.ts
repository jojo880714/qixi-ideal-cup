import { getSupabaseAnonClient } from "@/lib/supabase/client";
import { resolveTraitTitle } from "@/lib/results";
import { PERSONAS } from "@/data/personas";
import type { FactionKey } from "@/data/traits";

export interface PersonaRow {
  persona_key: FactionKey;
  total: number;
  pct: number;
}
export interface ConditionRow {
  trait_id: string;
  wins: number;
}
export interface DailyRow {
  day: string;
  visitors: number;
  completions: number;
}

export interface AdminMetrics {
  views: number;
  unique_visitors: number;
  starts: number;
  completions: number;
  signup_clicks: number;
  poster_downloads: number;
  share_copies: number;
  revisits: number;
  result_views: number;
  completion_rate_visitor: number | null;
  completion_rate_start: number | null;
  signup_ctr: number | null;
  persona_distribution: PersonaRow[];
  mode_split: Record<string, number>;
  top_conditions: ConditionRow[];
  daily: DailyRow[];
}

export interface PublicStats {
  completions: number;
  persona_distribution: PersonaRow[];
  top_conditions: ConditionRow[];
}

/** Fetches the key-gated admin metrics. Returns null if the key is wrong or Supabase is unavailable. */
export async function fetchAdminMetrics(key: string): Promise<AdminMetrics | null> {
  try {
    const supabase = getSupabaseAnonClient();
    const { data, error } = await supabase.rpc("admin_metrics", { p_key: key });
    if (error || !data) return null;
    return data as AdminMetrics;
  } catch {
    // e.g. env not configured during build-time prerender
    return null;
  }
}

export async function fetchPublicStats(): Promise<PublicStats | null> {
  try {
    const supabase = getSupabaseAnonClient();
    const { data, error } = await supabase.rpc("public_stats");
    if (error || !data) return null;
    return data as PublicStats;
  } catch {
    return null;
  }
}

export function personaName(key: string): string {
  return PERSONAS[key as FactionKey]?.name ?? key;
}
export function factionName(key: string): string {
  return PERSONAS[key as FactionKey]?.faction ?? key;
}
export function conditionTitle(traitId: string): string {
  return resolveTraitTitle(traitId);
}
