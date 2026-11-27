# AumMon BLUFF — Game Roadmap

Spec: `docs/games/bluff/SPEC.md`. Platform work (guest, rooms, SDK, UI) is in `docs/platform/ROADMAP.md`.
Format: `- [ ] **P.N** task — deps: … — PR #n (date)` · `[ ]` not started · `[~]` in progress · `[x]` completed (verified) · `[!]` blocked (reason inline). Percentages: `pnpm progress` (all roadmaps, top-level tasks only).

## Phase 15 — BLUFF (flagship, owner 2026-11-25)

- [x] **15.3** BLUFF game design + scoring model + simulation → owner approval — deps: 15.2 — PR #120 (2026-11-25)
- [x] **15.4** 2–8 player balance design (2 / 3–4 / 5–8 variants) — deps: 15.3 — PR #121 (2026-11-25)
- [x] **15.9** Content management design (schema, review flow, first ~150 items drafted) — deps: 15.3 — PR #122 (2026-11-25)
- [~] **15.12** Closed playtest on real phones (2 / 4 / 8 players) — deps: 15.11 — plan `docs/games/bluff/SPEC.md` §4; waiting for the owner session
- [ ] **15.13** Balance & UX iteration — deps: 15.12
