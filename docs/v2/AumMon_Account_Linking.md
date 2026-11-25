# AumMon — Account Linking (15.6 — draft, awaiting owner approval)

> Covers R6 and Q4. A guest becomes an account **without changing its user id**, so profile, stats and history stay.

## 1. Flow (Supabase "convert anonymous user")

1. Guest opens Profile → "บันทึกบัญชี" (save account). Allowed only outside an active match (avoids a token swap mid-round).
2. Client: `supabase.auth.updateUser({ email })`.
   - E-mail confirmation ON (production): Supabase sends a link; after the click the user is permanent (`is_anonymous = false`).
   - Dev keeps confirmation OFF for playtesting → permanent immediately.
3. Client: `supabase.auth.updateUser({ password })` (≥ 8 chars, existing password policy).
4. Client refreshes the session; the new JWT has `is_anonymous = false`; account-only features unlock.

- Same `auth.uid()` before and after → no data copy, nothing to merge, nothing duplicated.
- Display name is kept; the player can edit it afterwards.

## 2. E-mail already used (Q4: no merge in MVP)

- `updateUser({ email })` fails with `email_exists` → UI explains: "อีเมลนี้มีบัญชีอยู่แล้ว — เข้าสู่ระบบบัญชีนั้นได้ แต่ข้อมูลของ guest นี้จะไม่ถูกย้าย".
- Choosing "sign in" signs the guest out and into the existing account. The old guest keeps its data until the normal 30-day cleanup (it can be reused on the same browser only while its session lives — in practice it is abandoned).
- Server never merges two users; a merge tool is post-MVP if playtests show demand.

## 3. Other cases

| Case                                                  | Behaviour                                                                |
| ----------------------------------------------------- | ------------------------------------------------------------------------ |
| Guest taps "ออกจากระบบ"                               | Confirm dialog: the guest identity is lost on this device unless linked. |
| Link started, e-mail never confirmed                  | Still a guest; can retry or change the e-mail; cleanup rules unchanged.  |
| Account signs in on a device that has a guest session | Guest session replaced; guest left for cleanup.                          |
| Social login (Google / LINE)                          | Post-MVP via `linkIdentity` (needs manual linking enabled) — L1.         |
| Delete account                                        | `account-delete` works for both kinds.                                   |

## 4. Security

- Linking is done by Supabase Auth with the guest's own session; no custom Edge Function touches e-mail or password.
- Rate limits: Supabase `[auth.rate_limit]` e-mail / sign-in limits apply.
- Production e-mail confirmation ON (prevents linking someone else's address); SMTP for production is a launch task (Phase 14).

## 5. Tests (Phase 11)

- Backend: guest plays a match → links e-mail + password → same user id, stats unchanged, `is_anonymous = false`, account-only function now allowed.
- Backend: linking an existing e-mail returns `email_exists`; no rows change for either user.
- E2E: guest → Profile → save account → reload → still signed in as an account with the same nickname.

## 6. Open questions (owner)

| ID  | Question                                | Proposed default |
| --- | --------------------------------------- | ---------------- |
| L1  | Social login (Google / LINE) post-MVP?  | yes, post-MVP    |
| L2  | Linking blocked during an active match? | yes              |
