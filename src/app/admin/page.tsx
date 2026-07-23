import type { Metadata } from "next";
import { conditionTitle, fetchAdminMetrics, personaName, type AdminMetrics } from "@/lib/metrics";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "後台數據｜理想型世界盃",
  robots: { index: false, follow: false },
};

const C = {
  bg: "#FBF7F0",
  card: "#FFFFFF",
  border: "#E7DECB",
  ink: "#2C1B4E",
  sub: "#6B5E85",
  accent: "#B34D66",
  peach: "#E8804D",
  gold: "#D9A93E",
  good: "#3D8A6B",
};

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}
function pct(v: number | null): string {
  return v == null ? "—" : `${v}%`;
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 18px" }}>
      <div style={{ fontSize: 12, color: C.sub, marginBottom: 6, letterSpacing: ".05em" }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: tone ?? C.ink, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: C.sub, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function Bar({ label, value, base, tone }: { label: string; value: number; base: number; tone: string }) {
  const w = base > 0 ? Math.max(2, Math.round((value / base) * 100)) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 0" }}>
      <div style={{ width: 96, flexShrink: 0, fontSize: 13, color: C.ink }}>{label}</div>
      <div style={{ flex: 1, background: "#F0E9DD", borderRadius: 8, height: 26, position: "relative", overflow: "hidden" }}>
        <div style={{ width: `${w}%`, height: "100%", background: tone, borderRadius: 8 }} />
      </div>
      <div style={{ width: 96, flexShrink: 0, textAlign: "right", fontSize: 13, color: C.ink }}>
        <b>{fmt(value)}</b>
        <span style={{ color: C.sub }}> · {base > 0 ? Math.round((value / base) * 100) : 0}%</span>
      </div>
    </div>
  );
}

function Panel({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, marginBottom: 18 }}>
      <div style={{ fontWeight: 700, color: C.ink, marginBottom: hint ? 2 : 12 }}>{title}</div>
      {hint && <div style={{ fontSize: 12.5, color: C.sub, marginBottom: 14 }}>{hint}</div>}
      {children}
    </div>
  );
}

