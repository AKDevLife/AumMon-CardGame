# Token Efficiency

- Before any tool call, confirm its result is needed for the current task.
- Read only task-relevant files; use targeted search instead of broad reads. Never re-scan the whole repo.
- Read large files by section; do not re-read files whose content is still valid in context.
- Do not restate project docs; cite the section instead (e.g. "spec §7 Rule 4").
- Summarize tool output; never reproduce it verbatim.
- Plan complex tasks internally; communicate only important decisions. No plans for simple tasks.
- No unnecessary docs, duplicate code/docs, alternative solutions or long rationale.
- Do not rerun checks that already passed on unchanged code.
- Token savings never justify lower quality, security, testing or correctness.
