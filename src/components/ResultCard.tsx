import type { Persona } from "@/data/personas";
import { Seal } from "./Seal";

export interface ResultCardProps {
  persona: Persona;
  nickname: string;
  mode: 64 | 128;
  championTitle: string;
  finalFourTitles: string[];
  dateFaction: string;
  friendFaction: string;
}

/** Presentational only — shared by the in-game result screen and the /r/[id] revisit page. */
export function ResultCard({
  persona,
  nickname,
  mode,
  championTitle,
  finalFourTitles,
  dateFaction,
  friendFaction,
}: ResultCardProps) {
  return (
    <div
      className="result-card"
      style={
        {
          background: persona.bg,
          color: persona.ink,
          ["--rc-frame" as string]: persona.frame,
        } as React.CSSProperties
      }
    >
      <Seal seal={persona.seal} color={persona.ink} size={58} variant="stamp" className="rc-seal" />
      <p className="rc-eyebrow">你是</p>
      <p className="rc-title">{persona.name}</p>
      <p className="rc-nick">
        @{nickname}｜七夕理想型世界盃 {mode} 強
      </p>
      <div className="rc-box">
        <h4>口頭禪</h4>
        <div className="rc-tags">
          {persona.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </div>
      <div className="rc-box">
        <p className="rc-desc">{persona.desc}</p>
      </div>
      <div className="rc-box rc-champ-box">
        <h4>天字第一號條件</h4>
        <p className="rc-champ">「{championTitle}」</p>
        <p className="rc-four">四強：{finalFourTitles.join("｜")}</p>
      </div>
      <div className="rc-match">
        <div className="rc-box">
          <h4>適合交往</h4>
          <b>{dateFaction}</b>
        </div>
        <div className="rc-box">
          <h4>適合交友</h4>
          <b>{friendFaction}</b>
        </div>
      </div>
      <p className="rc-footer">符合的請在留言區報到 🙋 你的又是哪型？</p>
    </div>
  );
}
