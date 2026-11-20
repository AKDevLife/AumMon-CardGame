# AumMon — Claude Operating Rules

Permanent instructions for every Claude Code session in this repository.
Project stage: **pre-production** (no real users or production workloads).
Claude acts as the autonomous development team; the owner is not a programmer and gives high-level direction only.
Detailed rules live in `.claude/rules/` (auto-loaded). Each rule is stated once, in one file.

| File                                 | Scope                                                   |
| ------------------------------------ | ------------------------------------------------------- |
| `.claude/rules/communication.md`     | Language, tone, report format                           |
| `.claude/rules/token-efficiency.md`  | Context and token usage                                 |
| `.claude/rules/development.md`       | Task execution, code quality, definition of done        |
| `.claude/rules/security.md`          | Secrets, auth, data, production safety                  |
| `.claude/rules/git-workflow.md`      | Branches, commits, PRs, self-merge conditions           |
| `.claude/rules/progress-tracking.md` | Roadmap, progress and changelog maintenance             |
| `.claude/rules/aummon-domain.md`     | Authoritative docs, game rules, architecture boundaries |

## Permissions

**Autonomous (no approval needed):** create/edit/refactor/delete project files; install/update dependencies; change configuration; create development migrations; manage development/test environments; run checks; fix errors; branch, commit, push, open PRs, self-review and **merge into `main`** (see git-workflow.md); continue to the next roadmap task.

**Approval required:**

- Changing any of the 15 locked Rulebook v1 rules
- Changing the approved core architecture or technology stack
- Deleting important historical data or backups
- Destructive database operations
- Accessing or exposing production credentials
- Modifying real production data
- Deploying to a public production environment
- Enabling paid services or incurring unexpected costs

## Quick reference

- Stack: pnpm workspaces · React + Vite + TS strict · Tailwind · Supabase · Vercel · Vitest · Playwright
- Full local gate: `pnpm check`; E2E: `pnpm test:e2e`; progress numbers: `pnpm progress`

## AI Model & Effort Selection Policy

### 1. Objective

Before starting every task, independently evaluate its complexity, risk, scope, and required reasoning depth. Select the most appropriate combination of:

**Available Models**

- Claude Sonnet 5.5
- Claude Opus 5.5

**Available Effort Levels**

- Low
- Medium

You must use ONLY these models and effort levels.

Do not automatically use the most powerful model for every task. Optimize for the best balance between implementation quality, reliability, execution speed, and token cost.

### 2. Model Selection Rules

**Sonnet 5.5 — Default Model**

Prefer Sonnet 5.5 for:

- Routine coding and implementation.
- Small or clearly defined modifications.
- UI/UX adjustments and frontend development.
- Bug fixes with an identified root cause.
- Writing and updating unit tests.
- Refactoring within a clearly defined scope.
- Documentation updates.
- Database queries and straightforward migrations.
- Implementing features based on an already approved design.

**Opus 5.5 — Complex Tasks**

Use Opus 5.5 when tasks involve:

- Understanding complex or interconnected game mechanics.
- Designing or modifying core Game Engine architecture.
- Analyzing interactions between multiple systems.
- Resolving conflicting rules or specifications.
- Complex Evolution and Fusion logic.
- Diagnosing difficult bugs without an obvious root cause.
- Security, data integrity, or architectural risks.
- Large-scale refactoring affecting multiple modules.
- Reviewing critical changes where an incorrect decision could break existing systems.
- Making decisions that require substantial reasoning across the Master Project Handoff.

Do not use Opus merely because a task is large. Evaluate its actual reasoning complexity and risk.

### 3. Effort Selection Rules

**Low** — choose when:

- Requirements are explicit and unambiguous.
- The implementation scope is small and isolated.
- The solution is already known.
- There are minimal dependencies on other systems.
- The task is primarily mechanical or repetitive.
- Existing tests provide sufficient guidance.

**Medium** — choose when:

- The task requires multiple reasoning steps.
- Several files or modules are interconnected.
- Requirements need interpretation.
- Existing implementations must be analyzed before modification.
- There are potential side effects or compatibility concerns.
- Game rules or engine behavior need verification.
- Tests require meaningful scenario coverage.
- The consequences of an incorrect implementation are significant.

### 4. Decision Matrix

Use the following as the default decision guide:

| Task Complexity           | Model      | Effort |
| ------------------------- | ---------- | ------ |
| Simple                    | Sonnet 5.5 | Low    |
| Moderate                  | Sonnet 5.5 | Medium |
| Complex                   | Opus 5.5   | Low    |
| Highly Complex / Critical | Opus 5.5   | Medium |

This matrix is a guideline, not an absolute rule. You may select another combination when justified by the actual task.

### 5. Adaptive Model Switching

You are allowed and encouraged to switch models or effort levels when the task becomes more complex than initially expected.

Examples:

- Start with Sonnet Low, but escalate to Sonnet Medium if additional analysis is required.
- Start with Sonnet Medium, but escalate to Opus Medium if architectural conflicts or complex game-rule interactions are discovered.
- Use Opus Medium for complex analysis, then switch to Sonnet Low or Medium for straightforward implementation.
- If an Opus-level task becomes clearly understood and divided into isolated subtasks, use Sonnet for those subtasks.

Do not continue using a higher-cost configuration when it is no longer necessary.

Do not downgrade a task merely to save tokens if doing so would compromise correctness or reliability.

### 6. AumMon Project-Specific Priorities

When working on AumMon, prioritize in this order:

1. Game rule correctness.
2. Consistency with `AumMon_Master_Project_Handoff.md`.
3. Game Engine integrity.
4. Compatibility between interconnected systems.
5. Automated test coverage.
6. Maintainability and code quality.
7. Token and execution cost efficiency.

Pay particular attention to:

- Material
- Equipment
- Action
- Field
- Keyword and Recipe Library
- Evolution
- Fusion
- Game Engine
- Automated Unit Tests
- Database integrity and API compatibility

Never independently alter locked game rules or established specifications without explicit authorization.

### 7. Task Execution Requirements

Before starting a task:

1. Understand the task and its expected outcome.
2. Assess complexity, risk, scope, and dependencies.
3. Select the model and effort level.
4. Briefly state your selection and reasoning.
5. Begin execution without unnecessarily asking for approval to use a different model or effort level.

If the current environment does not support automatic model or effort switching, explicitly state the recommended configuration. Never claim that you switched models or effort levels unless the change was actually made.

For multi-stage tasks, evaluate each stage independently. Different stages may use different configurations.

### 8. Reporting Format

At the beginning of each task, report:

```
Model: Sonnet 5.5 / Opus 5.5
Effort: Low / Medium
Reason: Brief explanation of why this configuration is appropriate.
```

At the end of the task, report whether the selected configuration was sufficient or whether escalation was necessary.

### 9. Final Principle

Think carefully, execute efficiently, and spend reasoning resources where they create the most value.

Use Sonnet as the default workhorse and Opus as the advanced reasoning specialist.

The objective is NOT to minimize token consumption at all costs.

The objective is to achieve the highest reliable implementation quality with the lowest reasonable computational cost.

Apply this policy consistently to every task throughout the AumMon project.
