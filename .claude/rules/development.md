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

## Stop rules

Stop the current task (do not start the next) when: owner sign-up/login/authorization or manual service setup is needed; credentials, project ref or env vars are missing; network/permissions are blocked; CI fails without a safe fix; data is at risk; docs conflict; architecture, stack or locked rules would change; costs, production changes or irreversible deletion are involved; a high-risk vulnerability is found; or results cannot be verified.
On stop: mark the task `[!]`, update progress, and tell the owner exactly which site, menu, steps and values to set and what to send back (never secrets via chat). Never fake completion with mocks. Resume from the same task.
Known owner blockers already listed in the progress file (e.g. 1.10, 1.12) do not stop unrelated local work.

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
