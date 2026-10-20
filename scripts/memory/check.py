#!/usr/bin/env python3
"""Repository policy only; Markdown parsing, links and index drift use lmhtml."""
from pathlib import Path
import sys

def pictographic(c):
    return (0x1F000 <= c <= 0x1FAFF or 0x2600 <= c <= 0x27BF or
            c in (0x2B1B, 0x2B1C, 0x2B50, 0x2B55, 0x231A, 0x231B, 0xFE0F, 0x20E3) or
            0x23E9 <= c <= 0x23F3 or 0x23F8 <= c <= 0x23FA or 0xE0020 <= c <= 0xE007F)

def check(root):
    findings = []
    for path in sorted(root.rglob('*')):
        if not path.is_file():
            continue
        if path.suffix.lower() in ('.html', '.htm'):
            findings.append(f'{path}: HTML notes are retired; author Markdown and build the web view separately')
        try:
            text = path.read_text(encoding='utf-8')
        except UnicodeDecodeError:
            if path.suffix == '.md': findings.append(f'{path}: Markdown must be UTF-8')
            continue
        for number, line in enumerate(text.splitlines(), 1):
            for char in line:
                if pictographic(ord(char)):
                    findings.append(f'{path}:{number}: emoji U+{ord(char):04X}; use words')
    for finding in findings:
        print(finding, file=sys.stderr)
    return bool(findings)

if __name__ == '__main__':
    raise SystemExit(check(Path(sys.argv[1])))
