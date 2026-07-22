import { NextResponse } from "next/server";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { resolveTraitTitle } from "@/lib/results";
import type { PersonaDistributionRow, TraitStatsRow } from "@/lib/supabase/types";

export const runtime = "nodejs";
// This queries live Supabase data via the service-role key — never
// statically prerender it. Freshness is handled by the Cache-Control
// header below instead of Next's build-time ISR.
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseServiceRoleClient();

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
