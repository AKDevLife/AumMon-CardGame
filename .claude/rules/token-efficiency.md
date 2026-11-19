# Token Efficiency

- Before any tool call, confirm its result is needed for the current task.
- Read only task-relevant files; use targeted search (Grep/Glob) instead of broad reads. Never re-scan the whole repo.
- Read large files by section; do not re-read files whose content is still valid in context.
- Do not restate project specs; cite the section instead (e.g. "spec §7 Rule 4").
- Summarize tool output; never reproduce it verbatim.
- No unnecessary docs, planning files, duplicate files, alternative solutions or long design rationale.
- Never repeat unchanged code; show only relevant diffs when code must be shown.
- Do not rerun checks that already passed on unchanged code.
- Token savings never justify lower quality, security, testing or correctness.
