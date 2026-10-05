---
name: tool-atlassian
description: Jira connection reference for project PNS - space facts, mapping of modules / functions / plan tasks to Jira issues, and how to read or write via the Atlassian MCP tools or .claude/scripts/jira.py. Load before any Jira read or write.
user-invocable: false
---

# Tool — Atlassian (Jira)

**Purpose:** one place for the Jira facts and conventions used by `/solution`, `/planning`, `/coding`, `/testing` and `/implement`. Module solutions in `.claude/docs/<Mxx>/` and plans in `.claude/flows/` stay the source of truth for work; Jira mirrors them for tracking.

## Space

| Item | Value |
|---|---|
| Site | `https://datntdev.atlassian.net` |
| cloudId | `2ef71961-7810-4e16-9a0d-a3e5c405274c` |
| Space | Projects.NovelStudio · key `PNS` · team-managed |

| Issue type | id | Used for |
|---|---|---|
| Epic | 10001 | module `Mxx` |
| Story | 10004 | function `Mxx-Fyy` |
| Task | 10003 | technical work item `Mxx-Tyy` |
| Subtask | 10002 | plan task `T<n>` under its Story or Task |
| Bug | 10006 | — |

| Field | Meaning |
|---|---|
| `customfield_10042` | Theme (labels, e.g. `TH-01`) — on Epic, Story, Task |
| `customfield_10015` | Start date |
| `duedate` | Due / end date |
| `fixVersions` | Release |
| `parent` | Parent issue |

**Workflow:** `To Do` → `In Progress` → `In Review` → `Done` (transition ids 11, 21, 31, 41). Transition by status name, not id.

## Mapping

Seeded from `.claude/docs/0.functional-requirements.html`.

| Jira | Summary format | Parent | Theme | fixVersion | Dates |
|---|---|---|---|---|---|
| Epic | `M01 · App Shell & Workspace` (PNS-1…PNS-22 = M01…M22, PNS-122 = M00) | — | yes | one or more | Start + Due (Timeline) |
| Story | `M01-F01 · Navigation` | module Epic | yes | exactly one | none |
| Task | `M01-T01 · Workspace & tooling` | module Epic | Epic's Theme | exactly one | none |
| Subtask | `T<n> · <task title> [<flow>]` | the Story / Task the flow implements | — | — | none |

- **Release** names: `R<release>.<part>`, e.g. `R1.1` … `R10.4` — one per roadmap Part.
- **Epic dependencies:** link type `Blocks`.
- **Story / Task** are created or updated by `/solution` (step 4) from the work items of `.claude/docs/<Mxx>/0.solution.html`. Story description: *Functions* (EN + VI, as seeded) + *Acceptance* (`AC-n` list) + path `.claude/docs/<Mxx>/0.requirements.html`. Task description: *Work*, *Acceptance* (`AC-n`), *Depends on* + path `.claude/docs/<Mxx>/0.solution.html`.
- **Subtasks** are created by `/planning` (step 7). Description: *Goal*, *Covers*, *Done when* from the plan + path `.claude/flows/<flow>/1.plan.md`.
- Level-2 subtasks `T<n>.<m>` are not tracked in Jira.
- Keys are written back: Story / Task keys into the *Jira* column of the work items table in `0.solution.html`; Subtask keys into `1.plan.md` (header `Jira` row, `Jira` column of the task overview).
- **Item dependencies** inside a module (from the work items table): link type `Blocks`, same direction rule as Epics.

## Connect

| Way | Use for |
|---|---|
| Atlassian MCP `mcp__atlassian__*` (OAuth via `.mcp.json`) | day-to-day: `searchJiraIssuesUsingJql`, `getJiraIssue`, `createJiraIssue`, `editJiraIssue`, `getTransitionsForJiraIssue`, `transitionJiraIssue`, `addCommentToJiraIssue`, `createIssueLink` |
| `python .claude/scripts/jira.py` (REST) | releases / versions, fixVersion, bulk transitions |

Both are allowed. Pass `cloudId` to every MCP call.

```
python .claude/scripts/jira.py search "<jql>"                 # KEY | Type | Status | parent | fixVersions | summary
python .claude/scripts/jira.py get <KEY>                       # one line + description as plain text
python .claude/scripts/jira.py transition "<Status>" <KEY>...  # bulk status change by target status name
python .claude/scripts/jira.py versions                        # list releases
python .claude/scripts/jira.py version <NAME> [--start D] [--release D] [--description T]   # create or update a release
python .claude/scripts/jira.py fix-version <NAME> <KEY>...     # add a release to issues
```

- `jira.py` needs env vars `JIRA_EMAIL`, `JIRA_API_TOKEN`, set in `.claude/settings.local.json` → `env` (gitignored).
- **Gotcha:** REST `POST /issueLink` with type `Blocks`: `inwardIssue` = the blocker, `outwardIssue` = the blocked issue. With MCP `createIssueLink`, read the link back on the issue to confirm the direction.

## JQL recipes

| Need | JQL |
|---|---|
| Stories of a module | `project = PNS AND issuetype = Story AND parent = PNS-1` |
| Tasks of a module | `project = PNS AND issuetype = Task AND parent = PNS-1` |
| Stories by id prefix | `project = PNS AND issuetype = Story AND summary ~ "M01-F*"` |
| One Story / Task by exact id | `project = PNS AND summary ~ "\"M01-F01\""` |
| Subtasks of a Story | `parent = PNS-23` |
| Items of a release | `project = PNS AND fixVersion = R1.1` |
| Open Subtasks of a flow | `project = PNS AND summary ~ "\"<flow>\"" AND status != Done` |

`summary ~` is text matching, not equality: quote the id as a phrase and check the result before acting on it.

## Rules
- Reading is free for the main session and subagents.
- Every write (create, edit, transition, link, comment, version, fixVersion) is done only by the main session, and only after the product owner confirms the concrete list of changes in the chat.
- Status moves in `/coding` are confirmed once per run (its step 0); the yes covers only the moves `/coding` defines, for that run.
- `/implement` confirms once per run (its step 1); with `--auto` the flag itself is the confirmation. Either covers only the moves `/implement` defines, for that run.
- Subagents never write to Jira; they return proposed changes in their report.
- Never delete Jira issues; report extras instead.
- Never print, echo or commit the API token.
