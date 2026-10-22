#!/usr/bin/env python3
"""Refresh the checked-in checker vocabulary from the installed lmctl --help."""
from pathlib import Path
import re
import subprocess

help_text = subprocess.check_output(['lmctl', '--help'], text=True)
# Only the command-list section; later indented rows are invocation examples.
section = help_text.split('Onboarding:', 1)[1].split('Partial input', 1)[0]
commands = re.findall(r'^  ([a-z][a-z0-9-]*)(?:\s+\[[^\]]+\])?\s+\S', section, re.M)
if not commands or len(commands) != len(set(commands)):
    raise SystemExit('unrecognized lmctl help layout; list unchanged')
path = Path(__file__).with_name('lmctl-subcommands.lms')
path.write_text('# Refreshed from lmctl --help; run python3 scripts/tools/update-lmctl-subcommands.py\n'
                'lmctl_subcommands = "|' + '|'.join(commands) + '|";\n')
print(f'{len(commands)} lmctl subcommands written to {path.name}')
