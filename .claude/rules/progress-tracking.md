# Progress Tracking

Files (keep them matching the real repository state):

- Roadmaps (tasks with IDs, dependencies, acceptance criteria): `docs/platform/ROADMAP.md` (shared website / functions), `docs/games/bluff/ROADMAP.md`, `docs/games/object-battle/ROADMAP.md`. A task lives in exactly one roadmap.
- `docs/DEVELOPMENT_PROGRESS.md` — current phase/task, percentages, task status, latest verification.
- `docs/DEVELOPMENT_CHANGELOG.md` — newest first: date, task, key files, tests, decisions, remaining issues.

## Rules

- Task line: `- [ ] **P.N** title — deps: … — PR #n (YYYY-MM-DD)`. Status: `[ ]` not started, `[~]` in progress, `[x]` completed, `[!]` blocked (reason inline).
- Acceptance criteria per phase; blockers listed in the progress file with owner steps.
- Mark `[x]` only after acceptance criteria and verification (local checks + CI) succeeded.
- Percentages come from `pnpm progress` (counts checkboxes); never estimate or fabricate them.
- After each logical task: update roadmap checkbox, progress file and changelog, then commit them with the implementation in the same PR.
- Changelog: significant changes only, no trivial details.
- Follow phases in order; break them into small verifiable tasks; never silently skip a requirement; do not implement future-phase work early.
