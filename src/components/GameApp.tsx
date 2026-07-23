"use client";

import { useEffect, useRef, useState } from "react";
import { TRAITS } from "@/data/traits";
import { PERSONAS } from "@/data/personas";
import {
  getGameResult,
  initGame,
  submitDuelPick,
  submitGroupPick,
  type GameState,
  type Mode,
} from "@/lib/engine";
import {
  trackPosterDownloaded,
  trackQuizCompleted,
  trackQuizStarted,
  trackShareTextCopied,
} from "@/lib/analytics";
import { buildShareText, downloadCanvasAsPng, drawPosterToCanvas, POSTER_HEIGHT, POSTER_WIDTH } from "@/lib/poster";
import { getSignupUrl } from "@/lib/siteUrl";
import { HomeScreen } from "./HomeScreen";
import { GroupScreen } from "./GroupScreen";
import { DuelScreen } from "./DuelScreen";
import { ChampionReveal } from "./ChampionReveal";
import { ResultCard } from "./ResultCard";
import { BrandFooter } from "./BrandFooter";
import { StarField } from "./StarField";

type SubmitStatus = "idle" | "submitting" | "done" | "error";

const SIGNUP_URL = getSignupUrl();

export function GameApp() {
  const [state, setState] = useState<GameState | null>(null);
  const [nickname, setNickname] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [resultId, setResultId] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  // 冠軍戰結束後先播「星等爆發」揭曉，再顯示結果卡。
  const [revealing, setRevealing] = useState(false);
  const posterCanvasRef = useRef<HTMLCanvasElement>(null);
  const submittedRef = useRef(false);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast((current) => (current === message ? null : current)), 2200);
  }

  function handleStart(mode: Mode, sanitizedNickname: string) {
    trackQuizStarted(mode);
    setNickname(sanitizedNickname);
    setResultId(null);
    setSubmitStatus("idle");
    setRevealing(false);
    submittedRef.current = false;
    setState(initGame(mode, TRAITS));
  }

  function handleGroupConfirm(selectedIndices: number[]) {
    if (!state) return;
    setState(submitGroupPick(state, selectedIndices));
  }

  function handleDuelPick(side: 0 | 1) {
    if (!state) return;
    const next = submitDuelPick(state, side);
    // 冠軍戰剛結束（進入 result phase）→ 先進揭曉動畫。
    if (next.phase === "result") setRevealing(true);
    setState(next);
  }

  const result = state?.phase === "result" ? getGameResult(state) : null;
  const persona = result ? PERSONAS[result.championKey] : null;

  // Submit the finished result once, draw the poster, and fire the completion event.
  useEffect(() => {
    if (!result || !persona || !state || submittedRef.current) return;
    submittedRef.current = true;

    trackQuizCompleted(state.mode, persona.key);

    if (posterCanvasRef.current) {
      drawPosterToCanvas(posterCanvasRef.current, {
        persona,
        nickname,
        mode: state.mode,
        championTitle: result.champion.title,
        finalFourTitles: result.finalFour.map((t) => t.title),
        dateFaction: PERSONAS[persona.date].faction,
        friendFaction: PERSONAS[persona.friend].faction,
      });
    }

    setSubmitStatus("submitting");
    fetch("/api/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: state.mode,
        championId: result.champion.id,
        finalFourIds: result.finalFour.map((t) => t.id),
        nickname,
      }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("submit failed");
        const data = (await res.json()) as { id: string };
        setResultId(data.id);
        setSubmitStatus("done");
      })
      .catch(() => {
        setSubmitStatus("error");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, persona, state, nickname]);

  function handleDownloadPoster() {
    if (!posterCanvasRef.current || !state || !persona) return;
    trackPosterDownloaded(state.mode, persona.key);
    downloadCanvasAsPng(posterCanvasRef.current, `七夕理想型世界盃_${nickname}.png`);
    showToast("人格卡已下載，貼出去等人報到 🙋");
  }

  function handleCopyShare() {
    if (!state || !persona || !result) return;
    trackShareTextCopied(state.mode, persona.key);
    const text = buildShareText({
      persona,
      nickname,
      mode: state.mode,
      championTitle: result.champion.title,
      finalFourTitles: result.finalFour.map((t) => t.title),
      dateFaction: PERSONAS[persona.date].faction,
      friendFaction: PERSONAS[persona.friend].faction,
      resultUrl: resultId ? `${window.location.origin}/r/${resultId}` : null,
    });
    navigator.clipboard
      .writeText(text)
      .then(() => showToast("文案已複製 ✓"))
      .catch(() => showToast("複製失敗，請手動選取"));
  }

  function handleRestart() {
    setState(null);
    setNickname("");
    setResultId(null);
    setSubmitStatus("idle");
    setRevealing(false);
    submittedRef.current = false;
  }

  const showResultCard = state?.phase === "result" && !revealing;

  return (
    <div className="wrap">
      <StarField />

      {!state && <HomeScreen onStart={handleStart} />}

      {state && state.phase === "group" && (
        <GroupScreen
          key={`${state.roundNumber}-${state.groupIdx}`}
          group={state.groupQueue[state.groupIdx]!}
          groupNumberInRound={state.groupIdx + 1}
          groupCountInRound={state.groupQueue.length}
          stepsDone={state.stepsDone}
          stepsTotal={state.stepsTotal}
          onConfirm={handleGroupConfirm}
          onOverPick={() => showToast(`只能選 ${state.groupQueue[state.groupIdx]!.pick} 個，先取消一個吧`)}
        />
      )}

      {state && state.phase === "duel" && (
        <DuelScreen
          key={`${state.duelStageIdx}-${state.duelIdx}`}
          pair={state.duels[state.duelIdx]!}
          stageIdx={state.duelStageIdx}
          duelNumberInStage={state.duelIdx + 1}
          duelCountInStage={state.duels.length}
          onPick={handleDuelPick}
        />
      )}

      {state && revealing && result && (
        <ChampionReveal championTitle={result.champion.title} onDone={() => setRevealing(false)} />
      )}

      {showResultCard && result && persona && (
        <section className="screen" id="result">
          <ResultCard
            persona={persona}
            nickname={nickname}
            mode={state.mode}
            championTitle={result.champion.title}
            finalFourTitles={result.finalFour.map((t) => t.title)}
            dateFaction={PERSONAS[persona.date].faction}
            friendFaction={PERSONAS[persona.friend].faction}
          />
          <div className="actions">
            <button className="primary" onClick={handleDownloadPoster}>
              🖼 下載我的單身人格卡
            </button>
            {SIGNUP_URL && (
              <a className="cta-signup" href={SIGNUP_URL} target="_blank" rel="noopener noreferrer">
                🎋 報名實體聯誼活動
              </a>
            )}
            <button className="ghost" onClick={handleCopyShare}>
              📋 複製交友貼文文案
            </button>
            {submitStatus === "done" && resultId && (
              <a className="ghost" href={`/r/${resultId}`} style={{ textAlign: "center", display: "block" }}>
                🔗 查看我的分享頁
              </a>
            )}
            {submitStatus === "error" && (
              <p className="pick-hint">分享連結建立失敗，可先下載海報，稍後再試</p>
            )}
            <button className="ghost" onClick={handleRestart}>
              ↺ 再測一次
            </button>
          </div>
          <BrandFooter />
        </section>
      )}

      <canvas ref={posterCanvasRef} id="poster" width={POSTER_WIDTH} height={POSTER_HEIGHT} />
      <div className={`toast${toast ? " show" : ""}`}>{toast}</div>
    </div>
  );
}
