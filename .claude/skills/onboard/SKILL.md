---
name: onboard
description: Load project context at the start of a session. Reads the high-level docs, lists flows and their stage, and summarises where work stopped. Use when opening the project in a new session or when context was lost.
disable-model-invocation: true
---

# Onboard

**Participants:** the main session (no subagents needed).
**When:** start of every working session, after `/clear`, or when picking up a flow you did not write.

## Steps

1. Run `python .claude/scripts/status.py` — prints each flow with the stage files that exist and the task status counts from `1.plan.md`.
2. Read, in this order, skimming headings and status pills:
   - `README.md`
   - `.claude/docs/0.high-level-requirements.html` (themes, non-goals)
   - `.claude/docs/0.high-level-architecture.html` (stack, conventions, decisions)
   - `.claude/docs/0.design-system.html` (only if the next work touches UI)
3. For the flow the product owner wants to continue (or the most recent `in-progress` one): read its `1.plan.md`, then the last section of `2.review.md`.
4. Check `git status` and `git log --oneline -10` for uncommitted or recent work.
5. Reply with a short brief (≤ 15 lines):
   - project in one sentence · stack in one line
   - flows: name → stage → status
   - the exact next action (e.g. "T3.2 is `doing`, uncommitted changes in `src/x`; resume with `/coding <flow>`")
   - open questions that block progress, if any

## Rules
- Read-only. Onboarding never edits documents or code.
- Do not summarise the whole codebase; summarise state and next step.
