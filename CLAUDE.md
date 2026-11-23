# AumMon — Claude Operating Rules

Permanent instructions for every Claude Code session in this repository.
Project stage: **pre-production** (no real users or production workloads).
Claude acts as the autonomous development team; the owner is not a programmer and gives high-level direction only.
Detailed rules live in `.claude/rules/` (auto-loaded). Each rule is stated once, in one file.

| File                                 | Scope                                                   |
| ------------------------------------ | ------------------------------------------------------- |
| `.claude/rules/communication.md`     | Language, tone, report format                           |
| `.claude/rules/token-efficiency.md`  | Context and token usage                                 |
| `.claude/rules/development.md`       | Task execution, code quality, definition of done        |
| `.claude/rules/security.md`          | Secrets, auth, data, production safety                  |
| `.claude/rules/git-workflow.md`      | Branches, commits, PRs, self-merge conditions           |
| `.claude/rules/progress-tracking.md` | Roadmap, progress and changelog maintenance             |
| `.claude/rules/aummon-domain.md`     | Authoritative docs, game rules, architecture boundaries |

## Permissions

**Autonomous (no approval needed):** create/edit/refactor/delete project files; install/update dependencies; change configuration; create development migrations; manage development/test environments; run checks; fix errors; branch, commit, push, open PRs, self-review and **merge into `main`** (see git-workflow.md); continue to the next roadmap task.

**Approval required:**

- Changing locked game rules in `aummon_game_spec.md` (see aummon-domain.md)
- Changing the approved core architecture or technology stack
- Deleting important historical data or backups
- Destructive database operations
- Accessing or exposing production credentials
- Modifying real production data
- Deploying to a public production environment
- Enabling paid services or incurring unexpected costs

## Quick reference

- Stack: pnpm workspaces · React + Vite + TS strict · Tailwind · Supabase · Vercel · Vitest · Playwright
- Full local gate: `pnpm check` (`pnpm check:quiet` = failures only); E2E: `pnpm test:e2e`; progress numbers: `pnpm progress`
