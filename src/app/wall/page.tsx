import type { Metadata } from "next";
import { conditionTitle, factionName, fetchPublicStats, personaName } from "@/lib/metrics";
import { getSiteUrl } from "@/lib/siteUrl";
import { StarField } from "@/components/StarField";
import { BrandFooter } from "@/components/BrandFooter";
import { WallShareButton } from "@/components/WallShareButton";

// Aggregate numbers drift slowly; cache 60s at the edge.
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const stats = await fetchPublicStats();
  const top = stats?.persona_distribution?.[0];
  const total = stats?.completions ?? 0;
  const title =
    total > 0 && top
      ? `已經 ${total} 人測出理想型｜最多人是「${factionName(top.persona_key)}」`
      : "七夕理想型世界盃｜全站戰況";
  const description = "看看大家最在意什麼理想型條件——換你也來測，貼出來讓符合的人自己來找你。";
  const url = `${getSiteUrl()}/wall`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function WallPage() {
  const stats = await fetchPublicStats();
  const total = stats?.completions ?? 0;
  const dist = stats?.persona_distribution ?? [];
  const top = dist[0];
  const conditions = stats?.top_conditions ?? [];

  return (
    <div className="wrap">
      <StarField />
      <section className="screen" style={{ paddingTop: 8 }}>
        <p className="eyebrow">七 夕 · 全 站 戰 況</p>
        <h1 style={{ fontSize: "clamp(28px,7vw,38px)" }}>大家的理想型</h1>

        <div className="wall-hero">
          <div className="wall-big">{total.toLocaleString("en-US")}</div>
          <div className="wall-big-label">人已經測出自己的天字第一號條件</div>
          {top && (
            <div className="wall-top">
              目前最多人是{" "}
              <b>
                {personaName(top.persona_key)}（{factionName(top.persona_key)}）
              </b>
            </div>
          )}
        </div>

        {dist.length > 0 && (
          <div className="wall-panel">
            <h4>八型人格分布</h4>
            {dist.map((p) => (
              <div key={p.persona_key} className="wall-row">
                <span className="wall-row-label">{factionName(p.persona_key)}</span>
                <span className="wall-bar">
                  <i style={{ width: `${Math.max(4, p.pct)}%` }} />
                </span>
                <span className="wall-row-val">
                  {p.total}
                  <span style={{ opacity: 0.6 }}>｜{p.pct}%</span>
                </span>
              </div>
            ))}
          </div>
        )}

        {conditions.length > 0 && (
          <div className="wall-panel">
            <h4>最夯「天字第一號條件」Top 5</h4>
            {conditions.map((c, i) => (
              <div key={c.trait_id} className="wall-cond">
                <span>
                  <span style={{ opacity: 0.5 }}>{i + 1}.</span> {conditionTitle(c.trait_id)}
                </span>
                <b>{c.wins}</b>
              </div>
            ))}
          </div>
        )}

        {total === 0 && (
          <p className="pick-hint" style={{ marginTop: 20 }}>
            還沒有人完測——當第一個！
          </p>
        )}

        <div className="actions" style={{ marginTop: 20 }}>
          <a className="primary" href="/" style={{ textAlign: "center", display: "block" }}>
            🏆 換我也來測一次
          </a>
          <WallShareButton />
        </div>
        <BrandFooter />
      </section>
    </div>
  );
}
