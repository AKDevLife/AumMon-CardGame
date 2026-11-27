# AumMon Domain

## Authoritative documents (read only the section you need)

| Scope                                                              | Spec                               | Roadmap                               |
| ------------------------------------------------------------------ | ---------------------------------- | ------------------------------------- |
| Platform (brand, identity, rooms, SDK, content, UI, security, ops) | `docs/platform/PLATFORM_SPEC.md`   | `docs/platform/ROADMAP.md`            |
| AumMon BLUFF (`bluff`, ruleset "2")                                | `docs/games/bluff/SPEC.md`         | `docs/games/bluff/ROADMAP.md`         |
| AumMon Object Battle Card (`edo_battle`, ruleset "13")             | `docs/games/object-battle/SPEC.md` | `docs/games/object-battle/ROADMAP.md` |

Owner decisions: platform → PLATFORM_SPEC §5; Object Battle → its SPEC §5; BLUFF → its SPEC open-question tables.

## Rules

- Platform decisions and each game's rules change only with owner approval; result-affecting changes require a new `ruleset_version` for that game (history in the changelog).
- Never invent missing mechanics. Never silently resolve conflicting requirements; record them in the game's SPEC, mark affected tasks blocked, and continue with unblocked work.
- New games plug into the platform (engine module + `public.games` row + `src/platform/games.ts` + UI) without redesigning shared services or the brand.
- Approved architecture: React + Vite + TS strict, Tailwind, Supabase (Auth, PostgreSQL, Edge Functions, Realtime), Vercel.
- `packages/game-engine` stays pure TypeScript: no React, UI, Supabase, Node/Deno/browser APIs, I/O, `Math.random` or wall-clock time (enforced by ESLint, tsconfig and architecture test — never relax these).
- Server-authoritative: clients send intent only; the server computes all results. Bots run server-side and see only public data / their seat's allowed data.
- RLS on every exposed table; the `private` schema is never exposed through the Supabase API.
- One UI theme for the whole site: colours only via tokens in `src/styles/index.css`; shared shell `src/app/AppLayout.tsx`.
