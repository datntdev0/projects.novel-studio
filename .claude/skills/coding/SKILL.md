---
name: coding
description: Phase 3 of a flow (one work item). Execute an approved plan task by task - parallel coder subagents per subtask, reviewer pass, one commit per level-1 task. Usage: /coding <flow> [T<n>].
disable-model-invocation: true
---

# Coding

**Participants:** coder (Sonnet, several, parallel) · reviewer (Opus) · verifier (Sonnet, for the test task) · product owner only on blockers and the Jira question in step 0.
**Delegation:** see *Delegation* in `.claude/README.md`. The main session does not write application code itself, except the small ownership fixes in step 3.
**Input:** `.claude/flows/<flow>/1.plan.md` with status `approved` or `in-progress`.
**Outputs:** commits on branch `flow/<flow>` · updated statuses in `1.plan.md` · `2.review.md` entries · Jira statuses (if synced).

## Before the loop

0. **Jira status (once per run).** If `1.plan.md` has Jira keys, ask the product owner once whether to sync Jira status for this run (see `tool-atlassian`). If yes: when the first task starts, move the flow's item (Story / Task) to `In Progress` if it is `To Do`.

## Loop — for each level-1 task `T<n>` in order

1. **Prepare.** Set plan status `in-progress`, task status `doing`; on the first task also set the item's *Status* to `in-progress` in the work items table of `.claude/docs/<Mxx>/0.solution.html`. Ensure branch `flow/<flow>` is checked out and the tree is clean. Jira sync on → move the `T<n>` Subtask to `In Progress`.
2. **Fan out.** Launch one *coder* subagent per subtask `T<n>.<m>` **in parallel**. Each prompt contains: the subtask row, the parent task block, the relevant excerpt of the module solution (`.claude/docs/<Mxx>/0.solution.html`), the item's `AC-n` rows (Story: `0.requirements.html`; Task: `0.solution.html`), and the explicit file ownership list. Subtasks of the test task go to the *verifier* instead.
3. **Collect.** Mark subtasks `done` as reports arrive. If a coder reports needing a file it does not own, resolve it yourself (small edit) or re-plan the subtask; note it in the plan change log.
4. **Integrate check.** Run the project's build / lint / unit tests once over the combined changes.
5. **Review.** Launch the *reviewer* for `T<n>`. Task status `review`.
   - `changes-requested` → send blockers/majors back to the owning coder(s), then re-review. Max two rounds; after that, escalate to the product owner.
   - `approved` → continue.
6. **Commit.** One commit: `<type>(<flow>): <task title>`. Record the SHA in the task overview table, task status `done`. Jira sync on → move the `T<n>` Subtask to `Done`.
7. Next task. After the last task set plan status `done` and suggest `/testing <flow>`.

## Rules
- Never start `T<n+1>` before `T<n>` is committed.
- Coders do not commit; the main session commits after review.
- If a task turns out wrong (not just hard), stop and go back to `/planning` rather than improvising; record the reason in the plan change log.
- Keep `1.plan.md` as the single source of truth for progress; `/onboard` relies on it.
