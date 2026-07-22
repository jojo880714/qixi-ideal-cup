import { ImageResponse } from "next/og";
import { PERSONAS } from "@/data/personas";
import { resolveTraitTitle } from "@/lib/results";
import { fetchResultById } from "@/lib/supabase/getResult";

export const runtime = "edge";
export const alt = "七夕理想型世界盃 結果卡";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FONT_FAMILY = "Noto+Sans+TC";

/**
 * Loads a Chinese-glyph subset of Noto Sans TC from Google Fonts, scoped to
 * only the characters this specific image needs (`text=`) so the payload
 * stays small. Requires outbound network access at request time — this is
 * the standard pattern for CJK text in @vercel/og / next/og, since satori
 * has no system-font fallback for non-Latin scripts.
 */
async function loadGoogleFont(text: string, weight: 400 | 700): Promise<ArrayBuffer | null> {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${FONT_FAMILY}:wght@${weight}&text=${encodeURIComponent(text)}`;
    const css = await fetch(cssUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
    }).then((r) => r.text());
    const match = css.match(/src: url\(([^)]+)\) format\('(?:opentype|truetype|woff2?)'\)/);
    if (!match) return null;
    const res = await fetch(match[1]!);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

export default async function OgImage({ params }: { params: { id: string } }) {
  const row = await fetchResultById(params.id);

  if (!row) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#170D2E",
            color: "#FFF6EC",
            fontSize: 48,
          }}
        >
          七夕理想型世界盃
        </div>
      ),
      { ...size },
    );
  }

  const persona = PERSONAS[row.persona_key];
  const championTitle = resolveTraitTitle(row.champion_id);
  const usedText = `你是${persona.name}@${row.nickname}｜${persona.faction}｜七夕理想型世界盃${row.mode}強天字第一號條件「${championTitle}」符合的請在留言區報到🙋`;

  const [regular, bold] = await Promise.all([loadGoogleFont(usedText, 400), loadGoogleFont(usedText, 700)]);
  const fonts = [
    regular && { name: "Noto Sans TC", data: regular, weight: 400 as const, style: "normal" as const },
    bold && { name: "Noto Sans TC", data: bold, weight: 700 as const, style: "normal" as const },
  ].filter((f): f is NonNullable<typeof f> => Boolean(f));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 70px",
          background: persona.bg,
          color: persona.ink,
          fontFamily: fonts.length > 0 ? "Noto Sans TC" : undefined,
        }}
      >
        <div style={{ fontSize: 28, opacity: 0.75, display: "flex" }}>你是</div>
        <div style={{ fontSize: 64, fontWeight: 700, display: "flex", marginTop: 4 }}>{persona.name}</div>
        <div style={{ fontSize: 24, opacity: 0.75, marginTop: 12, display: "flex" }}>
          @{row.nickname}｜{persona.faction}｜七夕理想型世界盃 {row.mode} 強
        </div>
        <div
          style={{
            marginTop: 32,
            padding: "20px 26px",
            background: "rgba(255,255,255,0.55)",
            borderRadius: 20,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ fontSize: 22, opacity: 0.7, display: "flex" }}>天字第一號條件</div>
          <div style={{ fontSize: 40, fontWeight: 700, marginTop: 8, display: "flex" }}>「{championTitle}」</div>
        </div>
        <div style={{ fontSize: 24, marginTop: 28, opacity: 0.85, display: "flex" }}>符合的請在留言區報到 🙋</div>
      </div>
    ),
    {
      ...size,
      fonts: fonts.length > 0 ? fonts : undefined,
    },
  );
}
