# 七夕理想型世界盃

Next.js (App Router) + TypeScript + Supabase + Vercel。視覺與文案為佔位內容，待 design spec／文案定稿後直接替換：

- 視覺：`src/app/globals.css`（CSS variables）＋ `src/data/personas.ts` 的 `bg`/`ink`
- 文案／題目：`src/data/traits.ts`（128 題）、`src/data/personas.ts`（8 型人格）— 整檔替換即可，格式與 8 個 `FactionKey` 不可變動

## 本機開發

```bash
npm install
cp .env.example .env.local   # 填入 Supabase 專案的值
npm run dev
```

- `npm run test` — 賽制引擎 / sanitize / rate limit / 結果驗證的單元測試
- `npm run typecheck` — TypeScript 檢查
- `npm run build` — production build

沒有設定 Supabase 環境變數時，測驗流程（分組賽／1v1／結果卡／下載海報／複製文案）仍可完整跑完；只有「寫入結果、產生 `/r/[id]` 分享連結」這一步會失敗並顯示提示文字，不會讓使用者卡住。

## Supabase 設定

1. 建立一個 Supabase 專案。
2. 在 SQL editor 執行 `supabase/schema.sql`（內含 `results` 資料表、RLS policy、`get_result_by_id` RPC、`persona_distribution` / `trait_stats` 統計 view，每個決策都有註解說明）。
3. 到 Project Settings → API，取得：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`（**只**用在 `/api/stats`，絕不進前端 bundle）

## Rate limiting（Upstash Redis）

到 [Upstash](https://upstash.com) 建一個 Redis database，取得 `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`。沒設定時會自動退回記憶體版限流器（僅供本機開發，正式環境每個 serverless instance 各自計數、重啟即歸零，等於沒有防護，上線前務必設定）。

## 部署到 Vercel

1. 把這個 repo 推上 GitHub，在 Vercel 用 "Import Git Repository" 連接（會自動偵測 Next.js，免額外設定 `vercel.json`）。
2. 在 Vercel Project Settings → Environment Variables 依 `.env.example` 逐一填入，**Production 和 Preview 都要設**：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`
   - `NEXT_PUBLIC_SITE_URL`（Production 填正式網域，先用 Vercel 給的 `*.vercel.app`；之後換自訂網域只改這一個值。分享短網址、OG canonical、metadataBase 都靠它）
   - `NEXT_PUBLIC_SIGNUP_URL`（結果頁「報名實體聯誼活動」CTA 連結，合作方提供；**留空則 CTA 自動隱藏**，不會連到死連結）
3. Push 到預設分支即觸發 Production 部署；PR 會自動出 Preview 部署，兩者互相隔離。
4. 預設先用 Vercel 提供的網域（`*.vercel.app`）上線。之後要換自訂網域：Project Settings → Domains 加入網域並依指示改 DNS，不需要改任何程式碼。

## 事件追蹤

用 `@vercel/analytics`（`src/lib/analytics.ts`），五個必要事件：`quiz_started`、`quiz_completed`、`poster_downloaded`、`share_text_copied`、`result_revisited`。開發模式下事件只會印在 console（不會真的送出），正式站上到 Vercel Dashboard → Analytics 才看得到。

## Vercel Hobby（免費方案）用量策略

這個專案設計成優先讓 Vercel 的 Edge Network 直接擋掉重複請求，而不是每次都真的跑一次 function／查一次 Supabase：

- `/`（首頁）在 build 時就是純靜態頁（`next build` 輸出會標示 `○ /`），造訪完全不消耗 function 用量。
- `/r/[id]`：內容一旦寫入就不會再變，所以設定 `revalidate = 2592000`（30 天），同一個結果頁在快取期間重複被打開（分享出去被很多人點）不會重複打 function／Supabase。
- `/r/[id]/opengraph-image`：同一個 `id` 的圖片內容也是不變的，回應帶 `Cache-Control: public, immutable, max-age=31536000`（1 年）。這是流量重點——每個分享連結被 LINE / FB / Threads 等平台的預覽爬蟲讀取時，多半都會命中這個快取而不會重新產生圖片。
- `/api/stats`：`Cache-Control: public, s-maxage=300`（5 分鐘），這支只是給之後做內容用的統計 API，不需要即時。
- `/api/results`（寫入用）本來就只有真的完賽才會呼叫一次，沒有多餘的呼叫可以省。
- 字型走 Google Fonts 自己的 CDN（`fonts.googleapis.com`／`fonts.gstatic.com`），不算進 Vercel 的頻寬或 function 用量。

