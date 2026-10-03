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
   - Ask grouped questions covering: problem statement · users · scope (goals / non-goals) · constraints · success metrics. Offer a default for each question.
   - **Stay high level.** At most ~8 questions, all at product level. Do not ask about the detail of a single theme or module (file formats, field lists, thresholds per feature); those questions belong to `/solution` of that flow. If the product owner's brief already answers something, record it as an assumption instead of asking.
   - Derive themes (`TH-nn`) from the brief. **Priority = build order**: a unique number per theme (1 = first), `later` for themes outside the first release. Never use must/should/could for themes.
   - Write `0.high-level-requirements.html` in both languages (EN + VI, see Rules). Status `draft`.
   - ⛔ **Gate 1** — product owner reviews the document in the browser and approves (status → `approved`) or answers more questions.
3. **Propose architecture** — *architect* leads.
   - Propose a technical stack with alternatives, system context, components, conventions, ADR-lite decisions. Testing row must include `playwright-cli`.
   - Write `0.high-level-architecture.html`.
   - ⛔ **Gate 2** — product owner approves the stack.
4. **Design system & prototype** — *designer* leads.
   - Define tokens, type, spacing, component inventory in `0.design-system.html`.
   - Scaffold `.claude/mockups/` and build one screen per theme planned for the first release (priority 1, 2, 3 …), plus the components reference screen.
   - ⛔ **Gate 3** — product owner walks through the prototype and approves.
5. **Wrap-up.** Update the project `README.md` with a short pointer to `.claude/docs/`. Suggest the first flow to start with `/solution <name>`.

## Rules
- Agents may run in parallel in step 2–4 only after the previous gate is approved; the architecture depends on requirements, the design on both.
- Every document starts from its template and keeps the `claude.css` / `claude.js` links. No Claude.ai artifacts: everything lives in the repo.
- **Bilingual documents.** Every HTML document is written in English and Vietnamese in the same file: each sentence appears twice as sibling elements `lang="en"` then `lang="vi"` (`<span>` inline, `<p>` / `<li>` block). IDs, code, dates, numbers and status pills carry no `lang` attribute. The EN/VI switch in the header toggles the visible language. Write EN first, then translate; never leave one language empty.
- Keep the kickoff to the level of themes. Feature-level detail belongs to flows.
