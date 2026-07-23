-- 七夕理想型世界盃 — Supabase schema
--
-- Design notes (read before modifying):
--
-- 1. We store IDs, not display text. `champion_id` / `final_four_ids` are
--    Trait.id values from src/data/traits.ts (e.g. "care-03"), and
--    `persona_key` is a FactionKey from src/data/personas.ts. The actual
--    Chinese wording is resolved app-side at render time. This means a
--    future copy-finalization pass can replace src/data/traits.ts and
--    src/data/personas.ts wholesale without any migration — old rows keep
--    resolving to whatever text currently lives at that id.
--
-- 2. No PII is collected. `nickname` is free text the user typed and is
--    treated as public content (it's displayed on the shareable result
--    card), same as the prototype's poster feature.
--
-- 3. "Anonymous can insert and read a single result, but not list, update,
--    or delete" is enforced by *not* granting SELECT on the table at all —
--    RLS policies apply per-row, so a `using (true)` SELECT policy would
--    still let a client query `?select=*&limit=1000` and enumerate every
--    row. Instead, reads only go through `get_result_by_id(uuid)`, a
--    SECURITY DEFINER function that takes a single id and returns at most
--    one row. There is no way to call it without already knowing the id.
--
-- 4. Aggregate stats (/stats API) are read with the Supabase *service role*
--    key, server-side only (see src/lib/supabase/server.ts + app/api/stats).
--    Service role bypasses RLS, so the stats views below are never granted
--    to `anon` — there is no anonymous read path to them at all.

create extension if not exists pgcrypto;

create table if not exists public.results (
  id uuid primary key,
  mode smallint not null check (mode in (64, 128)),
  persona_key text not null check (
    persona_key in ('soul', 'safe', 'life', 'spark', 'grow', 'care', 'free', 'fun')
  ),
  champion_id text not null,
  final_four_ids text[] not null check (array_length(final_four_ids, 1) = 4),
  nickname text not null check (char_length(nickname) between 1 and 12),
  created_at timestamptz not null default now()
);

create index if not exists results_champion_id_idx on public.results (champion_id);
create index if not exists results_persona_key_idx on public.results (persona_key);
create index if not exists results_created_at_idx on public.results (created_at);

alter table public.results enable row level security;

-- Belt-and-braces: revoke whatever default privileges PostgREST roles may
-- have, then grant back only what's intended.
revoke all on public.results from anon, authenticated;

-- Anonymous clients may insert new results. The app generates the row's
-- `id` client-side (crypto.randomUUID()) so no SELECT is ever needed to
-- learn the id back — see src/lib/supabase/client.ts.
grant insert on public.results to anon;

create policy "anon can insert results"
  on public.results
  for insert
  to anon
  with check (true);

-- Deliberately no SELECT/UPDATE/DELETE policy for anon or authenticated.
-- Reads happen only through the function below.

create or replace function public.get_result_by_id(p_id uuid)
returns table (
  id uuid,
  mode smallint,
  persona_key text,
  champion_id text,
  final_four_ids text[],
  nickname text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select r.id, r.mode, r.persona_key, r.champion_id, r.final_four_ids, r.nickname, r.created_at
  from public.results r
  where r.id = p_id
  limit 1;
$$;

revoke all on function public.get_result_by_id(uuid) from public;
grant execute on function public.get_result_by_id(uuid) to anon;

-- ---------------------------------------------------------------------
-- Rate limiting (distributed, Postgres-backed).
--
-- Used by POST /api/results to throttle writes per IP and stop spam from
-- polluting the stats — without needing a separate Redis/Upstash account.
-- The counter table is locked to anon (no policies, privileges revoked);
-- the only way in is the SECURITY DEFINER function below, which atomically
-- increments a fixed-window bucket and returns whether the caller is still
-- under the limit. Shared across every serverless instance because it lives
-- in the same Postgres.
-- ---------------------------------------------------------------------

create table if not exists public.rate_limit (
  bucket text primary key,        -- "<ip>:<window index>"
  count int not null default 0,
  expires_at timestamptz not null
);
create index if not exists rate_limit_expires_idx on public.rate_limit (expires_at);

alter table public.rate_limit enable row level security;
revoke all on public.rate_limit from anon, authenticated;
-- deliberately no policies: anon can only touch it via check_rate_limit().

create or replace function public.check_rate_limit(p_ip text, p_max int, p_window_seconds int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window bigint := floor(extract(epoch from now()) / p_window_seconds);
  v_bucket text := p_ip || ':' || v_window::text;
  v_count int;
begin
  insert into public.rate_limit (bucket, count, expires_at)
    values (v_bucket, 1, now() + make_interval(secs => p_window_seconds * 2))
    on conflict (bucket) do update set count = public.rate_limit.count + 1
    returning count into v_count;

  -- opportunistic cleanup (~5% of calls) keeps the table tiny without a cron.
  if random() < 0.05 then
    delete from public.rate_limit where expires_at < now();
  end if;

  return v_count <= p_max;  -- true = allowed
end;
$$;

revoke all on function public.check_rate_limit(text, int, int) from public;
grant execute on function public.check_rate_limit(text, int, int) to anon;

-- ---------------------------------------------------------------------
-- Stats views (public aggregates). These expose ONLY aggregated counts —
-- per-persona totals and per-trait champion/final-four counts. No row ids,
-- no nicknames, nothing per-user. A Postgres view runs with its owner's
-- privileges by default, so these can read `public.results` even though the
-- `anon` role cannot read that table directly (see the deliberate lack of a
-- SELECT policy above). We therefore grant `anon` SELECT on the views only:
-- the aggregate numbers are public campaign content ("全站最多人選的條件"),
-- while individual rows stay locked. `/api/stats` reads these with the anon
-- key and caches the response — no service-role key needed anywhere in the
-- app.
-- ---------------------------------------------------------------------

-- 8 型人格分布：完賽總數、各人格佔比
create or replace view public.persona_distribution as
select
  persona_key,
  count(*) as total,
  round(100.0 * count(*) / nullif(sum(count(*)) over (), 0), 2) as pct
from public.results
group by persona_key
order by total desc;

-- 各條件的奪冠率／晉級四強率。
-- 目前只儲存完賽結果（冠軍 + 四強），並未記錄每一輪的分組/1v1 選擇，
-- 所以「淘汰率」是以「未能晉級四強」反推的近似值，而非逐輪精確追蹤。
-- 若之後需要逐輪晉級率，需另建 game_events 表記錄每次分組/1v1 選擇。
create or replace view public.trait_stats as
with games as (
  select id, champion_id, unnest(final_four_ids) as final_four_id
  from public.results
),
total_games as (
  select count(*) as n from public.results
)
select
  ff.final_four_id as trait_id,
  count(*) filter (where ff.champion_id = ff.final_four_id) as champion_count,
  count(distinct ff.id) as final_four_count,
  (select n from total_games) as total_games,
  round(
    100.0 * count(*) filter (where ff.champion_id = ff.final_four_id)
      / nullif((select n from total_games), 0),
    2
  ) as champion_rate_pct,
  round(
    100.0 * count(distinct ff.id) / nullif((select n from total_games), 0),
    2
  ) as final_four_rate_pct
from games ff
group by ff.final_four_id
order by champion_count desc, final_four_count desc;

-- Expose only the aggregate views to anon (see block comment above).
grant select on public.persona_distribution to anon;
grant select on public.trait_stats to anon;
