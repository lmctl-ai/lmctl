// Exercise the current website scripts through the actual quickrun CLI without AI calls.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
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
  const helloPrompt = 'Reply with the single word ACK and nothing else.';
  writeFileSync(env.LMCTL_CLAUDE_MOCK_STORE, JSON.stringify({ schemaVersion: 1, sessions: {}, scriptContains: { [helloPrompt]: 'ACK' } }));
  const listed = readFileSync(join(catalog, 'index.txt'), 'utf8').trim().split('\n').map(line => line.split('\t')[0]);
  const files = readdirSync(catalog).filter(name => name.endsWith('.lms')).sort();
  assert.deepEqual(listed, files.map(name => name.slice(0, -4)));
  for (const name of ['solo', 'review', 'hello']) {
    assert.ok(listed.includes(name));
    const cwd = join(root, name); mkdirSync(cwd);
    writeFileSync(join(cwd, `${name}.lmctl`), 'keep existing team');
    const output = execFileSync(process.env.LMCTL_BIN || 'lmctl', ['--non-interactive', 'quickrun', process.env.QUICKRUN_REMOTE === '1' ? name : join(catalog, `${name}.lms`)], { cwd, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    assert.equal(readFileSync(join(cwd, `${name}.lmctl`), 'utf8'), 'keep existing team');
    const team = readFileSync(join(cwd, `${name}2.lmctl`), 'utf8');
    const members = team.split('\n').filter(line => line.startsWith('_MEMBER_'));
    assert.equal(members.length, name === 'review' ? 2 : 1);
    assert.ok(members.every(line => line.includes('sessionid=')));
    assert.ok(members.every(line => /provider="?ClaudeMock/.test(line)));
    if (name === 'hello') {
      assert.match(output, /^ACK$/m);
      assert.ok(members[0].includes('alias=Lead'));
      assert.match(members[0], /model="?mock-default/);
      const source = readFileSync(join(catalog, 'hello.lms'), 'utf8');
      assert.match(source, /permissionMode:\s*"plan"/);
      assert.doesNotMatch(source, /\blm_terminal\s*\(|^\s*import\b/m);
      const sessions = Object.values(JSON.parse(readFileSync(env.LMCTL_CLAUDE_MOCK_STORE, 'utf8')).sessions).filter(session => session.cwd === cwd);
      assert.equal(sessions.length, 1);
      assert.equal(sessions[0].messages.length, 4); // Seed exchange, then one prompt exchange.
      assert.equal(sessions[0].messages[2].content.split(helloPrompt).length - 1, 1);
      console.log('PASS hello: one Lead seeded; existing file preserved; one ACK prompt; reply printed; plan mode requested; no terminal');
    } else {
      assert.match(output, /Resume: lmctl terminal/); assert.match(output, /Prompt: lmctl prompt/);
      console.log(`PASS ${name}: tracked members seeded; existing file preserved; non-interactive TUI skipped`);
    }
  }
  const store = JSON.parse(readFileSync(env.LMCTL_CLAUDE_MOCK_STORE, 'utf8'));
  store.scriptContains[helloPrompt] = { error: 'Deliberate hello failure' };
  writeFileSync(env.LMCTL_CLAUDE_MOCK_STORE, JSON.stringify(store));
  const failedCwd = join(root, 'hello-failure'); mkdirSync(failedCwd);
  const failed = spawnSync(process.env.LMCTL_BIN || 'lmctl', ['--non-interactive', 'quickrun', process.env.QUICKRUN_REMOTE === '1' ? 'hello' : join(catalog, 'hello.lms')], { cwd: failedCwd, env, encoding: 'utf8', timeout: 30000 });
  assert.ifError(failed.error);
  assert.equal(failed.status, 1, failed.stderr);
  assert.match(failed.stdout, /Error: Deliberate hello failure/);
  console.log('PASS hello failure: error printed; exit 1');
} finally { rmSync(root, { recursive: true, force: true }); }
