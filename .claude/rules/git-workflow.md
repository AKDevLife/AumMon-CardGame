# Git Workflow

- Never commit directly to `main`.
- One feature branch per task or logical change group (e.g. `feat/…`, `fix/…`, `chore/…`).
- Review changed files (`git status` / `git diff`) before committing; never commit unrelated files.
- Concise, conventional commit messages (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `ci:`).
- Run required checks before opening a PR; PRs target `main`.
- Never merge a PR without the owner's approval.
- Never force-push or rewrite shared history without authorization.