### Hobby 方案大概對應多少流量（2026 年中的公開數字，Vercel 可能會調整，實際以帳號後台為準）

| 項目 | 額度 |
|---|---|
| Fast Data Transfer（頻寬） | 100 GB / 月 |
| Edge Requests | 1,000,000 / 月 |
| Function Invocations | 1,000,000 / 月 |
| Vercel Functions Active CPU | 4 小時 / 月 |
| ISR Reads / Writes | 1,000,000 / 200,000 / 月 |

有了上面的快取策略，實際會「真的」呼叫到 function／Supabase 的，主要只剩：每個「新結果」第一次被看到時（含 OG 圖）、以及每次完賽寫入。以一個病毒式檔期活動來說，這個額度粗估足以撐到**數萬到十幾萬次不重複訪問／分享**（實際會依平均每人開幾次分享連結、圖片被爬蟲重複打幾次而變動，無法給精確數字）。如果社群反應非常好造成短時間暴衝，最先被打滿的通常是 Function Invocations 或 Active CPU，屆時 Vercel 會通知並詢問是否升級 Pro，Hobby 額度用完不會直接噴表機費用（Hobby 沒有 pay-as-you-go）。

### 在哪裡看用量

Vercel 後台左側選單 **Usage**（先用畫面左上角的 team 切換器選到你的帳號／team）。可以切換「最近 30 天」，並依 metric／專案／地區分別查看，超過額度前 Vercel 也會主動發通知。

## 端到端驗證計畫（環境接好後執行）

金鑰／Supabase／Upstash 都設定完、部署到 Preview 後，會逐項驗證：

1. **寫入**：跑一次 64 強與 128 強測驗，確認結果真的寫進 Supabase `results` 表（欄位、`persona_key` 由 `champion_id` 反推正確）。
2. **RLS**：用 anon key 直接呼叫 REST API 嘗試「列出所有結果」與 update/delete，確認全被拒絕；只有 `get_result_by_id` RPC 能讀單筆。
3. **分享頁 + OG 圖**：打開真實 `/r/[id]`，確認結果卡、動態 OG 人格卡圖正確顯示，OG 圖回傳 `Cache-Control: immutable`，分享文案帶絕對短網址。
4. **/stats**：呼叫 `/api/stats`，確認人格分布與條件統計數字合理、且帶 5 分鐘快取標頭。
5. **Rate limit**：短時間連打 `/api/results`，確認超過門檻回 429。
6. **效能**：正式網域跑 Lighthouse mobile，確認首屏 < 2 秒、分數 ≥ 90。

## 目前卡在「等金鑰／repo」的項目（今晚無法做，明天補齊即可）

- **GitHub push**：repo 建好（`jojo880714/qixi-ideal-cup`）給網址後即可 push（我這端已有 gh 權限）。
- **上述端到端驗證 1–5**：需要真實 Supabase／Upstash 金鑰，無法用假資料硬測。程式本身已在本機驗證「無金鑰時優雅降級」（測驗全程可玩、只有寫分享頁那步顯示提示）。
- **報名 CTA 連結**：`NEXT_PUBLIC_SIGNUP_URL` 待合作方提供；未設定時 CTA 自動隱藏。
- **Joysee logo 圖檔**：目前用文字佔位（`BrandFooter.tsx` 有註記），拿到 `joysee-logo.png` 後替換一處即可。
- **海報 QR 圖**：報名連結確認後再生成，目前是佔位方塊。

## 已知取捨（下一步可能要做的事）

- `trait_stats` view 目前只能算出「奪冠率」與「晉級四強率」，因為 `results` 只存最終結果（冠軍＋四強），沒有記錄每一輪分組/1v1 的選擇。若之後要做逐輪晉級率，需要另外設計 `game_events` 表。
- OG image（`app/r/[id]/opengraph-image.tsx`）在請求當下向 Google Fonts 抓取中文字型子集，需要外部網路存取；Vercel 正常可行，但若之後要離線/自架，需改成自行內嵌字型檔。
- Lighthouse mobile ≥ 90 尚未在正式部署環境實測（本機 build 的首頁 First Load JS ≈ 102KB，結構上具備達標的條件），建議部署到 Preview 後用真實網域跑一次 Lighthouse 驗證。
