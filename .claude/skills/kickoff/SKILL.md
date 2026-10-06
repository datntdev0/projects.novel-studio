---
name: kickoff
description: Phase 0 of a new project. Clarify the problem with the product owner, then produce high-level requirements, high-level architecture, the design system and a first UX/UI prototype. Run once per project.
disable-model-invocation: true
---

# Kickoff

**Participants:** product owner (human) · analyst · architect · designer · prototyper · verifier
**Delegation:** see *Delegation* in `.claude/README.md`. Each step below names the subagent to launch; the main session does not write the documents or screens itself.
**When:** first session of a project, or when the product direction is reset.

## Outputs

| Output | Template | Owner |
|---|---|---|
| `.claude/docs/0.high-level-requirements.html` | `templates/docs/0.high-level-requirements.html` | analyst |
| `.claude/docs/0.high-level-architecture.html` | `templates/docs/0.high-level-architecture.html` | architect |
| `.claude/docs/0.design-system.html` | `templates/docs/0.design-system.html` | designer |
| `.claude/mockups/` (shell.html, styles.css, app.js, screens/components.html) | `templates/mockups/` | designer |
| `.claude/mockups/screens/<id>.html` | — | prototyper (one per screen) |

Scaffold them with: `python .claude/scripts/scaffold.py docs`

## Steps

1. **Intake.** Ask the product owner for the raw idea. Do not structure it yet.
2. **Clarify & analyze** — launch the `analyst` subagent (Opus).
   - Analyst returns grouped questions covering: problem statement · users · scope (goals / non-goals) · constraints · success metrics. Offer a default for each question. The main session asks them and launches a fresh analyst run with the answers to write the document.
   - **Stay high level.** At most ~8 questions, all at product level. Do not ask about the detail of a single theme or module (file formats, field lists, thresholds per feature); those questions belong to `/solution` of that module. If the product owner's brief already answers something, record it as an assumption instead of asking.
   - Derive themes (`TH-nn`) from the brief. **Priority = build order**: a unique number per theme (1 = first), `later` for themes outside the first release. Never use must/should/could for themes.
   - Write `0.high-level-requirements.html` in both languages (EN + VI, see Rules). Status `draft`.
   - ⛔ **Gate 1** — product owner reviews the document in the browser and approves (status → `approved`) or answers more questions.
3. **Propose architecture** — launch the `architect` subagent (Opus).
   - Propose a technical stack with alternatives, system context, components, conventions, ADR-lite decisions. Testing row must include Playwright Test for e2e specs (`playwright-cli` is for agents' manual work only).
   - Write `0.high-level-architecture.html`.
   - ⛔ **Gate 2** — product owner approves the stack.
4. **Design system & prototype** — design on Opus, build on Sonnet.
   1. **Design** — launch the `designer` subagent (Opus). It writes `0.design-system.html`, replaces the template's example screen in the scaffolded `.claude/mockups/`, sets the tokens in `styles.css`, the shell (navigation, dialogs, one `<!-- @screen <id> -->` marker per screen), the `app.js` hooks and `screens/components.html` with every component the screens will need. It returns one **screen brief** per screen: one per theme planned for the first release (priority 1, 2, 3 …).
   2. **Build** — launch one `prototyper` subagent (Sonnet) per screen brief, **all in parallel**. Each prompt contains the brief and the file it owns: `.claude/mockups/screens/<id>.html`.
   3. **Assemble** — run `python .claude/scripts/mockups.py`. If a prototyper reported something missing from the shared parts, send the list to a fresh designer run, then rebuild the affected screens with fresh prototyper runs.
   4. **Screenshot** — launch the `verifier` subagent (Sonnet): serve the repo root, open every screen with `playwright-cli` at the **target viewports** of the project (the architecture document names them: for a desktop app its default and minimum window size; for a web app desktop plus a phone width), light and dark, and report the screenshot paths and any horizontal scroll or broken layout.
   5. **Design review** — send the screenshot paths to a fresh designer run (Opus). Fixes go to a fresh run of the owning prototyper (shared parts: designer). At most two rounds.
   - ⛔ **Gate 3** — product owner walks through the prototype and approves.
5. **Wrap-up.** Update the project `README.md` with a short pointer to `.claude/docs/`. Suggest the first module to start with `/solution <Mxx>`.

## Rules
- Steps 2–4 run in order: each starts only after the previous gate is approved; the architecture depends on requirements, the design on both. Inside step 4, prototypers run in parallel because each owns one screen file.
- Never edit `.claude/mockups/index.html` by hand; it is rebuilt by `mockups.py`.
- Every document starts from its template and keeps the `claude.css` / `claude.js` links. No Claude.ai artifacts: everything lives in the repo.
- **Bilingual documents.** Every HTML document is written in English and Vietnamese in the same file: each sentence appears twice as sibling elements `lang="en"` then `lang="vi"` (`<span>` inline, `<p>` / `<li>` block). IDs, code, dates, numbers and status pills carry no `lang` attribute. The EN/VI switch in the header toggles the visible language. Write EN first, then translate; never leave one language empty.
- Keep the kickoff to the level of themes. Feature-level detail belongs to `/solution` of each module.
- Every subagent step, Q&A round and review round is a fresh run within the *Context budget* of `.claude/README.md`. Large outputs are split into runs: the designer writes the design-system document and the shared mockup parts in separate runs.
