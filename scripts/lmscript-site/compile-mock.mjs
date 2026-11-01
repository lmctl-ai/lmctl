// Compile the fixture's single lmcode block without removed savedsl/source-mode APIs.
import {readFile, writeFile, realpath, stat} from 'node:fs/promises';
import {dirname, resolve, join} from 'node:path';
import {pathToFileURL} from 'node:url';

export async function compilerModule(compiler, override = process.env.LMSCRIPT_DSL_MODULE) {
  if (override) {
    const path = resolve(override);
    if (!(await stat(path)).isFile()) throw new Error('LMSCRIPT_DSL_MODULE must name a file');
    return path;
  }
  // Both the mono package and npm package keep bin/lmscript beside dist/.
  // Resolve npm .bin and mono root/bin symlinks before looking up the module.
  const binary = await realpath(compiler);
  const module = join(dirname(dirname(binary)), 'dist', 'dsl.js');
  try {
    if ((await stat(module)).isFile()) return module;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  throw new Error('Cannot locate the selected compiler\'s dist/dsl.js; set LMSCRIPT_DSL_MODULE to its absolute path');
}

export function extractBlock(source) {
  // This fixture format deliberately permits no executable wrapper or extra block.
  const match = /^(?:\s|#[^\n]*(?:\n|$))*[A-Za-z_]\w*\s*=\s*_lmcode_\s+schema="schema\.json";\r?\n([\s\S]*?)\r?\nend _lmcode_\s*(?:#[^\n]*(?:\n|$)|\s)*$/.exec(source);
  if (!match || /\bend _lmcode_\b/.test(match[1])) {
    throw new Error('Mock fixture must contain exactly one schema="schema.json" lmcode block and no executable wrapper');
  }
  return match[1];
}

export async function compileMock(compiler, source, schemaFile, output) {
  const module = await compilerModule(compiler);
  const {parseDslSchema, compileDsl} = await import(pathToFileURL(module).href);
  if (typeof parseDslSchema !== 'function' || typeof compileDsl !== 'function') {
    throw new Error('Selected DSL module must export parseDslSchema and compileDsl');
  }
  const body = extractBlock(await readFile(source, 'utf8'));
  const schema = parseDslSchema(await readFile(schemaFile), 'agentic mock fixture');
  const compiled = compileDsl(body.split(/\r?\n/), schema);
  await writeFile(output, compiled.bytes);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    if (process.argv.length !== 6) throw new Error('usage: compile-mock.mjs COMPILER SOURCE SCHEMA OUTPUT');
    await compileMock(...process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
