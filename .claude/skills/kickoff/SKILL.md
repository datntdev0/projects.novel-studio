---
name: kickoff
description: Phase 0 of a new project. Clarify the problem with the product owner, then produce high-level requirements, high-level architecture, the design system and a first UX/UI prototype. Run once per project.
disable-model-invocation: true
---

# Kickoff

**Participants:** product owner (human) · analyst · designer · architect
**When:** first session of a project, or when the product direction is reset.

## Outputs

| Output | Template | Owner |
|---|---|---|
| `.claude/docs/0.high-level-requirements.html` | `templates/docs/0.high-level-requirements.html` | analyst |
| `.claude/docs/0.high-level-architecture.html` | `templates/docs/0.high-level-architecture.html` | architect |
| `.claude/docs/0.design-system.html` | `templates/docs/0.design-system.html` | designer |
| `.claude/mockups/` (index.html, styles.css, app.js) | `templates/mockups/` | designer |

Scaffold them with: `python .claude/scripts/scaffold.py docs`

## Steps

1. **Intake.** Ask the product owner for the raw idea. Do not structure it yet.
2. **Clarify & analyze** — *analyst* leads.
   - Ask grouped questions covering: problem statement · users · theme requirements (epic-level capabilities, `TH-nn`) · constraints · success metrics. Offer a default for each question.
   - Write `0.high-level-requirements.html`. Status `draft`.
   - ⛔ **Gate 1** — product owner reviews the document in the browser and approves (status → `approved`) or answers more questions.
3. **Propose architecture** — *architect* leads.
   - Propose a technical stack with alternatives, system context, components, conventions, ADR-lite decisions. Testing row must include `playwright-cli`.
   - Write `0.high-level-architecture.html`.
   - ⛔ **Gate 2** — product owner approves the stack.
4. **Design system & prototype** — *designer* leads.
   - Define tokens, type, spacing, component inventory in `0.design-system.html`.
   - Scaffold `.claude/mockups/` and build one screen per `must` theme, plus the components reference screen.
   - ⛔ **Gate 3** — product owner walks through the prototype and approves.
5. **Wrap-up.** Update the project `README.md` with a short pointer to `.claude/docs/`. Suggest the first flow to start with `/solution <name>`.

## Rules
- Agents may run in parallel in step 2–4 only after the previous gate is approved; the architecture depends on requirements, the design on both.
- Every document starts from its template and keeps the `claude.css` link. No Claude.ai artifacts: everything lives in the repo.
- Keep the kickoff to the level of themes. Feature-level detail belongs to flows.
