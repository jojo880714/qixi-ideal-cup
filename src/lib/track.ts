"use client";

/**
 * Lightweight client-side event tracking → /api/track → Supabase events table.
 * Runs only in the browser (bots that don't execute JS never count, which
 * keeps the visitor/funnel numbers honest). Completely fire-and-forget: any
 * failure is swallowed so analytics can never affect the user experience.
 *
 * This is our own first-party funnel (Step 6 of the campaign workflow). It
 * runs ALONGSIDE Vercel Web Analytics, not instead of it.
 */

export type TrackEvent =
  | "visit"
  | "quiz_start"
  | "quiz_complete"
  | "result_view"
  | "result_revisit"
  | "poster_download"
  | "share_copy"
  | "signup_click";

const SESSION_KEY = "qixi_sid";
const ONCE_PREFIX = "qixi_once_";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = (crypto.randomUUID?.() ?? String(Math.random()).slice(2)) as string;
      sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return "";
  }
}

interface TrackOptions {
  personaKey?: string;
  mode?: 64 | 128;
  /** Only send this event once per browser session (e.g. "visit"). */
  oncePerSession?: boolean;
}

export function track(name: TrackEvent, opts: TrackOptions = {}): void {
  if (typeof window === "undefined") return;

  if (opts.oncePerSession) {
    try {
      const k = ONCE_PREFIX + name;
      if (sessionStorage.getItem(k)) return;
      sessionStorage.setItem(k, "1");
    } catch {
      /* ignore storage errors, still send */
    }
  }

  const payload = JSON.stringify({
    name,
    sessionId: getSessionId(),
    personaKey: opts.personaKey,
    mode: opts.mode,
  });

  try {
    // sendBeacon survives page unloads (e.g. tracking a download click then leaving).
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([payload], { type: "application/json" }));
      return;
    }
  } catch {
    /* fall through to fetch */
  }
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}
