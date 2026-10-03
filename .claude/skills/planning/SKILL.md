---
name: planning
description: Phase 2 of a flow. Turn an approved solution into a two-level task plan (sequential commit tasks, parallel subagent subtasks) including the playwright-cli automation task. Usage: /planning <flow-name>.
disable-model-invocation: true
---

# Planning

**Participants:** product owner (human) · architect · coder · verifier
**Input:** `.claude/flows/<name>/0.requirements.html` and `0.solution.html`, both approved.
**Output:** `.claude/flows/<name>/1.plan.md` (template `templates/flows/1.plan.md`).

## Steps

1. **Read inputs** — architect reads both documents and the current codebase areas named in the solution's *Components touched* table.
2. **Draft level-1 tasks** — architect.
   - Each task = one commit, leaves the app working, is reviewable on its own. Order them so later tasks build on earlier ones (data → logic → UI is a common order).
   - For each task: *Goal*, *Covers* (`AC-n`), *Done when*, *Reviewer focus*.
3. **Split into level-2 subtasks** — architect, then *coder* sanity-checks feasibility and file ownership.
   - Subtasks under one task run in parallel, so each lists the files it owns exclusively. Overlap → merge or re-split.
   - Typical size: one subagent, one sitting, a handful of files.
4. **Add the automation task** — *verifier* drafts the last task: one e2e scenario per `must` AC using `playwright-cli`, specs under `tests/e2e/<name>/`. Include fixtures / seed data subtasks if needed.
5. **Fill the task overview table** and the change log.
6. ⛔ **Gate** — product owner approves the plan (status `approved`). Only then may `/coding` start.

## Rules
- No code is written during planning.
- A task that cannot state *Done when* in one observable sentence is not ready; split or clarify.
- Keep plans short: ideally 3–6 level-1 tasks. Longer means the flow should be split in `/solution`.
