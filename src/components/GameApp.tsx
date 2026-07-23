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
import { sharePosterFromNode } from "@/lib/sharePoster";
import { getSignupUrl } from "@/lib/siteUrl";
import { HomeScreen } from "./HomeScreen";
import { GroupScreen } from "./GroupScreen";
import { DuelScreen } from "./DuelScreen";
import { ChampionReveal } from "./ChampionReveal";
import { ResultCard } from "./ResultCard";
import { PosterCard } from "./PosterCard";
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
  const [sharing, setSharing] = useState(false);
  // Off-screen PosterCard node captured by html-to-image on download.
  const posterNodeRef = useRef<HTMLDivElement>(null);
  const submittedRef = useRef(false);
  // Full pick snapshot (每組看到哪些條件、留下哪些；每場 1v1 誰勝) for
  // post-hoc per-round content. Stored with the completion, analytics-only.
  const picksRef = useRef<unknown[]>([]);

  // First-party "visit" event, once per browser session (bots that don't run
  // JS never fire this, keeping visitor counts honest).
  useEffect(() => {
    track("visit", { oncePerSession: true });
  }, []);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast((current) => (current === message ? null : current)), 2600);
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

  // Submit the finished result once and fire the completion event.
  useEffect(() => {
    if (!result || !persona || !state || submittedRef.current) return;
    submittedRef.current = true;

    trackQuizCompleted(state.mode, persona.key);
    track("quiz_complete", { mode: state.mode, personaKey: persona.key });

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

  async function handleDownloadPoster() {
    if (!posterNodeRef.current || !state || !persona || sharing) return;
    trackPosterDownloaded(state.mode, persona.key);
    track("poster_download", { mode: state.mode, personaKey: persona.key });
    setSharing(true);
    showToast("圖片產生中…");
    const outcome = await sharePosterFromNode(
      posterNodeRef.current,
      `七夕理想型世界盃_${nickname}.png`,
      `這個七夕我是「${persona.name}」，符合的請在留言區報到 🙋`,
    );
    setSharing(false);
    if (outcome === "shared") showToast("選「儲存影像」存到相簿，或直接發限動 🙋");
    else if (outcome === "downloaded") showToast("人格卡已存到下載，貼出去等人報到 🙋");
    else showToast("產生失敗，請再試一次");
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
            <button className="primary" onClick={handleDownloadPoster} disabled={sharing}>
              {sharing ? "圖片產生中…" : "🖼 儲存 / 分享我的人格卡"}
            </button>
            {SIGNUP_URL && <SignupCta url={SIGNUP_URL} personaKey={persona.key} />}
            <button className="ghost" onClick={handleRestart}>
              ↺ 再測一次
            </button>
          </div>
          <BrandFooter />
        </section>
      )}

      {/* Off-screen poster DOM captured by html-to-image on download. */}
      {state && result && persona && (
        <div
          aria-hidden="true"
          style={{ position: "fixed", left: -20000, top: 0, pointerEvents: "none", opacity: 0 }}
        >
          <div ref={posterNodeRef}>
            <PosterCard
              persona={persona}
              nickname={nickname}
              mode={state.mode}
              championTitle={result.champion.title}
              finalFourTitles={result.finalFour.map((t) => t.title)}
              dateFaction={PERSONAS[persona.date].faction}
              friendFaction={PERSONAS[persona.friend].faction}
            />
          </div>
        </div>
      )}

      <div className={`toast${toast ? " show" : ""}`}>{toast}</div>
    </div>
  );
}
