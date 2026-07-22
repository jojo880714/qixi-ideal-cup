"use client";

import { useState } from "react";
import { NICKNAME_MAX_LENGTH, sanitizeNickname } from "@/lib/sanitize";
import type { Mode } from "@/lib/engine";

export function HomeScreen({ onStart }: { onStart: (mode: Mode, nickname: string) => void }) {
  const [nickname, setNickname] = useState("");

  return (
    <section className="screen" id="home">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <p className="eyebrow">七 夕 單 身 限 定</p>
        <h1>理想型世界盃</h1>
        <p className="sub">
          別人過七夕，我們選標準。
          <br />
          從上百個理想型條件一路淘汰到底，
          <br />
          測出你的單身人格——貼出來，
          <br />
          讓符合的人自己報到。
        </p>
        <label className="fieldlabel" htmlFor="nickname">
          你的暱稱（會印在結果卡上）
        </label>
        <input
          id="nickname"
          maxLength={NICKNAME_MAX_LENGTH * 2}
          placeholder="例如：週五夜的孤獨美食家"
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
    </section>
  );
}
