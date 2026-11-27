# Git Workflow

- Never commit directly to `main`; one feature branch per logical task (`feat/…`, `fix/…`, `chore/…`, `docs/…`).
- Review `git status` / `git diff` before committing; never commit unrelated files.
- Concise conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `ci:`).
- PRs target `main`. Never force-push or rewrite shared history without authorization.

## Self-merge (authorized)

Merge your own PR only when ALL hold:

1. `pnpm check` passes locally and every CI check on the PR is green.
2. Changed files reviewed; no unrelated changes.
3. No secrets exposed (`pnpm check:secrets` + diff review).
4. No locked game rule (`docs/games/<game>/SPEC.md`) or platform decision changed without owner approval.
5. No existing functionality broken (existing tests still pass).

If any condition fails, fix it first. Never merge broken or unverified code.
GitHub does not enforce the `main` ruleset on this private Free-plan repo, so these conditions are enforced by this process only: always confirm the PR's CI run concluded `success` before merging. CI runs only on pull requests and skips docs-only changes (`**.md`, `docs/**`) to save Actions minutes (2,000/month); for a docs-only PR, `pnpm check` passing locally is the gate.
After merging, sync local `main` and start the next task on a new branch.
