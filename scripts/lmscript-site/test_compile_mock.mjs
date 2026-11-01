import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, readFile, writeFile, symlink, rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {compilerModule, extractBlock, compileMock} from './compile-mock.mjs';

test('extracts the fixture body; rejects removed wrapper and extra blocks', () => {
  const source = '# fixture\nprogram = _lmcode_ schema="schema.json";\nlet n = 1;\nend _lmcode_\n';
  assert.equal(extractBlock(source), 'let n = 1;');
  assert.throws(() => extractBlock(source + 'savedsl(program, ARGV[0]);'), /exactly one/);
  assert.throws(() => extractBlock(source + source), /exactly one/);
  assert.throws(() => extractBlock(source.replace('schema.json', 'other.json')), /exactly one/);
});

test('resolves the selected compiler symlink and explicit module override', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'mock-module-test-'));
  try {
    await mkdir(join(dir, 'package/bin'), {recursive: true});
    await mkdir(join(dir, 'package/dist'));
    const binary = join(dir, 'package/bin/lmscript');
    const module = join(dir, 'package/dist/dsl.js');
    await writeFile(binary, '');
    await writeFile(module, '');
    await symlink(binary, join(dir, 'launcher'));
    assert.equal(await compilerModule(join(dir, 'launcher'), ''), module);
    assert.equal(await compilerModule('/missing/launcher', module), module);
    await rm(module);
    await assert.rejects(compilerModule(binary, ''), /LMSCRIPT_DSL_MODULE/);
  } finally {
    await rm(dir, {recursive: true, force: true});
  }
});


test('compileMock passes source lines and writes compiled bytes', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'mock-compile-test-'));
  const before = process.env.LMSCRIPT_DSL_MODULE;
  try {
    const module = join(dir, 'dsl.mjs');
    await writeFile(module, `export function parseDslSchema(bytes) { return JSON.parse(bytes); }
export function compileDsl(lines, schema) {
  if (!Array.isArray(lines) || lines[0] !== 'let n = 1;' || schema.fixture !== true) throw Error('bad compiler input');
  return {bytes: Buffer.from('fixture-bytecode')};
}`);
    process.env.LMSCRIPT_DSL_MODULE = module;
    const source = join(dir, 'mock-model.lms');
    const schema = join(dir, 'schema.json');
    const output = join(dir, 'mock.dslb');
    await writeFile(source, 'program = _lmcode_ schema="schema.json";\nlet n = 1;\nend _lmcode_\n');
    await writeFile(schema, '{"fixture":true}');
    await compileMock('/custom/launcher', source, schema, output);
    assert.equal(await readFile(output, 'utf8'), 'fixture-bytecode');
    await writeFile(source, 'invalid fixture');
    await assert.rejects(compileMock('/custom/launcher', source, schema, output), /exactly one/);
  } finally {
    if (before === undefined) delete process.env.LMSCRIPT_DSL_MODULE;
    else process.env.LMSCRIPT_DSL_MODULE = before;
    await rm(dir, {recursive: true, force: true});
  }
});
