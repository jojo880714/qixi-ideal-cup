import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PERSONAS } from "@/data/personas";
import { resolveTraitTitle } from "@/lib/results";
import { fetchResultById } from "@/lib/supabase/getResult";
import { ResultCard } from "@/components/ResultCard";
import { ResultRevisitTracker } from "@/components/ResultRevisitTracker";
import { StarField } from "@/components/StarField";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const row = await fetchResultById(params.id);
  if (!row) return { title: "找不到這個結果｜七夕理想型世界盃" };

  const persona = PERSONAS[row.persona_key];
  const title = `${row.nickname} 是「${persona.name}」｜七夕理想型世界盃`;
  const description = `天字第一號條件：「${resolveTraitTitle(row.champion_id)}」——符合的請在留言區報到 🙋`;

  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ResultPage({ params }: Props) {
  const row = await fetchResultById(params.id);
  if (!row) notFound();

  const persona = PERSONAS[row.persona_key];
  const championTitle = resolveTraitTitle(row.champion_id);
  const finalFourTitles = row.final_four_ids.map(resolveTraitTitle);

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
        </div>
      </section>
    </div>
  );
}
