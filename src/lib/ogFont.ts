const FONT_FAMILY = "Noto+Sans+TC";

/**
 * Loads a Chinese-glyph subset of Noto Sans TC from Google Fonts, scoped to
 * only the characters an OG image needs (`text=`) so the payload stays small.
 * Standard pattern for CJK text in next/og (satori has no CJK system fallback).
 */
export async function loadOgFont(text: string, weight: 400 | 700 | 900): Promise<ArrayBuffer | null> {
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
