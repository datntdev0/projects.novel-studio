---
name: testing
description: Phase 4 of a flow. Verify the final output of a completed plan with playwright-cli, produce the test report and get the product owner's acceptance. Usage: /testing <flow-name>.
disable-model-invocation: true
---

# Testing

**Participants:** verifier (Sonnet) · product owner (acceptance) · coder (Sonnet, only for defect fixes).
**Delegation:** see *Delegation* in `.claude/README.md`. Steps 1–3 run in a `verifier` subagent; the main session does not run the suite or write the report itself.
**Input:** `.claude/flows/<name>/1.plan.md` with all tasks `done`; e2e specs under `tests/e2e/<name>/`.
**Output:** `.claude/flows/<name>/3.test-report.html` (template `templates/flows/3.test-report.html`) + `evidence/`.

## Steps

1. **Run** — *verifier* starts the app as documented in the architecture doc and runs the flow's e2e suite with `playwright-cli` on the final commit. Collect screenshots / traces into `evidence/`.
2. **Exploratory pass** — verifier walks the UX flow from `0.solution.html` once manually via `playwright-cli`, looking for anything the scenarios do not cover (empty states, errors, mobile width).
3. **Report** — fill the test report: environment, AC coverage, scenarios, defects, verdict.
4. **Triage defects** with the product owner:
   - `blocker` / `major` → open a fix task appended to `1.plan.md` (e.g. `T<n+1> — Fix D1, D2`), run the `/coding` loop for it, re-run the suite, update the report.
   - `minor` / `nit` → may be deferred; list them under follow-ups.
5. ⛔ **Acceptance gate** — product owner reads the report and accepts. Record sign-off in the verdict callout.
6. **Close the flow** — merge `flow/<name>` into the main branch (fast-forward or squash per the architecture conventions), set the requirement and solution documents' status to `done`.

## Rules
- The report must be reproducible: commands, versions and commit SHA are mandatory.
- Verifier never edits application code; fixes go through coders and review.
- An AC without automation is reported as *not automated*, never silently passed.
- The report is bilingual (EN + VI in one file, sibling `lang="en"` / `lang="vi"` elements). Commands, versions, IDs and SHAs are language-neutral and written once.
