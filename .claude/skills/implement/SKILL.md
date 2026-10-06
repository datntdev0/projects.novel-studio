---
name: implement
description: Run one work item end to end - planning, coding and testing - in one command. Input is a Jira key (PNS-nn) or an item ID (Mxx-Fyy / Mxx-Tyy). Default mode stops for human review of the plan, of each task before its commit and of the test result; --auto runs without gates, moves the Jira item to In Review and reports to the human. Usage: /implement <PNS-nn|Mxx-Fyy|Mxx-Tyy> [--auto].
disable-model-invocation: true
---

# Implement

**Participants:** product owner (human) · every agent used by `/planning`, `/coding` and `/testing`.
**Delegation:** see *Delegation* in `.claude/README.md`. This skill only orchestrates; each phase follows its own skill file, with the overrides below.
**Input:** a Jira key (`PNS-nn`) or an item ID (`Mxx-Fyy` / `Mxx-Tyy`), plus an optional `--auto` flag.
**Outputs:** the outputs of `/planning`, `/coding` and `/testing` for one flow · Jira item moved to `In Progress`, then `In Review`.

## Modes

| Mode | Plan | Each `T<n>` | Test result | Jira writes |
|---|---|---|---|---|
| default | ⛔ human approves | ⛔ human reviews the diff before the commit | ⛔ human reviews the report | confirmed once in step 1 |
| `--auto` | auto-approved | committed after the reviewer approves | read by the main session | pre-confirmed by the `--auto` flag |

Both modes stop before the acceptance gate: the human accepts the report and merges `flow/<item>` (steps 6–7 of `/testing`).

## Steps

1. **Resolve the item.**
   - Jira key → read the issue (see `tool-atlassian`); the item ID is the prefix of its summary (`M01-F01 · Navigation` → `M01-F01`). It must be a Story or a Task.
   - Item ID → find its Jira key with the *One Story / Task by exact id* JQL recipe.
   - Check that the item is in the work items table of `.claude/docs/<Mxx>/0.solution.html`. Flow name = item ID in lower case.
   - If `.claude/flows/<flow>/1.plan.md` already exists, resume at the phase its status points to (`draft` → step 2, `approved` / `in-progress` → step 3, `done` → step 4).
   - Default mode: ask once whether to sync Jira status for this run (item → `In Progress` in step 3, → `In Review` in step 5).
2. **Plan** — follow `.claude/skills/planning/SKILL.md` steps 0–6, then:
   - default: ⛔ the human approves `1.plan.md` (planning step 6).
   - `--auto`: the main session sets the plan status `approved`, with *Approved by / on* = `auto-pilot · <date>`.
3. **Code** — follow `.claude/skills/coding/SKILL.md`, with these overrides:
   - Replace coding step 0 by the Jira choice of step 1; on the first task move the item to `In Progress` if it is `To Do`.
   - Between coding step 5 (reviewer `approved`) and step 6 (commit):
     - default: ⛔ show the human the task block, the reviewer verdict and `git diff --stat`; commit only after approval. Requested changes go to fresh coder run(s) for the owning subtasks, then a fresh reviewer, then this gate again.
     - `--auto`: commit directly.
4. **Test** — follow `.claude/skills/testing/SKILL.md` steps 1–4, then:
   - default: ⛔ the human reviews `3.test-report.html` and triages defects (testing step 4).
   - `--auto`: fix every `blocker` / `major` defect via testing step 4; defer `minor` / `nit` to follow-ups.
5. **Jira: In Review** — when the conditions of testing step 5 are met:
   - default: if Jira sync was accepted in step 1, move the item to `In Review`.
   - `--auto`: move the item to `In Review`.
6. **Report** — reply to the human (≤ 15 lines): item and Jira key, branch, commits per `T<n>`, test verdict with the report path, decisions taken by auto-pilot, deferred defects, and the next action (accept the report and merge, testing steps 6–7).

## Blockers in `--auto`

A blocker is anything that would stop the flow: an open question from an agent, a reviewer verdict still `changes-requested` after two rounds, a `blocker` / `major` defect still open after one fix round, a failing build or test that a coder cannot fix.

| Severity | When | Action |
|---|---|---|
| critical | security or data-loss risk, breaks an existing feature, or the approved requirements / solution would have to change | stop and report to the human |
| high | a `must` AC cannot be met, or a product / UX decision is not answered by the module documents | stop and report to the human |
| medium · low | anything else | decide the option closest to the module documents, continue, and record it |

- Record every decision in the *Change log* of `1.plan.md` as `auto-pilot: <severity> · <decision> · <reason>` and list it in the step 6 report.
- On a stop: leave the plan and task statuses as they are (task `blocked` if it cannot continue), do not move Jira to `In Review`, and report the blocker with its severity and the options.

## Rules
- One run = one work item = one flow.
- No Jira Subtasks: skip every Subtask sync and move of the phase skills (planning step 7, coding Subtask moves, the re-sync in testing step 4).
- `--auto` covers only the Jira writes this skill defines (item → `In Progress`, → `In Review`), for that run. Never move the item to `Done`.
- Never merge `flow/<item>` or set the item `done`; that stays with the human after acceptance.
- All other rules of `/planning`, `/coding` and `/testing` still apply, including the *Context budget* of `.claude/README.md`: fresh subagent per run, never `SendMessage` to a finished one.
- The main session keeps its own context small: it reads agent reports and `git diff --stat`, not whole files or full diffs. When it grows large, finish the current commit, then tell the human to `/clear` and re-run `/implement <item> [--auto]`; step 1 resumes from `1.plan.md`.
