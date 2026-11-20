# AumMon — Operations

## Monitoring (task 7.2)

Run in Supabase → SQL Editor (project `AumMon-Dev`):

```sql
select * from private.metrics_functions_24h;   -- requests, p50/p95/p99 ms, 5xx, 429, 409 per function
select * from private.metrics_matches_daily;   -- matches created / finished / abandoned / active, avg duration
```

- Raw rows: `private.function_metrics` (no user ids, no game data).
- Function logs and errors: Supabase → Edge Functions → _function_ → Logs (`Unhandled error …`).
- Scaling triggers (blueprint §11.4): `matches-submit-action` p95 > 800 ms, 5xx > 1 %, frequent 429 for normal play → investigate before adding a dedicated server.
- Retention: delete old metric rows periodically, e.g. `delete from private.function_metrics where created_at < now() - interval '30 days';`

## Load test (task 7.6)

```bash
NODE_USE_ENV_PROXY=1 FUNCTION_REGION=ap-northeast-1 \
SUPABASE_URL=https://<dev-ref>.supabase.co SUPABASE_PUBLISHABLE_KEY=<publishable> \
node tests/load/solo-load.mjs 20
```

Dev / Staging only. Each virtual player signs up, plays a full Solo match and deletes its account.

Baseline (2026-11-20, AumMon-Dev Free plan, 20 concurrent players, 20/20 matches finished, 0 errors):

| Function (server-side, `metrics_functions_24h`) | p50 ms | p95 ms |
| ----------------------------------------------- | -----: | -----: |
| `matches-submit-action`                         |    261 |    673 |
| `rooms-create`                                  |    408 |    926 |
| `matches-start`                                 |   1740 |   2936 |
| `account-delete`                                |    102 |    599 |

Finding: without the `x-region` header, Edge Functions ran near the caller (US) while the DB is in Tokyo, making `matches-submit-action` p50 ≈ 12 s. The client now sends `x-region` = the DB region (`VITE_SUPABASE_FUNCTIONS_REGION`, default `ap-northeast-1`).
