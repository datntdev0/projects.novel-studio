# Claude framework — solo-developer

A lightweight delivery process for one human (product owner) working with a small cast of Claude agents.
Every artifact is a local file in this repository; nothing lives in Claude.ai artifacts.

## Lifecycle

```
                 ┌──────────── per project ────────────┐
  /kickoff ──►  docs/0.high-level-requirements.html
                docs/0.high-level-architecture.html
                docs/0.design-system.html  +  mockups/
                 └─────────────────────────────────────┘
                 ┌──────────── per flow (feature) ─────┐
  /solution  ──► flows/<name>/0.requirements.html ─► ⛔ approve
                 flows/<name>/0.solution.html     ─► ⛔ approve
  /planning  ──► flows/<name>/1.plan.md           ─► ⛔ approve
  /coding    ──► commits (one per T<n>) + flows/<name>/2.review.md
  /testing   ──► flows/<name>/3.test-report.html  ─► ⛔ accept
                 └─────────────────────────────────────┘
  /onboard   ──► read-only brief of the current state (any time)
```

`⛔` = gate: the product owner approves in the browser before the next skill runs.

## Cast

| Agent | Phase(s) | Writes |
|---|---|---|
| analyst | kickoff, solution | requirements documents |
| designer | kickoff, solution | design-system doc, `mockups/` |
| architect | kickoff, solution, planning | architecture doc, solution doc, plan |
| coder | coding | source code (only files its subtask owns) |
| reviewer | coding | `2.review.md` |
| verifier | planning, coding (test task), testing | e2e specs, test report |

## Directory

```
.claude/
├── agents/        one .md per agent (system prompt + tools)
├── skills/        one folder per phase: kickoff · onboard · solution · planning · coding · testing
├── docs/          project-level HTML documents (kickoff outputs)
├── mockups/       static HTML/CSS/JS prototype (designer owns)
├── flows/<name>/  per-feature documents: 0.requirements · 0.solution · 1.plan · 2.review · 3.test-report · evidence/
├── templates/     sources for every document above + assets/claude.css (shared stylesheet)
└── scripts/       scaffold.py (create docs / flows from templates) · status.py (state of all flows)
```

## Conventions

- **IDs**: themes `TH-nn` · acceptance criteria `AC-n` · decisions `AD-nn` · tasks `T<n>` / `T<n>.<m>` · scenarios `S<n>` · defects `D<n>`. Never renumber after approval.
- **Numbering of files** = phase within the flow: `0.*` discovery, `1.*` plan, `2.*` build, `3.*` verify.
- **Plan tasks**: level 1 = one sequential commit; level 2 = parallel subagents with disjoint file ownership; last task is always e2e automation with `playwright-cli`.
- **Commits**: `<type>(<flow>): <title> [T<n>]` on branch `flow/<name>`.
- **Documents**: HTML for anything the product owner reads and approves (styled by `templates/assets/claude.css`, light + dark); Markdown for files agents update continuously (`1.plan.md`, `2.review.md`).

## Quick start

```
python .claude/scripts/scaffold.py docs            # once, during /kickoff
python .claude/scripts/scaffold.py flow <name>     # per feature, during /solution
python .claude/scripts/status.py                   # any time, used by /onboard
python -m http.server 8765 --bind 127.0.0.1        # view docs/mockups via playwright-cli (file: is blocked)
```
