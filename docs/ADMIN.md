# Developer Admin — operations guide (Phase 9)

## How it works

- Login uses the normal **Supabase Auth** login page (`/login`), then open **`/admin`**. There is no admin registration page.
- Role `super_admin` lives in `private.admin_roles` (schema not exposed to the API). Players cannot read or write it.
- Every admin request goes to the `admin-api` Edge Function, which checks on the server: valid session → `super_admin` role → **MFA (aal2)**. Hiding the UI is not the security boundary.
- Card, recipe and deck data are **read-only** in the dashboard (rule changes go through `aummon_game_spec.md` + PR). Admins see **public match data only** (no hands, deck order or RNG) — no impersonation.
- Every admin change (disable/enable player, close room, abandon match, bot simulation, grant/revoke admin) is written to the append-only `private.admin_audit_log`.
- Tier comes from the function secret `AUMMON_ENV` (`development` / `staging` / anything else = `production`). Dev tools (bot simulation) run only in `development`.

## Create the first admin (per environment)

Each Supabase project (Dev, Staging, Production) has its **own** admins. Never reuse Dev credentials elsewhere.

1. **Owner** opens the project in the Supabase Dashboard → **Authentication → Users → Add user → Create new user**.
   Enter the admin email and a strong password of your own (tick _Auto Confirm User_). Never send the password in chat.
2. **Operator** grants the role once (SQL editor or management API, server side):
   ```sql
   select private.grant_admin('admin@example.com', 'bootstrap: <who>/<date>');
   ```
   Re-running is safe (idempotent, audited only once). Nothing runs on deploy.
3. Owner logs in at `/login`, opens `/admin`, scans the QR with an authenticator app and enters the 6-digit code (MFA).

Staging/Production: same steps, separate account, **only after owner approval** (task 7.8 / production rules).
Set `AUMMON_ENV` per project: `supabase secrets set AUMMON_ENV=development --project-ref <dev-ref>` (Staging: `staging`; Production: leave unset).

## Recovery

| Problem             | Fix                                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------------------- |
| Forgot password     | Dashboard → Authentication → Users → the user → **Send password recovery** (or set a new password there).     |
| Lost authenticator  | Dashboard → Authentication → Users → the user → remove the MFA factor; next `/admin` visit enrolls a new one. |
| Remove an admin     | `select private.revoke_admin('admin@example.com', 'by <who>');` (audited).                                    |
| Disabled by mistake | Admins cannot disable admins; for players use Players → เปิดใช้, or Dashboard → user → unban.                   |
