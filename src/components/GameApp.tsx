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
import { trackPosterDownloaded, trackQuizCompleted, trackQuizStarted } from "@/lib/analytics";
import { track } from "@/lib/track";
import { downloadCanvasAsPng, drawPosterToCanvas, POSTER_HEIGHT, POSTER_WIDTH } from "@/lib/poster";
import { getSignupUrl } from "@/lib/siteUrl";
import { HomeScreen } from "./HomeScreen";
import { GroupScreen } from "./GroupScreen";
import { DuelScreen } from "./DuelScreen";
import { ChampionReveal } from "./ChampionReveal";
import { ResultCard } from "./ResultCard";
import { SignupCta } from "./SignupCta";
import { BrandFooter } from "./BrandFooter";
import { StarField } from "./StarField";

const SIGNUP_URL = getSignupUrl();

export function GameApp() {
  const [state, setState] = useState<GameState | null>(null);
  const [nickname, setNickname] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  // 冠軍戰結束後先播「星等爆發」揭曉，再顯示結果卡。
  const [revealing, setRevealing] = useState(false);
  const posterCanvasRef = useRef<HTMLCanvasElement>(null);
  const submittedRef = useRef(false);
  // Full pick snapshot (每組看到哪些條件、留下哪些；每場 1v1 誰勝) for
  // post-hoc per-round content. Stored with the completion, analytics-only.
  const picksRef = useRef<unknown[]>([]);
  const logoRef = useRef<HTMLImageElement | null>(null);

  // First-party "visit" event, once per browser session (bots that don't run
  // JS never fire this, keeping visitor counts honest). Also preload the
  // Joysee logo so the poster footer can draw it.
  useEffect(() => {
    track("visit", { oncePerSession: true });
    // Load the logo from the public file (kept out of the JS bundle so it
    // doesn't bloat First Load JS) — used to draw the poster footer.
    const img = new Image();
    img.src = "/joysee-logo.png";
    logoRef.current = img;
  }, []);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast((current) => (current === message ? null : current)), 2200);
  }

  function handleStart(mode: Mode, sanitizedNickname: string) {
    trackQuizStarted(mode);
    track("quiz_start", { mode });
    setNickname(sanitizedNickname);
    setRevealing(false);
    submittedRef.current = false;
    picksRef.current = [];
    setState(initGame(mode, TRAITS));
  }

  function handleGroupConfirm(selectedIndices: number[]) {
    if (!state) return;
    const group = state.groupQueue[state.groupIdx];
    if (group) {
      picksRef.current.push({
        t: "group",
        r: state.roundNumber,
        stage: group.stage,
        label: group.label,
        items: group.items.map((it) => it.id),
        picked: selectedIndices.map((i) => group.items[i]?.id).filter(Boolean),
      });
    }
    setState(submitGroupPick(state, selectedIndices));
  }

  function handleDuelPick(side: 0 | 1) {
    if (!state) return;
    const pair = state.duels[state.duelIdx];
    if (pair) {
      picksRef.current.push({
        t: "duel",
        stage: state.duelStageIdx,
        pair: [pair[0].id, pair[1].id],
        win: pair[side].id,
      });
    }
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
    track("quiz_complete", { mode: state.mode, personaKey: persona.key });

    if (posterCanvasRef.current) {
      drawPosterToCanvas(posterCanvasRef.current, {
        persona,
        nickname,
        mode: state.mode,
        championTitle: result.champion.title,
        finalFourTitles: result.finalFour.map((t) => t.title),
        dateFaction: PERSONAS[persona.date].faction,
        friendFaction: PERSONAS[persona.friend].faction,
        logo: logoRef.current,
      });
    }

    // Persist the result for stats / 全站戰況 (fire-and-forget — the user has
    // no link UI, this powers /wall + /admin aggregates + the per-result page).
    fetch("/api/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: state.mode,
        championId: result.champion.id,
        finalFourIds: result.finalFour.map((t) => t.id),
        nickname,
        picks: picksRef.current,
      }),
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, persona, state, nickname]);

  function handleDownloadPoster() {
    if (!posterCanvasRef.current || !state || !persona) return;
    trackPosterDownloaded(state.mode, persona.key);
    track("poster_download", { mode: state.mode, personaKey: persona.key });
    downloadCanvasAsPng(posterCanvasRef.current, `七夕理想型世界盃_${nickname}.png`);
    showToast("人格卡已下載，貼出去等人報到 🙋");
  }

  function handleRestart() {
    setState(null);
    setNickname("");
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
            {SIGNUP_URL && <SignupCta url={SIGNUP_URL} personaKey={persona.key} />}
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
