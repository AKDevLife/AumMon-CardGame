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

## Deploy (Dev) — task 7.7

1. Merge to `main` (CI green). `playtest` branch follows automatically → Vercel Preview rebuilds.
2. New migrations: apply in order to the Dev project only; never edit an applied migration.
3. Edge Functions: `pnpm sync:engine && supabase functions deploy --remote=<ref> --use-api`.
4. Smoke test (read-only): `pnpm smoke https://aum-mon-card-game-git-playtest-aum-mon.vercel.app https://<ref>.supabase.co` → all PASS.

Production deploys require owner approval (task 7.8).

## Rollback

| Layer          | How                                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Web (Vercel)   | Vercel → Deployments → previous good deployment → **Promote** / redeploy; or revert the PR on GitHub and let `playtest` follow |
| Edge Functions | `git checkout <last-good-commit>` → `pnpm sync:engine` → redeploy functions                                                    |
| Database       | Forward-only: write a new migration that reverts the change. Never drop data without owner approval.                           |

## Incident checklist

1. **Detect:** smoke test fails, `metrics_functions_24h` shows 5xx > 1 % or p95 spike, players report errors.
2. **Contain:** if a release caused it, roll back web + functions (table above). If data exposure is suspected, rotate keys in Supabase → Project Settings → API Keys and Vercel env, then redeploy.
3. **Diagnose:** Supabase → Edge Functions → Logs (`Unhandled error …`), Postgres logs, `private.function_metrics`.
4. **Fix forward:** branch → fix + test → PR → CI → merge → deploy → smoke test.
5. **Record:** add an entry to `docs/DEVELOPMENT_CHANGELOG.md` (what happened, impact, fix, prevention).
