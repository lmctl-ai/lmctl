import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const compilerModule = process.env.LMCODE_COMPILER_MODULE;
if (!compilerModule) throw new Error('Set LMCODE_COMPILER_MODULE to the lmscript dist/dsl.js path');

const sourcePath = path.join(root, 'src/main/lmcode/todo-handler.lms');
const source = readFileSync(sourcePath, 'utf8');
const header = /^.*= _lmcode_ schema="([^"]+)";\r?\n/m.exec(source);
if (!header) throw new Error('Expected an _lmcode_ block with a literal schema path');
const body = source.slice(header.index + header[0].length).split(/^end _lmcode_\s*$/m)[0].trimEnd();
const schemaPath = path.resolve(path.dirname(sourcePath), header[1]);
const schemaBytes = readFileSync(schemaPath);
const { parseDslSchema, compileDsl } = await import(pathToFileURL(compilerModule).href);
const compiled = compileDsl(body.split('\n'), parseDslSchema(schemaBytes, schemaPath));

const java = `package com.lmctl.demo.teavm;

final class TodoHandlerProgram {
    static final String BYTECODE = "${Buffer.from(compiled.bytes).toString('base64')}";
    static final String SCHEMA = ${JSON.stringify(schemaBytes.toString('utf8'))};

    private TodoHandlerProgram() {
    }
}
`;
const output = path.join(root, 'target/generated-sources/lmcode/com/lmctl/demo/teavm/TodoHandlerProgram.java');
mkdirSync(path.dirname(output), { recursive: true });
writeFileSync(output, java);
