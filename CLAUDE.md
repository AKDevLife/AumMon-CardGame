# AumMon — Claude Operating Rules

Permanent instructions for every Claude Code session in this repository.
Detailed rules live in `.claude/rules/` (auto-loaded). Each rule is stated once, in one file.

| File                                | Scope                                                   |
| ----------------------------------- | ------------------------------------------------------- |
| `.claude/rules/communication.md`    | Language, tone, report format                           |
| `.claude/rules/token-efficiency.md` | Context and token usage                                 |
| `.claude/rules/development.md`      | Code quality, testing, task execution                   |
| `.claude/rules/security.md`         | Secrets, auth, data, production safety                  |
| `.claude/rules/git-workflow.md`     | Branches, commits, PRs                                  |
| `.claude/rules/aummon-domain.md`    | Authoritative docs, game rules, architecture boundaries |

## Permissions

**Allowed without asking (within the approved task):** read/analyze code; create/edit source files; behavior-preserving refactors; add tests; run local test/lint/typecheck/build; create feature branches; commit and push to them; open PRs.

**Ask first:**

- Change locked game rules (Rulebook v1)
- Change architecture or technology stack
- Delete important files or data
- Run destructive database migrations
- Change production configuration
- Access or expose sensitive credentials
- Merge a PR
- Deploy to production
- Spend money or enable paid services

## Quick reference

- Stack: pnpm workspaces · React + Vite + TS strict · Tailwind · Supabase · Vitest · Playwright
- Full local gate: `pnpm check` (typecheck, lint, format, test, build, secret scan); E2E: `pnpm test:e2e`
