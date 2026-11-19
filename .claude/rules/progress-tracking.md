# Progress Tracking

Files (keep them matching the real repository state):

- `docs/DEVELOPMENT_ROADMAP.md` — Phases 1–7, tasks with IDs, dependencies, acceptance criteria.
- `docs/DEVELOPMENT_PROGRESS.md` — current phase/task, percentages, task status, latest verification.
- `docs/DEVELOPMENT_CHANGELOG.md` — newest first: date, task, key files, tests, decisions, remaining issues.

## Rules

- Task line format: `- [ ] **P.N** title — deps: …` ; status labels: `⏳ In progress`, `🔒 Blocked: reason`.
- Mark `[x]` only after verification (local checks + CI) succeeded.
- Percentages come from `pnpm progress` (counts checkboxes); never estimate or fabricate them.
- After each logical task: update roadmap checkbox, progress file and changelog, then commit them with the implementation in the same PR.
- Changelog: significant changes only, no trivial details.
- Follow phases in order; break them into small verifiable tasks; never silently skip a requirement; do not implement future-phase work early.
