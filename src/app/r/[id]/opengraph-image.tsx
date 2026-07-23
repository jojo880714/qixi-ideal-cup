import { ImageResponse } from "next/og";
import { PERSONAS } from "@/data/personas";
import { resolveTraitTitle } from "@/lib/results";
import { fetchResultById } from "@/lib/supabase/getResult";
import { JOYSEE_LOGO_DATA_URI } from "@/lib/logoDataUri";

export const runtime = "edge";
export const alt = "七夕理想型世界盃 結果卡";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FONT_FAMILY = "Noto+Sans+TC";

// `results` rows are insert-only and never updated, so a found result's
// image never changes — cache it on Vercel's Edge Network (and any
// crawler/CDN that respects Cache-Control) for a year and skip
// re-fetching Supabase + Google Fonts on every share-preview hit. This is
// the single biggest usage-saving lever on this route: without it, every
// LINE/Facebook/Twitter link-preview crawler hit would re-run the edge
// function and re-fetch fonts.
const FOUND_CACHE_CONTROL = "public, immutable, max-age=31536000";
// An unknown/mistyped id gets a short cache instead of a permanent one, in
// case it's a very-recently-created id and this request raced ahead of it
// (belt-and-braces — Supabase reads are consistent, this is just a hedge).
const NOT_FOUND_CACHE_CONTROL = "public, max-age=60";

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
            // Mirrors --night / --milk in globals.css — satori can't read
            // CSS custom properties, so these are duplicated literals.
            // Update alongside globals.css until the design spec replaces
            // both.
            background: "#170D2E",
            color: "#FFF6EC",
            fontSize: 48,
          }}
        >
          七夕理想型世界盃
        </div>
      ),
      { ...size, headers: { "Cache-Control": NOT_FOUND_CACHE_CONTROL } },
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
          position: "relative",
          background: persona.bg,
          color: persona.ink,
          fontFamily: fonts.length > 0 ? "Noto Sans TC" : undefined,
        }}
      >
        {/* giant seal watermark, top-right bleed */}
        <svg
          width={420}
          height={420}
          viewBox="0 0 64 64"
          fill="none"
          style={{ position: "absolute", top: -70, right: -80, opacity: 0.13, transform: "rotate(-10deg)" }}
        >
          <path d={persona.seal.d1} stroke={persona.ink} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
          {persona.seal.d2 ? (
            <path d={persona.seal.d2} stroke={persona.ink} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
          ) : null}
        </svg>

        <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "56px 70px 20px" }}>
          <div style={{ fontSize: 28, opacity: 0.75, display: "flex", letterSpacing: 4 }}>你是</div>
          <div style={{ fontSize: 66, fontWeight: 700, display: "flex", marginTop: 4 }}>{persona.name}</div>
          <div style={{ fontSize: 24, opacity: 0.75, marginTop: 12, display: "flex" }}>
            @{row.nickname}｜{persona.faction}｜七夕理想型世界盃 {row.mode} 強
          </div>
          <div
            style={{
              marginTop: 26,
              padding: "22px 28px",
              background: "rgba(255,255,255,0.55)",
              border: `3px solid ${persona.frame}`,
              borderRadius: 22,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ fontSize: 22, opacity: 0.7, display: "flex" }}>天字第一號條件</div>
            <div style={{ fontSize: 44, fontWeight: 700, marginTop: 8, display: "flex" }}>「{championTitle}」</div>
          </div>
          <div style={{ fontSize: 24, marginTop: 22, opacity: 0.85, display: "flex" }}>符合的請在留言區報到 🙋</div>
        </div>

        {/* ink brand footer band with the real Joysee logo */}
        <div
          style={{
            height: 84,
            background: persona.ink,
            color: persona.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 70px",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={JOYSEE_LOGO_DATA_URI} width={132} height={74} alt="" />
          <div style={{ display: "flex", fontSize: 26, fontWeight: 700 }}>七夕理想型世界盃</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fonts.length > 0 ? fonts : undefined,
      headers: { "Cache-Control": FOUND_CACHE_CONTROL },
    },
  );
}
