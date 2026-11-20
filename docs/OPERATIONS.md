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
