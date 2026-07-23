import { ImageResponse } from "next/og";
import { loadOgFont } from "@/lib/ogFont";
import { JOYSEE_LOGO_DATA_URI } from "@/lib/logoDataUri";
import { fetchPublicStats, factionName } from "@/lib/metrics";

export const runtime = "nodejs"; // fetchPublicStats uses the supabase client
export const alt = "七夕理想型世界盃 全站戰況";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 60;

export default async function WallOgImage() {
  const stats = await fetchPublicStats();
  const total = stats?.completions ?? 0;
  const top = stats?.persona_distribution?.[0];
  const topFaction = top ? factionName(top.persona_key) : "";

  const usedText = `已經人測出理想型七夕世界盃全站戰況最多人是${topFaction}換你也來測${total}`;
  const [regular, black] = await Promise.all([loadOgFont(usedText, 400), loadOgFont(usedText, 900)]);
  const fonts = [
    regular && { name: "Noto Sans TC", data: regular, weight: 400 as const, style: "normal" as const },
    black && { name: "Noto Sans TC", data: black, weight: 900 as const, style: "normal" as const },
  ].filter((f): f is NonNullable<typeof f> => Boolean(f));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #2A1650 0%, #170D2E 60%)",
          color: "#FFF6EC",
          fontFamily: fonts.length ? "Noto Sans TC" : undefined,
          position: "relative",
        }}
      >
        <div style={{ fontSize: 26, letterSpacing: 8, color: "#7FE3C4", display: "flex" }}>七夕 · 全站戰況</div>
        <div style={{ display: "flex", alignItems: "baseline", marginTop: 10 }}>
          <div style={{ fontSize: 150, fontWeight: 900, display: "flex", color: "#E8C468" }}>
            {total.toLocaleString("en-US")}
          </div>
          <div style={{ fontSize: 40, display: "flex", marginLeft: 12 }}>人已測出理想型</div>
        </div>
        {top && (
          <div style={{ fontSize: 34, opacity: 0.9, display: "flex", marginTop: 10 }}>
            目前最多人是「{topFaction}」
          </div>
        )}
        <div style={{ fontSize: 26, opacity: 0.7, display: "flex", marginTop: 22 }}>換你也來測 →</div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={JOYSEE_LOGO_DATA_URI} width={150} height={84} style={{ position: "absolute", bottom: 40 }} alt="" />
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined, headers: { "Cache-Control": "public, max-age=60" } },
  );
}
