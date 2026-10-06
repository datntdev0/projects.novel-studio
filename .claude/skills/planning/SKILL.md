---
name: planning
description: Phase 2, per work item. Turn one approved Story (Mxx-Fyy) or technical Task (Mxx-Tyy) of a module into a flow with a two-level task plan (sequential commit tasks, parallel subagent subtasks) including the Playwright Test automation task. Usage: /planning <Mxx-Fyy|Mxx-Tyy>.
disable-model-invocation: true
---

# Planning

**Participants:** product owner (human) · architect (Opus) · coder (Sonnet) · verifier (Sonnet)
**Delegation:** see *Delegation* in `.claude/README.md`. The main session does not write the plan itself.
**Input:** one work item ID from the *Work items* table of `.claude/docs/<Mxx>/0.solution.html`; that document and `0.requirements.html` are approved.
**Output:** flow `.claude/flows/<item>/` (item ID in lower case, e.g. `m01-f01`) with `1.plan.md` (template `templates/flows/1.plan.md`) · Jira Subtasks per `tool-atlassian` (after confirmation).

## Steps

0. **Scaffold** the flow: `python .claude/scripts/scaffold.py flow <item>` (e.g. `m01-f01`). Check that the item's dependencies in the work items table are `done`, or that the product owner accepts starting early.
1. **Read inputs** — launch the `architect` subagent (Opus); it reads the item's row and section in `0.solution.html`, its `AC-n` (Story: in `0.requirements.html`; Task: in `0.solution.html`), the shared technical design, and the current codebase areas named in the item's *Components touched* table.
2. **Draft level-1 tasks** — architect.
   - Each task = one commit, leaves the app working, is reviewable on its own. Order them so later tasks build on earlier ones (data → logic → UI is a common order).
   - For each task: *Goal*, *Covers* (`AC-n`), *Done when*, *Reviewer focus*.
3. **Split into level-2 subtasks** — architect, then a `coder` subagent (Sonnet) sanity-checks feasibility and file ownership (read-only, reports issues).
   - Subtasks under one task run in parallel, so each lists the files it owns exclusively. Overlap → merge or re-split.
   - Size: one coder run within the *Context budget* of `.claude/README.md`: at most about 5 owned files and a short list of files to read. Bigger → split into more subtasks, or move part of it to the next level-1 task.
4. **Add the automation task** — a `verifier` subagent (Sonnet) drafts the last task: one e2e scenario per `must` AC of the item as a Playwright Test spec under `verify/specs/<flow>/`, run by `pnpm verify <flow>`. Include shared fixtures / seed data subtasks if needed.
5. **Fill the task overview table** and the change log.
6. ⛔ **Gate** — product owner approves the plan (status `approved`). Then set the item's *Status* to `planned`, linked to the flow, in the work items table of `0.solution.html`. Only then may `/coding` start.
7. **Jira sync** — see `tool-atlassian`.
   - The `architect` (read-only) compares the approved plan with Jira: for each level-1 task `T<n>`, its Subtask under the item's Story / Task. It returns a change list: **create**, **update** (summary, description that differ), **extra** (in Jira, not in the plan — report only).
   - The main session shows the change list to the product owner and asks to confirm. Yes → apply it, then write the keys into `1.plan.md` (header `Jira` row, `Jira` column of the task overview) and the change log. No → skip; the plan stays approved.
   - Re-run this step whenever the plan changes later (e.g. fix tasks added by `/testing`).

## Rules
- One flow = one work item. Never plan two items in one flow, and never plan an item that is not in the approved work items table.
- No code is written during planning.
- A task that cannot state *Done when* in one observable sentence is not ready; split or clarify.
- Keep plans short: ideally 3–6 level-1 tasks. Longer means the item should be split in `/solution` of its module.
- Each subagent step (draft in steps 1–3, feasibility check, automation task, Jira change list, plan changes asked at the gate) is a fresh run that reads `1.plan.md` from disk; see *Context budget* in `.claude/README.md`.
