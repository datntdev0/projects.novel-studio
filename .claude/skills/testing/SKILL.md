---
name: testing
description: Phase 4 of a flow (one work item). Verify the final output of a completed plan with Playwright Test (playwright-cli for the exploratory pass), produce the test report and get the product owner's acceptance. Usage: /testing <flow>.
disable-model-invocation: true
---

# Testing

**Participants:** verifier (Sonnet) · product owner (acceptance) · coder (Sonnet, only for defect fixes).
**Delegation:** see *Delegation* in `.claude/README.md`. Steps 1–3 run in a `verifier` subagent; the main session does not run the suite or write the report itself.
**Input:** `.claude/flows/<flow>/1.plan.md` with all tasks `done`; e2e specs under `verify/specs/<flow>/`.
**Output:** `.claude/flows/<flow>/3.test-report.html` (template `templates/flows/3.test-report.html`) + `evidence/`.

## Steps

1. **Run** — *verifier* starts the app as documented in the architecture doc and runs the flow's e2e suite with `pnpm verify <flow>` (Playwright Test) on the final commit. Collect screenshots / traces into `evidence/`.
2. **Exploratory pass** — verifier walks the item's part of the UX flow in `.claude/docs/<Mxx>/0.solution.html` once manually via `playwright-cli`, looking for anything the scenarios do not cover (empty states, errors, mobile width).
3. **Report** — fill the test report: environment, AC coverage, scenarios, defects, verdict.
4. **Triage defects** with the product owner:
   - `blocker` / `major` → open a fix task appended to `1.plan.md` (e.g. `T<n+1> — Fix D1, D2`), re-run the `/planning` Jira sync (step 7), run the `/coding` loop for it, re-run the suite, update the report.
   - `minor` / `nit` → may be deferred; list them under follow-ups.
5. **Jira: In Review** — when every `must` AC passed in the report, no `blocker` / `major` defect is open and the report is complete (commands, versions, SHA): ask the product owner to confirm, then move the flow's item (Story / Task) to `In Review` via `tool-atlassian`. Moving to `Done` stays with the product owner.
6. ⛔ **Acceptance gate** — product owner reads the report and accepts. Record sign-off in the verdict callout.
7. **Close the flow** — merge `flow/<flow>` into the main branch (fast-forward or squash per the architecture conventions), set the item's *Status* to `done` in the work items table of `.claude/docs/<Mxx>/0.solution.html`. When every item of the module is `done`, set the module's requirements and solution documents to `done`.

## Rules
- The report must be reproducible: commands, versions and commit SHA are mandatory.
- Verifier never edits application code; fixes go through coders and review.
- An AC without automation is reported as *not automated*, never silently passed.
- The report is bilingual (EN + VI in one file, sibling `lang="en"` / `lang="vi"` elements). Commands, versions, IDs and SHAs are language-neutral and written once.
