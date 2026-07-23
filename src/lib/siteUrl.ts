/**
 * 站台絕對網址解析。分享文案、OG canonical、metadataBase 都需要絕對網址。
 *
 * 優先序：
 *   1. NEXT_PUBLIC_SITE_URL — 正式網域（先填 Vercel 預設 *.vercel.app，
 *      之後換自訂網域只改這一個環境變數即可）。
 *   2. VERCEL_URL — Vercel 每次部署（含 Preview）自動注入的該次網址。
 *   3. http://localhost:3000 — 本機開發 fallback。
 */
function normalize(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, "");
  if (/^https?:\/\//.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit && explicit.trim()) return normalize(explicit);

  const vercel = process.env.VERCEL_URL;
  if (vercel && vercel.trim()) return normalize(vercel);

  return "http://localhost:3000";
}

/** 完賽結果的分享短網址（絕對）。 */
export function getResultUrl(id: string): string {
  return `${getSiteUrl()}/r/${id}`;
}

/**
 * 報名實體聯誼活動連結。Design Spec 的 signupUrl 參數 —— 連結待合作方提供，
 * 由 NEXT_PUBLIC_SIGNUP_URL 注入。未設定時回傳 null，讓 UI 隱藏該 CTA。
 */
export function getSignupUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_SIGNUP_URL;
  return url && url.trim() ? url.trim() : null;
}
