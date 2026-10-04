#!/usr/bin/env python3
"""Print the state of every module (requirements, solution) and every flow (plan task statuses, test report).

Usage: python .claude/scripts/status.py
"""
from __future__ import annotations

import re
import sys
from collections import Counter
from pathlib import Path

CLAUDE_DIR = Path(__file__).resolve().parent.parent
DOCS = CLAUDE_DIR / "docs"
FLOWS = CLAUDE_DIR / "flows"
STATUSES = ("todo", "doing", "review", "done", "blocked")


def doc_status(path: Path) -> str:
    """Status pill value of an HTML document, or '-' if absent."""
    if not path.exists():
        return "-"
    match = re.search(r'class="status (\w+)"', path.read_text(encoding="utf-8"))
    return match.group(1) if match else "?"


def plan_summary(path: Path) -> str:
    if not path.exists():
        return "-"
    text = path.read_text(encoding="utf-8")
    header = re.search(r"^\| Status \| `?(\w[\w-]*)", text, re.M)
    plan_status = header.group(1) if header else "?"
    # Level-1 task headings look like: ## T1 — title · `todo`
    counts = Counter(re.findall(r"^## T\d+ .*`(\w+)`\s*$", text, re.M))
    tasks = " ".join(f"{s}:{counts[s]}" for s in STATUSES if counts[s]) or "no tasks"
    return f"{plan_status} ({tasks})"


def folders(parent: Path, pattern: str) -> list[Path]:
    return sorted(p for p in parent.glob(pattern) if p.is_dir())


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    print("Kickoff docs:")
    for name in ("0.high-level-requirements.html", "0.high-level-architecture.html", "0.design-system.html"):
        print(f"  {name:36} {doc_status(DOCS / name)}")

    modules = folders(DOCS, "M[0-9][0-9]")
    print(f"\nModules ({len(modules)}):")
    if not modules:
        print("  none — start one with: /solution <Mxx>")
    for module in modules:
        flows = ", ".join(f.name for f in folders(FLOWS, f"{module.name.lower()}-*")) or "-"
        print(f"  {module.name}  requirements {doc_status(module / '0.requirements.html')} · solution {doc_status(module / '0.solution.html')} · flows {flows}")

    flows = folders(FLOWS, "*")
    print(f"\nFlows ({len(flows)}):")
    if not flows:
        print("  none — start one with: /planning <Mxx-Fyy|Mxx-Tyy>")
    for flow in flows:
        print(f"  {flow.name}")
        print(f"    plan          {plan_summary(flow / '1.plan.md')}")
        print(f"    review log    {'present' if (flow / '2.review.md').exists() else '-'}")
        print(f"    test report   {doc_status(flow / '3.test-report.html')}")


if __name__ == "__main__":
    main()
