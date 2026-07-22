import type { FactionKey } from "@/data/traits";

/** Mirrors supabase/schema.sql: public.results / get_result_by_id(). */
export interface ResultRow {
  id: string;
  mode: 64 | 128;
  persona_key: FactionKey;
  champion_id: string;
  final_four_ids: string[];
  nickname: string;
  created_at: string;
}

/** Mirrors supabase/schema.sql: public.persona_distribution view. */
export interface PersonaDistributionRow {
  persona_key: FactionKey;
  total: number;
  pct: number;
}

/** Mirrors supabase/schema.sql: public.trait_stats view. */
export interface TraitStatsRow {
  trait_id: string;
  champion_count: number;
  final_four_count: number;
  total_games: number;
  champion_rate_pct: number;
  final_four_rate_pct: number;
}
