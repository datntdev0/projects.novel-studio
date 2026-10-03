---
name: coding
description: Phase 3 of a flow. Execute an approved plan task by task - parallel coder subagents per subtask, reviewer pass, one commit per level-1 task. Usage: /coding <flow-name> [T<n>].
disable-model-invocation: true
---

# Coding

**Participants:** coder (several, parallel) · reviewer · verifier (for the test task) · product owner only on blockers.
**Input:** `.claude/flows/<name>/1.plan.md` with status `approved` or `in-progress`.
**Outputs:** commits on branch `flow/<name>` · updated statuses in `1.plan.md` · `2.review.md` entries.

## Loop — for each level-1 task `T<n>` in order

1. **Prepare.** Set plan status `in-progress`, task status `doing`. Ensure branch `flow/<name>` is checked out and the tree is clean.
2. **Fan out.** Launch one *coder* subagent per subtask `T<n>.<m>` **in parallel**. Each prompt contains: the subtask row, the parent task block, the relevant solution excerpt, and the explicit file ownership list. Subtasks of the test task go to the *verifier* instead.
3. **Collect.** Mark subtasks `done` as reports arrive. If a coder reports needing a file it does not own, resolve it yourself (small edit) or re-plan the subtask; note it in the plan change log.
4. **Integrate check.** Run the project's build / lint / unit tests once over the combined changes.
5. **Review.** Launch the *reviewer* for `T<n>`. Task status `review`.
   - `changes-requested` → send blockers/majors back to the owning coder(s), then re-review. Max two rounds; after that, escalate to the product owner.
   - `approved` → continue.
6. **Commit.** One commit: `<type>(<name>): <task title> [T<n>]`. Record the SHA in the task overview table, task status `done`.
7. Next task. After the last task set plan status `done` and suggest `/testing <name>`.

## Rules
- Never start `T<n+1>` before `T<n>` is committed.
- Coders do not commit; the main session commits after review.
- If a task turns out wrong (not just hard), stop and go back to `/planning` rather than improvising; record the reason in the plan change log.
- Keep `1.plan.md` as the single source of truth for progress; `/onboard` relies on it.
