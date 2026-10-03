#!/usr/bin/env python3
"""Print the state of every flow: which stage documents exist and plan task statuses.

Usage: python .claude/scripts/status.py
"""
from __future__ import annotations

import re
from collections import Counter
from pathlib import Path

CLAUDE_DIR = Path(__file__).resolve().parent.parent
FLOWS = CLAUDE_DIR / "flows"
STAGES = ["0.requirements.html", "0.solution.html", "1.plan.md", "2.review.md", "3.test-report.html"]
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


def main() -> None:
    docs = CLAUDE_DIR / "docs"
    print("Kickoff docs:")
    for name in ("0.high-level-requirements.html", "0.high-level-architecture.html", "0.design-system.html"):
        print(f"  {name:36} {doc_status(docs / name)}")

    flows = sorted(p for p in FLOWS.iterdir() if p.is_dir()) if FLOWS.exists() else []
    print(f"\nFlows ({len(flows)}):")
    if not flows:
        print("  none — start one with: python .claude/scripts/scaffold.py flow <name>")
    for flow in flows:
        print(f"  {flow.name}")
        print(f"    requirements  {doc_status(flow / STAGES[0])}")
        print(f"    solution      {doc_status(flow / STAGES[1])}")
        print(f"    plan          {plan_summary(flow / STAGES[2])}")
        print(f"    review log    {'present' if (flow / STAGES[3]).exists() else '-'}")
        print(f"    test report   {doc_status(flow / STAGES[4])}")


if __name__ == "__main__":
    main()
