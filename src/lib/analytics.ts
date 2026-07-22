import { track } from "@vercel/analytics";
import type { Mode } from "@/lib/engine";

/**
 * The 5 funnel events required by the product spec: start, complete,
 * poster download, share-text copy, result-page revisit. Kept as thin named
 * wrappers (rather than a single generic call) so funnel event names can't
 * drift from typos at call sites.
 */

export function trackQuizStarted(mode: Mode) {
  track("quiz_started", { mode });
}

export function trackQuizCompleted(mode: Mode, personaKey: string) {
  track("quiz_completed", { mode, personaKey });
}

export function trackPosterDownloaded(mode: Mode, personaKey: string) {
  track("poster_downloaded", { mode, personaKey });
}

export function trackShareTextCopied(mode: Mode, personaKey: string) {
  track("share_text_copied", { mode, personaKey });
}

export function trackResultRevisited(personaKey: string) {
  track("result_revisited", { personaKey });
}
