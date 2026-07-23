import type { Persona } from "@/data/personas";
import { Seal } from "./Seal";

export interface PosterCardProps {
  persona: Persona;
  nickname: string;
  mode: 64 | 128;
  championTitle: string;
  finalFourTitles: string[];
  dateFaction: string;
  friendFaction: string;
}

/**
 * Off-screen DOM used to generate the downloadable poster via html-to-image.
 * Pure flexbox + `gap` layout at IG-Story width (1080) — CSS handles all
 * spacing, so unlike the old hand-computed canvas it can never overlap /
 * 跑版, and it stays a faithful, larger render of the on-screen result card.
 * Inline styles only (no dependency on external CSS being inlined by the
 * capture). Includes the Joysee logo.
 */
export function PosterCard(props: PosterCardProps) {
  const { persona, nickname, mode, championTitle, finalFourTitles, dateFaction, friendFaction } = props;
  const { bg, ink, frame } = persona;

  const serif = "'Noto Serif TC', serif";
  const box: React.CSSProperties = {
    background: "rgba(255,255,255,0.55)",
    borderRadius: 24,
    padding: "30px 34px",
    boxSizing: "border-box",
  };
  const matchBox: React.CSSProperties = { ...box, flex: 1, textAlign: "center", padding: "26px 20px" };
  const boxLabel: React.CSSProperties = { fontSize: 25, letterSpacing: "0.1em", opacity: 0.62 };

  return (
    <div
      style={{
        width: 1080,
        minHeight: 1920,
        boxSizing: "border-box",
        background: "radial-gradient(1200px 900px at 50% -8%, #2A1650, #170D2E 62%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "96px 46px",
        fontFamily: "'Noto Sans TC', system-ui, sans-serif",
        color: ink,
      }}
    >
      {/* result card */}
      <div
        style={{
          width: "100%",
          background: bg,
          borderRadius: 40,
          padding: 52,
          boxSizing: "border-box",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: 28,
        }}
      >
        <Seal
          seal={persona.seal}
          color={ink}
          size={118}
          variant="stamp"
          style={{ position: "absolute", top: 44, right: 48, transform: "rotate(-8deg)", opacity: 0.9 }}
        />

        {/* header */}
        <div>
          <div style={{ fontSize: 30, fontWeight: 700, opacity: 0.85 }}>你是</div>
          <div
            style={{
              fontFamily: serif,
              fontWeight: 900,
              fontSize: Array.from(persona.name).length <= 6 ? 84 : 72,
              lineHeight: 1.15,
              marginTop: 6,
            }}
          >
            {persona.name}
          </div>
          <div style={{ fontSize: 28, opacity: 0.72, marginTop: 14 }}>
            @{nickname}｜七夕理想型世界盃 {mode} 強
          </div>
        </div>

        {/* 口頭禪 */}
        <div style={box}>
          <div style={{ ...boxLabel, marginBottom: 16 }}>口頭禪</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {persona.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  background: "rgba(255,255,255,0.72)",
                  borderRadius: 999,
                  padding: "10px 22px",
                  fontSize: 28,
                  fontWeight: 500,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* 描述 */}
        <div style={box}>
          <div style={{ fontSize: 33, lineHeight: 1.78, textAlign: "justify" }}>{persona.desc}</div>
        </div>

        {/* 天字第一號條件 */}
        <div style={{ ...box, border: `4px solid ${frame}` }}>
          <div style={boxLabel}>天字第一號條件</div>
          <div style={{ fontFamily: serif, fontWeight: 800, fontSize: 52, lineHeight: 1.4, marginTop: 10 }}>
            「{championTitle}」
          </div>
          <div style={{ fontSize: 27, opacity: 0.82, lineHeight: 1.7, marginTop: 14 }}>
            四強：{finalFourTitles.join("｜")}
          </div>
        </div>

        {/* 適合交往 / 適合交友 */}
        <div style={{ display: "flex", gap: 20 }}>
          <div style={matchBox}>
            <div style={boxLabel}>適合交往</div>
            <div style={{ fontFamily: serif, fontWeight: 800, fontSize: 38, marginTop: 8 }}>{dateFaction}</div>
          </div>
          <div style={matchBox}>
            <div style={boxLabel}>適合交友</div>
            <div style={{ fontFamily: serif, fontWeight: 800, fontSize: 38, marginTop: 8 }}>{friendFaction}</div>
          </div>
        </div>

        {/* CTA line */}
        <div style={{ textAlign: "center", fontSize: 32, fontWeight: 700, marginTop: 4 }}>
          符合的請在留言區報到 🙋 你的又是哪型？
        </div>
      </div>

      {/* Joysee logo on the night bg, below the card */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/joysee-logo.png" alt="Joysee Travel.tw" style={{ height: 96, marginTop: 60, display: "block" }} />
    </div>
  );
}
