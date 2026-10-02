// Exercise the current website scripts through the actual quickrun CLI without AI calls.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const catalog = resolve(dirname(fileURLToPath(import.meta.url)), '../quickrun');
const root = mkdtempSync(join(tmpdir(), 'lmctl-quickrun-site-'));
try {
  const home = join(root, 'home'); mkdirSync(join(home, '.lmctl'), { recursive: true });
  writeFileSync(join(home, '.lmctl/init.toml'), [1, 2, 3].map(i => `[Provider${i}]\nprovider = "ClaudeMock"\nmodel1 = "mock-default"\nmodel2 = "mock-default"\nmodel3 = "mock-default"\n`).join('\n'));
  const env = { ...process.env, HOME: home, LMCTL_HOME: join(home, '.lmctl'), LMCTL_DB: join(root, 'state.db'), LMCTL_CLAUDE_MOCK_STORE: join(root, 'mock.json'), LMCTL_NO_UPDATE_NOTIFIER: '1', LMCTL_ENABLE_MOCK_PROVIDER: '1', LMCTL_LMBEE_BRIDGE: '0' };
  delete env.LMCTL_SELF_SESSIONID; delete env.LMCTL_INVOCATION_ID;
  const listed = readFileSync(join(catalog, 'index.txt'), 'utf8').trim().split('\n').map(line => line.split('\t')[0]);
  const files = readdirSync(catalog).filter(name => name.endsWith('.lms')).sort();
  assert.deepEqual(listed, files.map(name => name.slice(0, -4)));
  for (const name of ['solo', 'review']) {
    assert.ok(listed.includes(name));
    const cwd = join(root, name); mkdirSync(cwd);
    writeFileSync(join(cwd, `${name}.lmctl`), 'keep existing team');
    const output = execFileSync(process.env.LMCTL_BIN || 'lmctl', ['--non-interactive', 'quickrun', process.env.QUICKRUN_REMOTE === '1' ? name : join(catalog, `${name}.lms`)], { cwd, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    assert.equal(readFileSync(join(cwd, `${name}.lmctl`), 'utf8'), 'keep existing team');
    const team = readFileSync(join(cwd, `${name}2.lmctl`), 'utf8');
    const members = team.split('\n').filter(line => line.startsWith('_MEMBER_'));
    assert.equal(members.length, name === 'solo' ? 1 : 2);
    assert.ok(members.every(line => line.includes('sessionid=')));
    assert.ok(members.every(line => /provider="?ClaudeMock/.test(line)));
    assert.match(output, /Resume: lmctl terminal/); assert.match(output, /Prompt: lmctl prompt/);
    console.log(`PASS ${name}: tracked members seeded; existing file preserved; non-interactive TUI skipped`);
  }
} finally { rmSync(root, { recursive: true, force: true }); }
