#!/usr/bin/env python3
"""Assemble the prototype from its parts.

  .claude/mockups/shell.html          app shell, one `<!-- @screen <id> -->` line per screen
  .claude/mockups/screens/<id>.html   one screen fragment (comment + <section class="screen">)
  .claude/mockups/index.html          generated; never edit by hand

Usage:
  python .claude/scripts/mockups.py           # build index.html
  python .claude/scripts/mockups.py --check   # exit 1 if index.html is out of date
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

MOCKUPS = Path(__file__).resolve().parent.parent / "mockups"
MARKER = re.compile(r"^[ \t]*<!-- @screen ([a-z0-9-]+) -->[ \t]*$", re.M)


def assemble(folder: Path = MOCKUPS) -> str:
    shell = (folder / "shell.html").read_text(encoding="utf-8")
    screens = folder / "screens"
    used = MARKER.findall(shell)
    missing = [name for name in used if not (screens / f"{name}.html").exists()]
    if missing:
        sys.exit(f"missing screen files: {', '.join(missing)}")
    for orphan in sorted({p.stem for p in screens.glob("*.html")} - set(used)):
        print(f"  warn  screens/{orphan}.html has no marker in shell.html")
    return MARKER.sub(lambda m: (screens / f"{m.group(1)}.html").read_text(encoding="utf-8").rstrip("\n"), shell)


def build(folder: Path = MOCKUPS) -> None:
    (folder / "index.html").write_text(assemble(folder), encoding="utf-8", newline="\n")
    print(f"  build {folder.name}/index.html")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--check", action="store_true", help="fail if index.html is out of date")
    args = parser.parse_args()
    if not args.check:
        build()
        return
    index = MOCKUPS / "index.html"
    if not index.exists() or index.read_text(encoding="utf-8") != assemble():
        sys.exit("index.html is out of date: run python .claude/scripts/mockups.py")
    print("  ok    index.html is up to date")


if __name__ == "__main__":
    main()
