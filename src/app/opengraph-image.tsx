import { ImageResponse } from "next/og";
import { loadOgFont } from "@/lib/ogFont";
import { JOYSEE_LOGO_DATA_URI } from "@/lib/logoDataUri";

export const runtime = "edge";
export const alt = "七夕理想型世界盃";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Home / root share thumbnail (what people see when the main link is shared).
export default async function HomeOgImage() {
  const usedText = "想找人一起過七夕嗎理想型世界盃從上百個條件淘汰到底測出你最在意什麼貼出來讓符合的人自己來找你";
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
        <div style={{ fontSize: 26, letterSpacing: 8, color: "#7FE3C4", display: "flex" }}>想找人一起過七夕嗎</div>
        <div style={{ fontSize: 104, fontWeight: 900, display: "flex", marginTop: 6, color: "#E8C468" }}>
          理想型世界盃
        </div>
        <div style={{ fontSize: 30, opacity: 0.85, display: "flex", marginTop: 18, textAlign: "center", maxWidth: 900 }}>
          從上百個條件淘汰到底，測出你最在意什麼
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={JOYSEE_LOGO_DATA_URI} width={150} height={84} style={{ position: "absolute", bottom: 40 }} alt="" />
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined, headers: { "Cache-Control": "public, max-age=3600" } },
  );
}
