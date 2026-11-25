# AumMon — Game Module Compatibility (v2)

| Game       | Verdict               | Status (2026-11-25)                                                                                                                            |
| ---------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Dummy      | Retired (owner V9)    | Code removed (engine, UI, tests). `public.games` row disabled; rooms / matches kept as history. Rules archived in `docs/archive/games/dummy/`. |
| Poker      | Retired (owner V9)    | Same as Dummy; rules in `docs/archive/games/poker/`.                                                                                           |
| EDO Battle | Deferred (Q1 default) | Playable on Dev; hidden from the new home when the v2 home ships; keep / retire decided after BLUFF MVP.                                       |
| BLUFF      | New flagship          | Design Phase 3; needs the SDK simultaneous-decision extension (audit §3.2).                                                                    |

Admin: retired games can be filtered in history and switched off, never switched back on (no module).
