# AumMon — Guest-First Architecture (15.6 — approved)

> **APPROVED by owner 2026-11-25** (G1–G3 / L1–L2 = proposed defaults). Covers R1 (guest session) and the guest side of R2–R4. Account linking: `AumMon_Account_Linking.md`. Decisions P1 / Q2 (Supabase Anonymous Sign-ins), Q3 (Ranked account-only), Q7 (no bots in Casual rooms). Built in Phase 11; migrations listed in 15.10.

## 1. Identity model

| Kind    | How created                                                                | `auth.users.is_anonymous` | JWT claim `is_anonymous` |
| ------- | -------------------------------------------------------------------------- | ------------------------- | ------------------------ |
| Guest   | `supabase.auth.signInAnonymously({ options: { data: { display_name } } })` | `true`                    | `true`                   |
| Account | e-mail + password sign-up, or a guest that linked an e-mail                | `false`                   | `false`                  |

- Both use the Postgres role `authenticated` and a real `auth.uid()`, so every existing RLS policy keyed on `auth.uid()` keeps working for guests — no parallel "guest tables".
- `private.handle_new_user()` already creates `public.profiles` from `display_name` metadata (2–24 chars, fallback `Player-xxxxxx`) — reused unchanged.
- Session: supabase-js keeps the refresh token in `localStorage`; reload / reconnect keeps the same id. Clearing browser data = a new guest (UI warns: "ลิงก์อีเมลเพื่อเก็บโปรไฟล์ไว้").

## 2. Config changes (`supabase/config.toml` + Dev / prod dashboards)

- `enable_anonymous_sign_ins = true`.
- `[auth.rate_limit] anonymous_users = 30` per hour per IP (already set; keep).
- CAPTCHA (Cloudflare Turnstile, free) on anonymous sign-in **before public launch** (G1); closed playtest relies on the rate limit.

## 3. Authorization

- SQL helper `public.is_guest()` = `coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false)` (stable; in `public` because RLS policies run as `authenticated`, which has no usage on `private`; it reads only the caller's own claim).
- **Account-only** tables (future Ranked ratings, purchases, inventory, leaderboard entries) add a **restrictive** policy `using (not public.is_guest())` on top of the owner policy, so a missing check fails closed.
- Edge Functions: `requireUser()` returns `{ id, isGuest }` (from the verified JWT via `auth.getUser`, never from the request body). New `requireAccount()` rejects guests with `403 account_required` — used by Ranked, purchases and admin.
- Admin already needs an admin role + MFA `aal2`; guests can hold neither. `requireAdmin()` also rejects `isGuest` explicitly (defence in depth).
- Realtime room / match channels: authorized by seat membership (unchanged), so guests and accounts are treated the same.

| Feature                                              | Guest |  Account   |
| ---------------------------------------------------- | :---: | :--------: |
| Nickname, create / join Casual room, play, rematch   |  ✅   |     ✅     |
| Results + share, per-game Casual stats               |  ✅   |     ✅     |
| Report content                                       |  ✅   |     ✅     |
| Ranked, leaderboard, XP / rank, purchases (post-MVP) |  ❌   |     ✅     |
| Admin / content review                               |  ❌   | role + MFA |

## 4. Nickname

- `profiles.display_name`, editable any time (server command `profile-update`, 2–24 chars, trimmed, no control / zero-width characters, small Thai + English blocklist; not unique).
- Rooms store a nickname **snapshot** per seat at join, so a later rename cannot change match history or a live room.

## 5. Abuse and limits

- Guest creation: rate limit per IP (§2) + Turnstile at launch.
- Existing per-user command rate limits (`_shared/ratelimit.ts`) apply to guests unchanged; room create stricter for guests: 10 / hour.
- Join codes stay unguessable (existing) — guests cannot list rooms.

## 6. Guest lifetime and cleanup

- "Active" = `auth.users.last_sign_in_at` or last token refresh / command within 30 days (R1).
- Daily job (pg_cron → `private.cleanup_guests()`, security definer): delete `auth.users` where `is_anonymous` and inactive > 30 days and not seated in an active room / match. `profiles` cascade.
- Finished matches keep their rows: seat user ids become `null`, the nickname snapshot stays (keeps results and stats of other players intact). Exact FK changes → 15.10.
- Volume watch: every guest counts as a Supabase monthly active user (free plan quota) — admin dashboard shows guests created per day.

## 7. Privacy

- Guests give no PII. IP addresses are used only by the rate limiter (not stored with the user).
- `account-delete` works for guests too (deletes the guest immediately).

## 8. Tests (Phase 11)

- pgTAP: guest can read / write own rows only; guest blocked by restrictive account-only policy; anon role (no session) blocked; `cleanup_guests` deletes only inactive guests not in active rooms.
- Backend: anonymous sign-in → create room → second guest joins by code → match plays to results; guest gets `403 account_required` on an account-only function; rate limit returns 429.
- E2E: first visit → nickname → lobby without e-mail; reload keeps identity.

## 9. Open questions (owner)

| ID    | Question                                                                          | Proposed default |
| ----- | --------------------------------------------------------------------------------- | ---------------- |
| G1 ✅ | CAPTCHA (Turnstile, free) only before public launch, not for the closed playtest? | yes              |
| G2 ✅ | Guest expiry 30 days of inactivity (R1), finished match rows kept with nickname?  | yes              |
| G3 ✅ | Guest room-create limit 10 / hour?                                                | yes              |
