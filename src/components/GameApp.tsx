"use client";

import { useEffect, useRef, useState } from "react";
import { TRAITS } from "@/data/traits";
import { PERSONAS } from "@/data/personas";
import {
  DUEL_STAGE_LABELS,
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
import { HomeScreen } from "./HomeScreen";
import { GroupScreen } from "./GroupScreen";
import { DuelScreen } from "./DuelScreen";
import { ResultCard } from "./ResultCard";
import { StarField } from "./StarField";

type SubmitStatus = "idle" | "submitting" | "done" | "error";

export function GameApp() {
  const [state, setState] = useState<GameState | null>(null);
  const [nickname, setNickname] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [resultId, setResultId] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
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
    submittedRef.current = false;
    setState(initGame(mode, TRAITS));
  }

  function handleGroupConfirm(selectedIndices: number[]) {
    if (!state) return;
    setState(submitGroupPick(state, selectedIndices));
  }

  function handleDuelPick(side: 0 | 1) {
    if (!state) return;
    setState(submitDuelPick(state, side));
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
    submittedRef.current = false;
  }

  const stepsDone = state?.stepsDone ?? 0;
  const stepsTotal = state?.stepsTotal ?? 1;
  const progressPct = Math.min(100, (stepsDone / stepsTotal) * 100);

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
          progressPct={progressPct}
          onConfirm={handleGroupConfirm}
          onOverPick={() => showToast(`只能選 ${state.groupQueue[state.groupIdx]!.pick} 個，先取消一個吧`)}
        />
      )}

      {state && state.phase === "duel" && (
        <DuelScreen
          key={`${state.duelStageIdx}-${state.duelIdx}`}
          pair={state.duels[state.duelIdx]!}
          stageLabel={DUEL_STAGE_LABELS[state.duelStageIdx] ?? DUEL_STAGE_LABELS[0]}
          duelNumberInStage={state.duelIdx + 1}
          duelCountInStage={state.duels.length}
          progressPct={progressPct}
          onPick={handleDuelPick}
        />
      )}

      {state && result && persona && (
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
        </section>
      )}

      <canvas ref={posterCanvasRef} id="poster" width={POSTER_WIDTH} height={POSTER_HEIGHT} />
      <div className={`toast${toast ? " show" : ""}`}>{toast}</div>
    </div>
  );
}
