---
name: solution
description: Phase 1 of a module (epic). Clarify the module's requirements, then decide its work items - existing and missing Stories (Mxx-Fyy) and technical Tasks (Mxx-Tyy), what each delivers, dependencies and build order - and sync them to Jira. Usage: /solution <Mxx>.
disable-model-invocation: true
---

# Solution

**Participants:** product owner (human) · analyst · architect · designer · prototyper · verifier
**Delegation:** see *Delegation* in `.claude/README.md`. Each step below names the subagent to launch; the main session does not write the documents or screens itself.
**Input:** a module ID (`Mxx`, e.g. `M01`) and the product owner's request. The module's Epic and Stories come from `.claude/docs/0.functional-requirements.html` and Jira (see `tool-atlassian`).
**Prerequisite:** kickoff documents exist and are approved.

The solution is about one module and its **work items**: Stories `Mxx-Fyy` (functions) and technical Tasks `Mxx-Tyy` (shared or foundation work no Story owns). It decides which items exist, which are missing, which must be split, and what each one delivers. It does not plan commits: each item later becomes one flow with `/planning <item>`.

## Outputs

| Output | Template | Owner |
|---|---|---|
| `.claude/docs/<Mxx>/0.requirements.html` | `templates/modules/0.requirements.html` | analyst |
| `.claude/docs/<Mxx>/0.solution.html` | `templates/modules/0.solution.html` | architect + designer |
| `.claude/mockups/` shared parts (shell, styles, app.js, components) | — | designer |
| `.claude/mockups/screens/<id>.html` (new/changed screens) | — | prototyper (one per screen) |
| Jira Stories / Tasks under the module Epic | — | main session, after confirmation |

Scaffold with: `python .claude/scripts/scaffold.py module <Mxx>` (creates `.claude/docs/<Mxx>/` with both templates).

## Steps

1. **Scaffold** the module folder if it does not exist.
2. **Clarify & analyze** — launch the `analyst` subagent (Opus).
   - Read the module's Epic and Stories in Jira and the functional requirements; map the module to its theme (`TH-nn`). If the request fits no theme, say so and ask whether to extend the high-level requirements.
   - Analyst returns grouped clarifying questions with defaults; the main session asks them and launches a fresh analyst run with the answers to write the document. Record Q&A in the clarification log.
   - Write one user story per Story `Mxx-Fyy` with `AC-n` criteria: one sentence per AC, at most ~12 per Story, Given / When / Then only in the collapsed detail. A missing function is proposed as a new Story marked `new`. Status `draft`. More than about 4 Stories → one fresh analyst run per batch of Stories.
   - ⛔ **Gate 1** — product owner approves the requirements.
3. **Propose solution** — launch the `architect` and `designer` subagents (Opus) in parallel once Gate 1 passes.
   - Architect: **work items** — compare the Stories with what the module really needs; list existing, missing, changed, split and dropped items; add technical Tasks `Mxx-Tyy` for foundation or shared work (each with its own `AC-n`, continuing the module sequence); for every item: the work it delivers, components and expected files, acceptance, dependencies, release. Then the shared technical design, alternatives, impact on architecture, verification strategy per AC and the build order.
   - Designer: UX flow table (returned in its report, the architect writes it into `0.solution.html`), screen inventory update in the design-system doc, any new shared parts (shell markers, components, `app.js` hooks), and one **screen brief** per new or changed screen.
   - Build the screens with kickoff step 4.2–4.5 (build → assemble → screenshot → design review): one `prototyper` (Sonnet) per screen in parallel, `mockups.py`, `verifier` (Sonnet) screenshots, designer review.
   - Architect writes `0.solution.html` linking to the mockup screens, in fresh runs per part: (a) work items, (b) shared technical design, alternatives and verification strategy, (c) UX flow from the designer's report, mockup links and build order.
   - A new or split Story found here goes back to the `analyst`, who adds its user story and `AC-n` to `0.requirements.html`; the product owner re-approves that change before Gate 2.
   - ⛔ **Gate 2** — product owner approves the solution. Alternatives rejected stay in the document.
4. **Jira sync** — see `tool-atlassian`.
   - The `architect` (read-only) compares the approved work items with Jira and returns a change list: **create** (missing Story / Task), **update** (summary, description, parent, fixVersion, Theme that differ), **extra** (in Jira, not in the solution — report only).
   - The main session shows the change list to the product owner and asks to confirm. Yes → apply it, then write the keys into the *Jira* column of the work items table. No → skip; the solution stays approved.
5. **Hand-off.** If the solution changed the stack or added a component, update `.claude/docs/0.high-level-architecture.html` now. Suggest `/planning <item>` for the first item of the build order.

## Rules
- Talk about the module and its items, not about flows: a flow only exists once an item is planned.
- An item must be small enough for one flow: if it needs more than about six level-1 tasks, split it into two items here.
- Never skip Gate 1: items without approved ACs produce untestable plans.
- `AC-n` IDs are unique per module and never renumbered after approval; new ones are added at the end.
- Detailed questions (formats, fields, thresholds, edge cases) belong here, not in kickoff. Still group them and offer defaults.
- Re-run steps 2–4 when an item has to be added or split later; keep the change in the documents.
- Documents are bilingual (EN + VI in one file, sibling `lang="en"` / `lang="vi"` elements), same rule as kickoff.
- Every subagent step, Q&A round, review round and gate change is a fresh run within the *Context budget* of `.claude/README.md`; documents are passed by path and section, not pasted into prompts.
