# AumMon — Master Project Handoff

> Entry point for a new session. Updated: 2026-11-22. Numbers: `pnpm progress`.

## Product

Casual Discard Edition — 2–8 player shed-your-hand card game with 16 Everyday Objects (`aummon_game_spec.md`, rules in `docs/discard/`). Modes: Solo vs bots, Online. Ruleset `9` (Quick Match + balance pack), engine `3.0.0`.

## Status

| Area                               | State                                                                          | Details                                                |
| ---------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------ |
| Game (engine, backend, UI)         | Live on Dev, awaiting owner playtest (12.8)                                    | `docs/DEVELOPMENT_PROGRESS.md`                         |
| Quick Match (5–10 min, 20 s turns) | **live on Dev — ruleset "8"** (12.12); playtest next                           | `docs/discard/AumMon_Quick_Match_Rules.md`             |
| Quality 9–10 upgrade               | audit + proposals done (12.13); **owner decisions Q1–Q4**; no human scores yet | `docs/discard/AumMon_Game_Design_Upgrade.md`           |
| VIP / gacha                        | design later (12.7), no payments                                               | spec §1                                                |
| Art production                     | pipeline ready, waiting for Art Direction choice (13.2); no images yet         | `docs/art-production/AumMon_Art_Production_Handoff.md` |
| Production deploy                  | blocked on owner (6.8, 7.3, 7.8)                                               | progress file                                          |

## Key documents

| Topic                                 | File                                  |
| ------------------------------------- | ------------------------------------- |
| Rules / cards                         | `docs/discard/`                       |
| Architecture, DB, security, test plan | `aummon_project_blueprint.md`         |
| Roadmap / progress / changelog        | `docs/DEVELOPMENT_*.md`               |
| Colors / UI tokens                    | `docs/color_design_system.md`         |
| Art pipeline                          | `docs/art-production/`                |
| Admin / operations                    | `docs/ADMIN.md`, `docs/OPERATIONS.md` |
