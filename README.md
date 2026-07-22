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
   - `NEXT_PUBLIC_SITE_URL`（Production 填正式網域；Preview 可留預設，Vercel 會用該次部署的網址）
3. Push 到預設分支即觸發 Production 部署；PR 會自動出 Preview 部署，兩者互相隔離。
4. 預設先用 Vercel 提供的網域（`*.vercel.app`）上線。之後要換自訂網域：Project Settings → Domains 加入網域並依指示改 DNS，不需要改任何程式碼。

## 事件追蹤

用 `@vercel/analytics`（`src/lib/analytics.ts`），五個必要事件：`quiz_started`、`quiz_completed`、`poster_downloaded`、`share_text_copied`、`result_revisited`。開發模式下事件只會印在 console（不會真的送出），正式站上到 Vercel Dashboard → Analytics 才看得到。

## 已知取捨（下一步可能要做的事）

- `trait_stats` view 目前只能算出「奪冠率」與「晉級四強率」，因為 `results` 只存最終結果（冠軍＋四強），沒有記錄每一輪分組/1v1 的選擇。若之後要做逐輪晉級率，需要另外設計 `game_events` 表。
- OG image（`app/r/[id]/opengraph-image.tsx`）在請求當下向 Google Fonts 抓取中文字型子集，需要外部網路存取；Vercel 正常可行，但若之後要離線/自架，需改成自行內嵌字型檔。
- Lighthouse mobile ≥ 90 尚未在正式部署環境實測（本機 build 的 First Load JS ≈ 98KB，結構上具備達標的條件），建議部署到 Preview 後用真實網域跑一次 Lighthouse 驗證。
