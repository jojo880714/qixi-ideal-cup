import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PERSONAS } from "@/data/personas";
import { resolveTraitTitle } from "@/lib/results";
import { getResultUrl, getSignupUrl } from "@/lib/siteUrl";
import { fetchResultById } from "@/lib/supabase/getResult";
import { ResultCard } from "@/components/ResultCard";
import { ResultRevisitTracker } from "@/components/ResultRevisitTracker";
import { BrandFooter } from "@/components/BrandFooter";
import { StarField } from "@/components/StarField";

interface Props {
  params: { id: string };
}

// `results` rows are insert-only and never updated, so a given id's page
// never changes once created. Cache it (Vercel's ISR/Data Cache) for 30
// days instead of re-invoking this function and re-querying Supabase on
// every visit — this is the highest-traffic page after "/", since it's
// exactly what gets opened from shared links. Kept finite (not `false`)
// rather than a full year, as a smaller blast radius in case a result is
// ever fetched before its write is visible.
export const revalidate = 2592000; // 30 days
export const dynamicParams = true;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const row = await fetchResultById(params.id);
  if (!row) return { title: "找不到這個結果｜七夕理想型世界盃" };

  const persona = PERSONAS[row.persona_key];
  const title = `${row.nickname} 是「${persona.name}」｜七夕理想型世界盃`;
  const description = `天字第一號條件：「${resolveTraitTitle(row.champion_id)}」——符合的請在留言區報到 🙋`;
  const url = getResultUrl(params.id);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ResultPage({ params }: Props) {
  const row = await fetchResultById(params.id);
  if (!row) notFound();

  const persona = PERSONAS[row.persona_key];
  const championTitle = resolveTraitTitle(row.champion_id);
  const finalFourTitles = row.final_four_ids.map(resolveTraitTitle);
  const signupUrl = getSignupUrl();

  return (
    <div className="wrap">
      <StarField />
      <ResultRevisitTracker personaKey={row.persona_key} />
      <section className="screen" id="result">
        <ResultCard
          persona={persona}
          nickname={row.nickname}
          mode={row.mode}
          championTitle={championTitle}
          finalFourTitles={finalFourTitles}
          dateFaction={PERSONAS[persona.date].faction}
          friendFaction={PERSONAS[persona.friend].faction}
        />
        <div className="actions">
          <a className="primary" href="/" style={{ textAlign: "center", display: "block" }}>
            🏆 換我也來測一次
          </a>
          {signupUrl && (
            <a className="cta-signup" href={signupUrl} target="_blank" rel="noopener noreferrer">
              🎋 報名實體聯誼活動
            </a>
          )}
        </div>
        <BrandFooter />
      </section>
    </div>
  );
}
