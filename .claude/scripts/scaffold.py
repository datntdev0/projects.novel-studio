#!/usr/bin/env python3
"""Scaffold framework documents from .claude/templates.

Usage:
  python .claude/scripts/scaffold.py docs                # kickoff docs + mockups
  python .claude/scripts/scaffold.py flow <name>         # .claude/flows/<name>/
  python .claude/scripts/scaffold.py ... --project NAME  # override project name
  python .claude/scripts/scaffold.py ... --force         # overwrite existing files

Placeholders replaced in every copied text file:
  {{PROJECT_NAME}}  {{FLOW_NAME}}  {{DATE}}  {{CSS_PATH}}  {{JS_PATH}}
"""
from __future__ import annotations

import argparse
import re
import sys
from datetime import date
from pathlib import Path

from mockups import build as build_mockups

CLAUDE_DIR = Path(__file__).resolve().parent.parent
REPO_DIR = CLAUDE_DIR.parent
TEMPLATES = CLAUDE_DIR / "templates"
ASSETS = TEMPLATES / "assets"


def project_name(override: str | None) -> str:
    if override:
        return override
    readme = REPO_DIR / "README.md"
    if readme.exists():
        match = re.search(r"^#\s+(.+)$", readme.read_text(encoding="utf-8"), re.M)
        if match:
            return match.group(1).strip()
    return REPO_DIR.name


def copy_tree(src: Path, dst: Path, values: dict[str, str], force: bool) -> list[Path]:
    """Copy every file under src to dst, substituting placeholders. Returns files written."""
    written: list[Path] = []
    for path in sorted(src.rglob("*")):
        if not path.is_file():
            continue
        target = dst / path.relative_to(src)
        if target.exists() and not force:
            print(f"  skip  {target.relative_to(REPO_DIR)} (exists)")
            continue
        text = path.read_text(encoding="utf-8")
        for key, value in values.items():
            text = text.replace("{{" + key + "}}", value)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(text, encoding="utf-8", newline="\n")
        written.append(target)
        print(f"  write {target.relative_to(REPO_DIR)}")
    return written


def asset_paths_from(folder: Path) -> dict[str, str]:
    """Relative paths from folder to the shared stylesheet and script."""
    up = Path(*[".."] * len(folder.relative_to(CLAUDE_DIR).parts))
    return {
        "CSS_PATH": up.joinpath((ASSETS / "claude.css").relative_to(CLAUDE_DIR)).as_posix(),
        "JS_PATH": up.joinpath((ASSETS / "claude.js").relative_to(CLAUDE_DIR)).as_posix(),
    }


def scaffold_docs(values: dict[str, str], force: bool) -> None:
    docs = CLAUDE_DIR / "docs"
    print("Kickoff documents:")
    copy_tree(TEMPLATES / "docs", docs, {**values, **asset_paths_from(docs)}, force)
    print("Prototype:")
    copy_tree(TEMPLATES / "mockups", CLAUDE_DIR / "mockups", values, force)
    build_mockups(CLAUDE_DIR / "mockups")


def scaffold_flow(name: str, values: dict[str, str], force: bool) -> None:
    if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", name):
        sys.exit(f"flow name must be kebab-case, got: {name!r}")
    folder = CLAUDE_DIR / "flows" / name
    print(f"Flow '{name}':")
    copy_tree(
        TEMPLATES / "flows",
        folder,
        {**values, "FLOW_NAME": name, **asset_paths_from(folder)},
        force,
    )
    (folder / "evidence").mkdir(exist_ok=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)
    docs = sub.add_parser("docs", help="scaffold kickoff docs and mockups")
    flow = sub.add_parser("flow", help="scaffold a flow folder")
    flow.add_argument("name")
    # accept the options before or after the subcommand
    for p in (parser, docs, flow):
        p.add_argument("--project", help="project name (default: README heading or folder name)")
        p.add_argument("--force", action="store_true", help="overwrite existing files")
    args = parser.parse_args()

    values = {"PROJECT_NAME": project_name(args.project), "DATE": date.today().isoformat()}
    if args.command == "docs":
        scaffold_docs(values, args.force)
    else:
        scaffold_flow(args.name, values, args.force)


if __name__ == "__main__":
    main()
