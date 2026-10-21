#!/usr/bin/env python3
"""Render a tool's solo and trio quickrun scripts from the shared template."""
import json
import os
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[2]


def main():
    tool = os.environ.get("TOOL", "")
    if not re.fullmatch(r"[a-z][a-z0-9-]*", tool):
        raise SystemExit("Set TOOL to a lowercase tool name")
    template = (ROOT / "scripts/tools/quickrun-template.lms").read_text()
    data_path = ROOT / "scripts/tools/quickrun-data" / f"{tool}.json"
    if not data_path.is_file():
        raise SystemExit(f"No quickrun data: {data_path.relative_to(ROOT)}")
    data = json.loads(data_path.read_text())
    destination = ROOT / "tools" / tool
    destination.mkdir(parents=True, exist_ok=True)
    for mode in ("solo", "trio"):
        members = data["members"][mode]
        member_lines = "\n".join(
            "_MEMBER_ alias={alias} provider=@role({alias}.provider) model=@role({alias}.model)".format(**member)
            for member in members
        )
        role_headers = "\n".join(
            "// autorun-role: {alias} provider={provider} model={model}".format(**member)
            for member in members
        )
        resources = "Read and follow these references:\n" + "".join(
            f"{link['label']}: {link['url']}\n" for link in data["links"]
        )
        replacements = {
            "@@TOOL@@": json.dumps(tool),
            "@@MODE@@": json.dumps(mode),
            "@@ROLE_HEADERS@@": role_headers,
            "@@MEMBERS@@": json.dumps(member_lines + "\n"),
            "@@TASK@@": json.dumps(data["task"]),
            "@@RESOURCES@@": json.dumps(resources),
        }
        output = template
        for key, value in replacements.items():
            output = output.replace(key, value)
        if "@@" in output:
            raise SystemExit(f"Unexpanded template marker in {tool} {mode}")
        target = destination / f"{tool}_{mode}.lms"
        target.write_text(output)
        print(target.relative_to(ROOT))


if __name__ == "__main__":
    main()
