# projects.dreamer-studio

## Setup

Windows only. Requirements:

- Node 24.15+ or 26+ (Angular 22.2.1 requirement)
- pnpm 11.10.0
- Python 3.11 through the `py` launcher (check with `py -3.11 --version`)

Then run:

```
pnpm run bootstrap
pnpm build
```

## Root scripts

- `pnpm run bootstrap`: install dependencies with the frozen lockfile, install the git pre-commit hook and build `python/.venv` with ruff
- `pnpm build`: build all packages; the runnable app goes to `dist/app/`
- `pnpm dev`: build Angular and Electron, then run Electron on `dist/app/` (first run downloads the Electron binary)
- `pnpm verify`: build, then run the Playwright verification specs (see Verify)
- `pnpm lint`: ESLint, pin check, i18n key check (English and Vietnamese keys match) and ruff
- `pnpm storybook`: run Storybook in dev mode on port 6006
- `pnpm build-storybook`: build static Storybook to `dist/storybook`
- `node tools/check-tokens.mjs`: design token check; `--print` lists the mockup tokens, `<actual.json>` compares computed values per theme (not part of `pnpm lint`)
- `pnpm format`: format all files (Prettier and ruff)
- `pnpm format:check`: check formatting without writing (Prettier and ruff)

## Verify

- `pnpm verify`: build, then run all specs; `pnpm verify <flow>` runs only that flow's specs
- The flow name is a regex filter, so `tmp` also matches `tmp-t`; a trailing `/` (`pnpm verify m00-t02/`) matches the flow folder exactly
- Other Playwright flags pass through: `pnpm verify --list`, `pnpm verify <flow> --headed`, `pnpm verify <flow> --debug`
- Quick rerun without a build: `pnpm --dir verify exec playwright test <flow>`
- Project `renderer`: browser on the e2e dev server; `ng serve` starts only when renderer specs run
- Project `electron`: runs the bundle in `dist/app`; the Electron binary downloads on first use
- Port 4310 must be free, and only one run per machine at a time
- The output has two dev-server lines (start and stop); the summary counts them
- Evidence goes to `.claude/flows/<flow>/evidence/`; failure traces and screenshots go to `verify/test-results/`
- `pnpm run bootstrap` installs Chromium

## Commit checks

The pre-commit hook runs `pnpm lint` and `pnpm format:check`. A failing check rejects the commit and names the file and rule. Fix it with `pnpm format` or by hand.

Git for Windows runs the hook with `sh`, so `pnpm` must be on PATH. Do not use `--no-verify`.

## VS Code

Open the folder and install the recommended extensions. Run `pnpm run bootstrap` first. Debug configurations:

- `Electron: main`: build the desktop app and launch Electron with the main process attached
- `Electron: renderer`: attach to the Electron window on port 9223
- `Electron: main + renderer`: run both together
- `Python: current file`: debug the open Python file with `python/.venv`
