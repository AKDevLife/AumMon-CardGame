# Development

## Task execution

1. Understand the objective.
2. Inspect only relevant files (existing code before modifying it).
3. Identify dependencies and risks.
4. Implement the smallest correct solution.
5. Run relevant checks.
6. Review the diff.
7. Report concisely (see communication.md).

- Simple tasks: no lengthy plan. Complex/high-risk tasks: short plan first; wait for approval when CLAUDE.md requires it.
- Do not ask questions answerable from project files.

## Code quality

- Follow existing architecture, conventions and specs.
- TypeScript strict; no `any`, no disabling lint/type rules to pass checks.
- Reuse existing components/utilities; avoid new dependencies unless justified.
- Simple, maintainable code; small modules with clear responsibilities; no overengineering.
- Handle errors explicitly; never swallow them silently.
- Add or update tests for every behavior change.

## Definition of done

- Required checks pass locally (`pnpm check`; `pnpm test:e2e` when UI/flow changes).
- Never claim completion unless implementation and verification actually succeeded. Report failures with their cause.
