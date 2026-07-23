"use client";

import { useState } from "react";

/** Shares the /wall page (native share sheet if available, else copy link). */
export function WallShareButton() {
  const [toast, setToast] = useState<string | null>(null);

  function show(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2000);
  }

  async function onShare() {
    const url = window.location.href;
    const text = "七夕理想型世界盃 · 大家的理想型戰況 👀";
    try {
      if (navigator.share) {
        await navigator.share({ title: "理想型世界盃 全站戰況", text, url });
        return;
      }
    } catch {
      return; // user cancelled native share
    }
    try {
      await navigator.clipboard.writeText(url);
      show("連結已複製 ✓");
    } catch {
      show("複製失敗，請手動複製網址");
    }
  }

  return (
    <>
      <button className="ghost" onClick={onShare}>
        📣 分享全站戰況
      </button>
      <div className={`toast${toast ? " show" : ""}`}>{toast}</div>
    </>
  );
}
