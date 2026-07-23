"use client";

import { track } from "@/lib/track";

/** 報名實體聯誼活動 CTA — 記錄點擊（signup_click）後開啟報名表單。 */
export function SignupCta({ url, personaKey }: { url: string; personaKey?: string }) {
  return (
    <a
      className="cta-signup"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track("signup_click", { personaKey })}
    >
      🎋 報名實體聯誼活動
    </a>
  );
}
