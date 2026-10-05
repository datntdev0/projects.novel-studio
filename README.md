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

`bootstrap` installs dependencies with the frozen lockfile and builds `python/.venv` with ruff.

## Root scripts

- `pnpm run bootstrap`: install dependencies and build `python/.venv`
- `pnpm build`: build all packages
- `pnpm format`: format all files
- `pnpm format:check`: check formatting without writing
