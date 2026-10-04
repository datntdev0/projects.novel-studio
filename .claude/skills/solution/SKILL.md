---
name: solution
description: Phase 1 of a flow. Discuss one requirement with the product owner, clarify it into testable acceptance criteria, propose a solution and update the prototype. Usage: /solution <flow-name>.
disable-model-invocation: true
---

# Solution

**Participants:** product owner (human) · analyst · architect · designer · prototyper · verifier
**Delegation:** see *Delegation* in `.claude/README.md`. Each step below names the subagent to launch; the main session does not write the documents or screens itself.
**Input:** a flow name (kebab-case, e.g. `chapter-editor`) and the product owner's request.
**Prerequisite:** kickoff documents exist and are approved.

## Outputs

| Output | Template | Owner |
|---|---|---|
| `.claude/flows/<name>/0.requirements.html` | `templates/flows/0.requirements.html` | analyst |
| `.claude/flows/<name>/0.solution.html` | `templates/flows/0.solution.html` | architect + designer |
| `.claude/mockups/` shared parts (shell, styles, app.js, components) | — | designer |
| `.claude/mockups/screens/<id>.html` (new/changed screens) | — | prototyper (one per screen) |

Scaffold with: `python .claude/scripts/scaffold.py flow <name>` (creates the folder with all stage templates).

## Steps

1. **Scaffold** the flow folder if it does not exist.
2. **Clarify & analyze** — launch the `analyst` subagent (Opus).
   - Map the request to a theme (`TH-nn`). If it fits no theme, say so and ask whether to extend the high-level requirements.
   - Analyst returns grouped clarifying questions with defaults; the main session asks them and sends the answers back. Record Q&A in the clarification log.
   - Write user stories and `AC-n` criteria. Status `draft`.
   - ⛔ **Gate 1** — product owner approves the requirements.
3. **Propose solution** — launch the `architect` and `designer` subagents (Opus) in parallel once Gate 1 passes.
   - Architect: approach, technical design (components, data, interfaces, sequence), alternatives, impact on architecture, verification strategy per AC.
   - Designer: UX flow table (returned in its report, the architect writes it into `0.solution.html`), screen inventory update in the design-system doc, any new shared parts (shell markers, components, `app.js` hooks), and one **screen brief** per new or changed screen.
   - Build the screens with kickoff step 4.2–4.5 (build → assemble → screenshot → design review): one `prototyper` (Sonnet) per screen in parallel, `mockups.py`, `verifier` (Sonnet) screenshots, designer review.
   - Architect writes `0.solution.html` linking to the mockup screens.
   - ⛔ **Gate 2** — product owner approves the solution. Alternatives rejected stay in the document.
4. **Hand-off.** If the solution changed the stack or added a component, update `.claude/docs/0.high-level-architecture.html` now. Suggest `/planning <name>`.

## Rules
- One flow = one coherent increment that can be planned as a short sequence of commits. If it grows beyond roughly five level-1 tasks, split into two flows.
- Never skip Gate 1: planning without approved ACs produces untestable tasks.
- Detailed questions (formats, fields, thresholds, edge cases) belong here, not in kickoff. Still group them and offer defaults.
- Documents are bilingual (EN + VI in one file, sibling `lang="en"` / `lang="vi"` elements), same rule as kickoff.