function Dashboard({ m }: { m: AdminMetrics }) {
  const funnelBase = Math.max(m.unique_visitors, m.starts, m.completions, 1);
  const dailyMax = Math.max(1, ...m.daily.map((d) => Math.max(d.visitors, d.completions)));

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "40px 20px 100px" }}>
      <div style={{ marginBottom: 8, fontSize: 12, letterSpacing: ".2em", color: C.accent, fontWeight: 700 }}>
        七夕理想型世界盃 · 後台數據（僅你可見）
      </div>
      <div style={{ fontSize: 30, fontWeight: 900, color: C.ink, margin: "0 0 6px" }}>完測數據總覽</div>
      <p style={{ color: C.sub, fontSize: 13.5, margin: "0 0 26px" }}>
        只計真的進到本測驗的訪客，數字比全站事件準。不重複訪客以 IP 雜湊去重（不存真實 IP）。
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 24 }}>
        <Kpi label="瀏覽次數" value={fmt(m.views)} sub={`開始測驗 ${fmt(m.starts)} 次`} />
        <Kpi label="不重複瀏覽（扣同 IP）" value={fmt(m.unique_visitors)} />
        <Kpi label="完成人數" value={fmt(m.completions)} tone={C.accent} />
        <Kpi label="完成率（對訪客）" value={pct(m.completion_rate_visitor)} tone={C.good} sub="完成 ÷ 不重複訪客" />
        <Kpi label="完成率（對開始）" value={pct(m.completion_rate_start)} tone={C.good} sub="完成 ÷ 開始測驗" />
        <Kpi label="報名點擊" value={fmt(m.signup_clicks)} tone={C.peach} />
        <Kpi label="報名點擊率" value={pct(m.signup_ctr)} tone={C.peach} sub="報名點擊 ÷ 完成人數" />
      </div>

      <Panel title="轉換漏斗" hint="進站 → 開始 → 完成 →（點報名）；一眼看流失卡在哪關。">
        <Bar label="進站訪客" value={m.unique_visitors} base={funnelBase} tone={C.peach} />
        <Bar label="開始測驗" value={m.starts} base={funnelBase} tone={C.peach} />
        <Bar label="完成測驗" value={m.completions} base={funnelBase} tone={C.accent} />
        <Bar label="點報名" value={m.signup_clicks} base={funnelBase} tone={C.gold} />
      </Panel>

      <Panel title="每日趨勢" hint="每天「不重複訪客 vs 完成人數」，看哪天是高峰。">
        <div style={{ display: "flex", gap: 6, alignItems: "flex-end", overflowX: "auto", paddingBottom: 8 }}>
          {m.daily.map((d) => (
            <div key={d.day} style={{ flex: "1 0 34px", textAlign: "center" }}>
              <div style={{ display: "flex", gap: 3, alignItems: "flex-end", justifyContent: "center", height: 110 }}>
                <div title={`訪客 ${d.visitors}`} style={{ width: 12, height: `${(d.visitors / dailyMax) * 100}%`, background: C.peach, borderRadius: "3px 3px 0 0", minHeight: 2 }} />
                <div title={`完成 ${d.completions}`} style={{ width: 12, height: `${(d.completions / dailyMax) * 100}%`, background: C.accent, borderRadius: "3px 3px 0 0", minHeight: 2 }} />
              </div>
              <div style={{ fontSize: 10, color: C.sub, marginTop: 4 }}>{d.day}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 12, color: C.sub, marginTop: 8 }}>
          <span>■ <span style={{ color: C.peach }}>訪客</span></span>
          <span>■ <span style={{ color: C.accent }}>完成</span></span>
        </div>
      </Panel>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18 }}>
        <Panel title="目前玩家的人格分布">
          {m.persona_distribution.length === 0 ? (
            <div style={{ color: C.sub, fontSize: 13 }}>還沒有完測資料</div>
          ) : (
            m.persona_distribution.map((p) => (
              <Bar key={p.persona_key} label={personaName(p.persona_key)} value={p.total} base={m.completions || 1} tone={C.peach} />
            ))
          )}
        </Panel>

        <Panel title="最夯「天字第一號條件」Top 8">
          {m.top_conditions.length === 0 ? (
            <div style={{ color: C.sub, fontSize: 13 }}>還沒有完測資料</div>
          ) : (
            m.top_conditions.map((c, i) => (
              <div key={c.trait_id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: i < m.top_conditions.length - 1 ? `1px solid ${C.bg}` : "none", fontSize: 14, color: C.ink }}>
                <span><span style={{ color: C.sub }}>{i + 1}.</span> {conditionTitle(c.trait_id)}</span>
                <b>{fmt(c.wins)}</b>
              </div>
            ))
          )}
        </Panel>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 18 }}>
        <Kpi label="下載海報" value={fmt(m.poster_downloads)} />
        <Kpi label="複製分享文案" value={fmt(m.share_copies)} />
        <Kpi label="分享頁被回訪" value={fmt(m.revisits)} sub="別人點開分享連結的次數" />
        <Kpi label="64 強 / 128 強" value={`${fmt(m.mode_split["64"] ?? 0)} / ${fmt(m.mode_split["128"] ?? 0)}`} />
      </div>

      <p style={{ color: C.sub, fontSize: 12, marginTop: 30 }}>
        資料來源：Supabase（本站自建）。與 Vercel Analytics 為兩把尺——它濾機器人、我們用 IP 去重，數字略有差異屬正常。
      </p>
    </div>
  );
}

export default async function AdminPage({ searchParams }: { searchParams: { key?: string } }) {
  const key = searchParams.key ?? "";
  const metrics = key ? await fetchAdminMetrics(key) : null;

  if (!metrics) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "36px 40px", textAlign: "center", maxWidth: 420 }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>🔒</div>
          <div style={{ fontWeight: 800, color: C.ink, fontSize: 18, marginBottom: 8 }}>需要管理金鑰</div>
          <div style={{ color: C.sub, fontSize: 13.5, lineHeight: 1.7 }}>
            這是私人後台。請用含金鑰的網址開啟：<br />
            <code style={{ background: C.bg, padding: "2px 6px", borderRadius: 5 }}>/admin?key=你的金鑰</code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <Dashboard m={metrics} />
    </div>
  );
}
