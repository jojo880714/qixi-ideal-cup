"use client";

import { useEffect } from "react";
import { trackResultRevisited } from "@/lib/analytics";
import { track } from "@/lib/track";

/** Fires revisit events once when a shared /r/[id] page is opened by someone. */
export function ResultRevisitTracker({ personaKey }: { personaKey: string }) {
  useEffect(() => {
    trackResultRevisited(personaKey);
    track("result_revisit", { personaKey });
    track("result_view", { personaKey });
  }, [personaKey]);
  return null;
}
