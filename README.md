# projects.novel-studio

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
- `pnpm lint`: ESLint, pin check and ruff
- `pnpm format`: format all files (Prettier and ruff)
- `pnpm format:check`: check formatting without writing (Prettier and ruff)

## Commit checks

The pre-commit hook runs `pnpm lint` and `pnpm format:check`. A failing check rejects the commit and names the file and rule. Fix it with `pnpm format` or by hand.

Git for Windows runs the hook with `sh`, so `pnpm` must be on PATH. Do not use `--no-verify`.

## VS Code

Open the folder and install the recommended extensions. Run `pnpm run bootstrap` first. Debug configurations:

- `Electron: main`: build the desktop app and launch Electron with the main process attached
- `Electron: renderer`: attach to the Electron window on port 9223
- `Electron: main + renderer`: run both together
- `Python: current file`: debug the open Python file with `python/.venv`
