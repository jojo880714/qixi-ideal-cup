import { NextResponse } from "next/server";
import { getSupabaseAnonClient } from "@/lib/supabase/client";
import { resolveTraitTitle } from "@/lib/results";
import type { PersonaDistributionRow, TraitStatsRow } from "@/lib/supabase/types";

export const runtime = "nodejs";
// Queries live Supabase data — never statically prerender it. Freshness is
// handled by the Cache-Control header below.
export const dynamic = "force-dynamic";

export async function GET() {
  // The two aggregate views are granted to `anon` (they expose only counts,
  // never rows — see supabase/schema.sql), so the public anon key is enough
  // and no service-role key is needed. Individual result rows remain
  // unreadable by anon.
  const supabase = getSupabaseAnonClient();

  const [personaRes, traitRes] = await Promise.all([
    supabase.from("persona_distribution").select("*"),
    supabase.from("trait_stats").select("*"),
  ]);

  if (personaRes.error || traitRes.error) {
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }

  const personaDistribution = (personaRes.data ?? []) as PersonaDistributionRow[];
  const traitStats = (traitRes.data ?? []) as TraitStatsRow[];

  return NextResponse.json(
    {
      personaDistribution,
      traitStats: traitStats.map((row) => ({
        ...row,
        title: resolveTraitTitle(row.trait_id),
      })),
    },
    // Aggregate stats drift slowly (used for "全站最多人選的條件" content,
    // not a live counter) — a 5-minute edge cache cuts function invocations
    // for this route to near zero without the numbers ever looking stale.
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } },
  );
}
