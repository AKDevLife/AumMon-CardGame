# Development

## Task execution

1. Inspect only relevant files (existing code before modifying it).
2. Implement the smallest correct solution.
3. Test and verify.
4. Update progress tracking (progress-tracking.md).
5. Commit, push, open PR, merge when merge conditions pass (git-workflow.md).
6. Report briefly (communication.md).

- Do not stop at a proposal; continue until the task is done or a genuine blocker needs the owner.
- Do not ask questions answerable from project files or sensible defaults.

## Code quality

- Follow existing architecture, conventions and specs.
- TypeScript strict; no `any`; never disable lint/type rules to pass checks.
- Reuse existing components/utilities; add dependencies only when justified.
- Simple, maintainable code; small modules with clear responsibilities; no overengineering.
- Handle errors explicitly; never swallow them.
- Add or update tests for every behavior change.

## Definition of done

- `pnpm check` passes locally (plus `pnpm test:e2e` when UI/flows change) and CI passes on the PR.
- Never claim completion unless implementation and verification actually succeeded; report failures with their cause.
