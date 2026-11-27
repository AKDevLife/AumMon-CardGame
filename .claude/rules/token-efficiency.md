# Token Efficiency

- Before any tool call, confirm its result is needed for the current task.
- Read only task-relevant files; use targeted search (`grep -n "^## "`, then the section) instead of whole-file reads. Never re-scan the whole repo.
- Specs are long single files: read the heading list first, then only the needed section (`sed -n` / Read with offset). Work on one game → read only that game's SPEC/ROADMAP plus the platform section you touch.
- Do not re-read files whose content is still valid in context; do not restate docs — cite them (e.g. "BLUFF SPEC §1.4").
- Summarize tool output; never reproduce it verbatim. CI logs: save to a file and grep for errors instead of printing them.
- Plan complex tasks internally; communicate only important decisions. No plans for simple tasks.
- No unnecessary docs, duplicate code/docs, alternative solutions or long rationale. Never add a new doc file when a section in an existing spec fits.
- Do not rerun checks that already passed on unchanged code. Prefer `pnpm check:quiet` over `pnpm check`.
- Read only the top of `docs/DEVELOPMENT_CHANGELOG.md`; keep about 15 entries and delete older ones (git history keeps them).
- Token savings never justify lower quality, security, testing or correctness.
