"""Execute every published recipe in a fresh cwd; live mode is manual only.

Recipe pages provide Script: NAME.lms and one Output <pre><samp> golden.
Helpers without an Output section are checked as source but not executed.
"""
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
sys.dont_write_bytecode = True
from pages import sources, offline_output
from lmmock import host_path

ROOT = Path(__file__).resolve().parents[2]
SITE = ROOT / 'lmscript-site' / 'agentic'


def recipes():
    found = []
    for page in sorted(SITE.glob('*.html')):
        if not re.search(r'<h2\b[^>]*>Output(?:[^<]*)</h2>', page.read_text()):
            continue
        matches = sources(page)
        if len(matches) != 1:
            raise ValueError(f'{page}: recipe requires exactly one Script block')
        script = matches[0][0].resolve()
        if not script.is_file() or script.parent != (SITE / 'examples').resolve():
            raise ValueError(f'{page}: missing or misplaced recipe source')
        found.append((page, script, offline_output(page)))
    if len(found) != 8 or len({s for _, s, _ in found}) != 8:
        raise ValueError(f'Expected eight distinct agentic recipes with offline Output; found {len(found)}')
    return found


def _main(mode, fixture_root):
    compiler = shutil.which(os.environ.get('LMSCRIPT_BIN', 'lmscript'))
    if not compiler:
        raise ValueError('LMSCRIPT_BIN must identify an executable')
    compiler = str(Path(compiler).absolute())
    entries = recipes()
    env = os.environ.copy()
    env['LMSCRIPT_BIN'] = compiler
    if mode == 'offline':
        # No real provider credentials or per-role model overrides reach fixtures.
        for key in list(env):
            if key.endswith(('_API_KEY', '_TOKEN', '_SECRET')) or key.startswith('LLM_MODEL'):
                env.pop(key)
        env.pop('AGENTIC_APPROVE', None)
        env.update(DEEPSEEK_API_KEY='fixture-key', LLM_MODEL='deepseek/deepseek-chat')
        mock = host_path()
        staged_mock = Path(fixture_root) / 'mock-model.lms'
        shutil.copyfile(SITE / 'examples/mock-model.lms', staged_mock)
        schema = subprocess.run([mock, 'schema'], text=True, capture_output=True, timeout=30)
        if schema.returncode:
            raise ValueError('Pinned lmmock schema export failed')
        (Path(fixture_root) / 'schema.json').write_text(schema.stdout)
        for script in sorted((SITE / 'examples').glob('*.lms')):
            target = staged_mock if script.name == 'mock-model.lms' else script
            checked = subprocess.run([compiler, '--check', str(target)], env=env,
                                     text=True, capture_output=True, timeout=60)
            if checked.returncode:
                raise ValueError(f'{script.name}: static check failed; run LMSCRIPT_BIN --check on this source to diagnose')
        bytecode = Path(fixture_root) / 'mock.dslb'
        compiled = subprocess.run(['node', str(Path(__file__).with_name('compile-mock.mjs')),
                                   compiler, str(staged_mock), str(Path(fixture_root) / 'schema.json'),
                                   str(bytecode)], env=env, text=True, capture_output=True, timeout=60)
        if compiled.returncode:
            raise ValueError('Mock bytecode compilation failed; run compile-mock.mjs with the selected compiler (or set LMSCRIPT_DSL_MODULE) to diagnose')
    elif mode == 'live':
        if not env.get('OLLAMA_API_KEY'):
            raise ValueError('Live agentic runs require OLLAMA_API_KEY in the environment')
        for key in list(env):
            if key.startswith('LLM_MODEL'):
                env.pop(key)
        env.pop('LMSCRIPT_LLM_MOCK_URL', None)
        env['LLM_MODEL'] = os.environ.get('AGENTIC_MODEL', 'ollama-cloud/deepseek-v4.1-flash')
        print(f'Live model: {env["LLM_MODEL"]}; date: {datetime.now(timezone.utc).date()}', flush=True)
    else:
        raise ValueError('Expected offline or live')
    for page, script, expected in entries:
        with tempfile.TemporaryDirectory(prefix='lmscript-agentic-') as cwd:
            command = [compiler, str(script)]
            if mode == 'offline':
                command = [mock, 'exec', '--lmcode', str(bytecode), '--',
                           sys.executable, str(Path(__file__).resolve()), 'child', *command]
            result = subprocess.run(command, cwd=cwd, env=env, stdin=subprocess.DEVNULL, text=True, capture_output=True, timeout=300)
            if result.returncode:
                # Do not echo arbitrary CLI diagnostics containing environment values.
                raise ValueError(f'{script.name}: {mode} execution failed (exit {result.returncode}); run locally to diagnose')
            actual = result.stdout.rstrip('\n')
            if mode == 'offline' and actual != expected:
                raise ValueError(f'{page}: offline stdout differs from Output sample')
            if mode == 'live':
                safe = actual
                for key, value in env.items():
                    if value and (key.endswith(('_API_KEY', '_TOKEN', '_SECRET'))):
                        safe = safe.replace(value, '[REDACTED]')
                print(f'--- {script.name} ---\n{safe}', flush=True)
            else:
                print(f'PASS agentic/{script.name}', flush=True)


def main(mode):
    with tempfile.TemporaryDirectory(prefix='lmscript-mock-') as fixture_root:
        _main(mode, fixture_root)


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'child':
        # LMMOCK_URL exists only after exec starts its loopback listener.
        os.environ['LMSCRIPT_LLM_MOCK_URL'] = os.environ['LMMOCK_URL']
        os.execv(sys.argv[2], sys.argv[2:])
    try:
        main(sys.argv[1] if len(sys.argv) > 1 else 'offline')
    except (ValueError, RuntimeError, subprocess.TimeoutExpired) as error:
        sys.exit(str(error))
