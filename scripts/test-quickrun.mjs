// Exercise the current website scripts through the actual quickrun CLI without AI calls.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const catalog = resolve(process.env.QUICKRUN_CATALOG || join(dirname(fileURLToPath(import.meta.url)), '../quickrun'));
const root = mkdtempSync(join(tmpdir(), 'lmctl-quickrun-site-'));
try {
  const home = join(root, 'home'); mkdirSync(join(home, '.lmctl'), { recursive: true });
  writeFileSync(join(home, '.lmctl/init.toml'), [1, 2, 3].map(i => `[Provider${i}]\nprovider = "ClaudeMock"\nmodel1 = "mock-slot-${i}"\nmodel2 = "mock-light-${i}"\nmodel3 = "mock-tiny-${i}"\n`).join('\n'));
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
      assert.match(members[0], /model="?mock-slot-1/);
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
  const automated = [
    { name: 'solo-auto', args: ['Write the requested brief'], prompts: { 'Answer this request:': 'Brief deliverable' }, files: ['answer.txt', 'transcript.txt'] },
    { name: 'review-auto', args: ['Draft a launch checklist'], prompts: { 'Produce the requested deliverable:': 'Checklist draft', 'Assess this draft against explicit criteria.': 'Meets criteria; limitation: no dates.' }, files: ['draft.txt', 'review.txt', 'lead-transcript.txt', 'reviewer-transcript.txt'] },
    { name: 'build-review', args: ['Build a small parser'], prompts: { 'Write an implementation spec for:': 'Spec: parse comma-separated values', 'Implement this spec and include the test evidence you ran.': 'Implementation: split on commas. Test evidence: two examples passed.', 'Check the implementation against the spec and assess its stated test evidence.': 'Matches spec; evidence is adequate.' }, files: ['spec.txt', 'implementation.txt', 'review.txt', 'lead-transcript.txt', 'coder-transcript.txt', 'reviewer-transcript.txt'] },
    { name: 'revise-three', args: ['Write a concise release note'], prompts: { 'Coder work round 1:': 'Candidate one', 'Reviewer check round 1 candidate': 'Needs a date.\nREVISE', 'Coder work round 2:': 'Candidate two', 'Reviewer check round 2 candidate': 'Needs a clearer title.\nREVISE', 'Coder work round 3:': 'Candidate three', 'Reviewer check round 3 candidate': 'Approved.\nACCEPT' }, files: ['candidate-1.txt', 'review-1.txt', 'candidate-2.txt', 'review-2.txt', 'candidate-3.txt', 'review-3.txt'] },
    { name: 'revise-three', args: ['Write a concise release note'], prompts: { 'Coder work round 1:': 'Candidate one', 'Reviewer check round 1 candidate': 'Still needs work.\nREVISE', 'Coder work round 2:': 'Candidate two', 'Reviewer check round 2 candidate': 'Still needs work.\nREVISE', 'Coder work round 3:': 'Candidate three', 'Reviewer check round 3 candidate': 'Still needs work.\nREVISE' }, files: ['candidate-1.txt', 'review-1.txt', 'candidate-2.txt', 'review-2.txt', 'candidate-3.txt', 'review-3.txt'] },
  ];
  for (const [index, test] of automated.entries()) {
    const sampleSource = readFileSync(join(catalog, `${test.name}.lms`), 'utf8');
    assert.match(sampleSource, /len\(ARGV\) == 0/, `${test.name} must validate arguments before any turn`);
    assert.doesNotMatch(sampleSource, /\blm_terminal\s*\(|\bprompt_human\s*\(|^\s*import\b/m, `${test.name} must be self-contained and non-interactive`);
    const mock = JSON.parse(readFileSync(env.LMCTL_CLAUDE_MOCK_STORE, 'utf8'));
    mock.scriptContains = test.prompts;
    writeFileSync(env.LMCTL_CLAUDE_MOCK_STORE, JSON.stringify(mock));
    const cwd = join(root, `${test.name}-${index}`); mkdirSync(cwd);
    const output = execFileSync(process.env.LMCTL_BIN || 'lmctl', ['--non-interactive', 'quickrun', join(catalog, `${test.name}.lms`), ...test.args], { cwd, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    const runDirs = readdirSync(cwd);
    assert.equal(runDirs.length, 1, `${test.name} should allocate one run directory`);
    const runDir = join(cwd, runDirs[0]);
    for (const file of test.files) assert.ok(readdirSync(runDir).includes(file), `${test.name} should persist ${file}`);
    assert.match(output, /Result:|Draft:|Spec:/);
    assert.match(output, /Transcript/);
    const expectedTurns = test.name === 'solo-auto' ? 1 : test.name === 'review-auto' ? 2 : test.name === 'build-review' ? 3 : 6;
    assert.equal(test.files.filter(file => /transcript/.test(file)).length || test.files.filter(file => /^review-\d/.test(file)).length * 2, expectedTurns);
    const expectedReply = Object.values(test.prompts);
    for (const reply of expectedReply) assert.ok(readdirSync(runDir).some(file => readFileSync(join(runDir, file), 'utf8').includes(reply.split('\n')[0])), `${test.name} must persist mock reply: ${reply}`);
    if (test.name === 'revise-three' && index === 3) assert.equal(readdirSync(runDir).filter(file => /^candidate-\d+\.txt$/.test(file)).length, 3);
    if (test.name === 'revise-three' && index === 3) assert.doesNotMatch(output, /Stopped after three/);
    if (test.name === 'revise-three' && index === 4) assert.match(output, /Stopped after three Coder\/Reviewer pairs/);
    console.log(`PASS ${test.name} (${index}): ${expectedTurns} prompted turns; artifacts and transcript paths persisted`);
  }
  for (const name of ['solo-auto', 'review-auto', 'build-review', 'revise-three']) {
    const cwd = join(root, `${name}-no-args`); mkdirSync(cwd);
    const noArgs = spawnSync(process.env.LMCTL_BIN || 'lmctl', ['--non-interactive', 'quickrun', join(catalog, `${name}.lms`)], { cwd, env, encoding: 'utf8', timeout: 30000 });
    assert.equal(noArgs.status, 1, `${name} without request must exit 1`);
    assert.match(noArgs.stdout, /Usage:/);
    assert.deepEqual(readdirSync(cwd), [], `${name} without request must not create a run directory`);
  }
  console.log('PASS request guards: all four reject missing input before creating run artifacts');
  const store = JSON.parse(readFileSync(env.LMCTL_CLAUDE_MOCK_STORE, 'utf8'));
  store.scriptContains[helloPrompt] = { error: 'Deliberate hello failure' };
  writeFileSync(env.LMCTL_CLAUDE_MOCK_STORE, JSON.stringify(store));
  const failedCwd = join(root, 'hello-failure'); mkdirSync(failedCwd);
  const failed = spawnSync(process.env.LMCTL_BIN || 'lmctl', ['--non-interactive', 'quickrun', process.env.QUICKRUN_REMOTE === '1' ? 'hello' : join(catalog, 'hello.lms')], { cwd: failedCwd, env, encoding: 'utf8', timeout: 30000 });
  assert.ifError(failed.error);
  assert.equal(failed.status, 1, failed.stderr);
  assert.match(failed.stdout, /Error: lm_prompt: Deliberate hello failure/);
  console.log('PASS hello failure: error printed; exit 1');
} finally { rmSync(root, { recursive: true, force: true }); }
