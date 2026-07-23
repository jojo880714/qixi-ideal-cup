"use client";

import { useState } from "react";
import { NICKNAME_MAX_LENGTH, sanitizeNickname } from "@/lib/sanitize";
import type { Mode } from "@/lib/engine";
import { BrandFooter } from "./BrandFooter";

export function HomeScreen({ onStart }: { onStart: (mode: Mode, nickname: string) => void }) {
  const [nickname, setNickname] = useState("");

  return (
    <section className="screen" id="home">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <p className="eyebrow">想找人一起過七夕嗎</p>
        <h1>理想型世界盃</h1>
        <p className="sub">
          不擔心沒人過七夕，現在就決定理想型！
          <br />
          從上百個理想型條件一路淘汰到底，
          <br />
          測出你最在意什麼——貼出來，
          <br />
          讓符合的人自己來找你。
        </p>
        <label className="fieldlabel" htmlFor="nickname">
          你的暱稱（會印在結果卡上）
        </label>
        <input
          id="nickname"
          maxLength={NICKNAME_MAX_LENGTH * 2}
          placeholder="請輸入你的暱稱"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
        <div className="modes">
          <button className="mode-btn" onClick={() => onStart(64, sanitizeNickname(nickname))}>
            <b>🏆 標準賽・64 強</b>
            <span>初賽分組 → 分區決賽 → 冠軍戰，約 5 分鐘</span>
          </button>
          <button className="mode-btn" onClick={() => onStart(128, sanitizeNickname(nickname))}>
            <b>🔥 地獄賽・128 強</b>
            <span>128 個條件全上，測得最深，約 10 分鐘</span>
          </button>
        </div>
      </div>
      <BrandFooter />
    </section>
  );
}
