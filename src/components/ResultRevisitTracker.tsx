"use client";

import { useEffect } from "react";
import { trackResultRevisited } from "@/lib/analytics";

/** Fires the result_revisited funnel event once when a /r/[id] page mounts. */
export function ResultRevisitTracker({ personaKey }: { personaKey: string }) {
  useEffect(() => {
    trackResultRevisited(personaKey);
  }, [personaKey]);
  return null;
}
