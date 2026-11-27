-- BLUFF playtest report (SPEC §4.4). Read-only; run on the Dev project (SQL editor / MCP).
-- Public match data only (round_scored records); no personal data. Edit :since below.
-- 1) Per player count: matches, claim / lie %, AFK, prediction hit %, points by source.
with params as (select timestamptz '2026-11-01' as since),
rounds as (
  select m.id, e.public_payload -> 'record' as rec
  from public.match_events e
  join public.matches m on m.id = e.match_id, params
  where m.game_id = 'bluff' and e.event_type = 'round_scored' and m.created_at >= params.since
),
seats as (
  select r.id, jsonb_array_length(r.rec -> 'locks') as n, s.v as lk,
         r.rec -> 'claims' -> (s.ord::int - 1) as cl, r.rec -> 'points' -> (s.ord::int - 1) as pt
  from rounds r, jsonb_array_elements(r.rec -> 'locks') with ordinality s(v, ord)
)
select n as players, count(distinct id) as matches, count(*) as seat_rounds,
  round(avg((cl <> 'null'::jsonb)::int) * 100) as claim_pct,
  round(avg((cl <> 'null'::jsonb and cl <> lk -> 'answer')::int) * 100) as lie_pct,
  round(avg((lk -> 'answer' = 'null'::jsonb)::int) * 100) as afk_pct,
  round(avg((pt ->> 'hit')::boolean::int) * 100) as hit_pct,
  round(avg((lk ->> 'wager')::numeric), 2) as avg_wager,
  round(avg((pt ->> 'prediction')::numeric), 2) as pred_pts,
  round(avg((pt ->> 'crowd')::numeric), 2) as crowd_pts,
  round(avg((pt ->> 'bluff')::numeric), 2) as bluff_pts,
  round(avg((pt ->> 'honest')::numeric), 2) as honest_pts
from seats group by n order by n;

-- 2) Per item vote spread: flag dominant (> 60 %) or empty (0 %) options once votes >= 10.
with params as (select timestamptz '2026-11-01' as since),
votes as (
  select e.public_payload -> 'record' ->> 'itemId' as item, (s ->> 'answer')::int as answer
  from public.match_events e
  join public.matches m on m.id = e.match_id, params,
  jsonb_array_elements(e.public_payload -> 'record' -> 'locks') s
  where m.game_id = 'bluff' and e.event_type = 'round_scored' and m.created_at >= params.since
    and s ->> 'answer' is not null
),
spread as (
  select item, count(*) as votes,
    array[count(*) filter (where answer = 0), count(*) filter (where answer = 1),
          count(*) filter (where answer = 2), count(*) filter (where answer = 3)] as abcd
  from votes group by item
)
select item, votes, abcd,
  case when votes < 10 then 'too few votes'
       when (select max(x) from unnest(abcd) x) * 100 > votes * 60 then 'dominant option'
       when 0 = any(abcd) then 'empty option'
       else 'ok' end as verdict
from spread order by votes desc, item;
