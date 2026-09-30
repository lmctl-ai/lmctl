#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const generatorDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(generatorDir, "..");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "lmctl-generator-test-"));
const pages = path.join(temp, "pages");
const output = path.join(temp, "output");
const templates = path.join(temp, "templates");
fs.mkdirSync(pages);
fs.cpSync(path.join(generatorDir, "templates"), templates, { recursive: true });
fs.writeFileSync(path.join(pages, "fixture.json"), JSON.stringify({ kind: "manual", title: "Fixture", description: "Fixture page", path: "/fixture" }));
const run = () => spawnSync(process.execPath, [path.join(generatorDir, "build.mjs"), `--pages=${pages}`, `--output=${output}`, `--templates=${templates}`], { cwd: root, encoding: "utf8" });

fs.writeFileSync(path.join(pages, "fixture.html"), '<h1 class="butotn">Broken</h1>');
let result = run();
assert.notEqual(result.status, 0, "misspelled class must fail the build");
assert.match(`${result.stdout}\n${result.stderr}`, /butotn/, "failure must name the bad class");

fs.writeFileSync(path.join(pages, "fixture.html"), '<h1 class="button">Correct</h1>');
result = run();
assert.equal(result.status, 0, result.stderr);
assert.equal(fs.readFileSync(path.join(output, "fixture.html"), "utf8").includes("Correct"), true);

const manualTemplate = path.join(templates, "manual.html");
let templateSource = fs.readFileSync(manualTemplate, "utf8");
fs.writeFileSync(manualTemplate, templateSource.replace('<body>', '<body class="super-fake-typo-class">'));
result = run();
assert.notEqual(result.status, 0, "template root class typos must fail the build");
assert.match(`${result.stdout}\n${result.stderr}`, /super-fake-typo-class/);

templateSource = fs.readFileSync(manualTemplate, "utf8").replace(' class="super-fake-typo-class"', '');
fs.writeFileSync(manualTemplate, templateSource.replace('<main>', '<main><template><div class="templat-fake-typo">fixture</div></template>'));
result = run();
assert.notEqual(result.status, 0, "template content class typos must fail the build");
assert.match(`${result.stdout}\n${result.stderr}`, /templat-fake-typo/);

fs.writeFileSync(manualTemplate, templateSource);
fs.writeFileSync(path.join(pages, "fixture.html"), '<body class="body-fake-typo"><h1>Hello</h1></body>');
result = run();
assert.notEqual(result.status, 0, "document-container tags in fragments must fail the build");
assert.match(`${result.stdout}\n${result.stderr}`, /body-fake-typo/);

fs.writeFileSync(path.join(pages, "fixture.html"), '<noscript><div class="noscript-bad-class">text</div></noscript><h1>Hello</h1>');
result = run();
assert.notEqual(result.status, 0, "noscript class typos must fail the build");
assert.match(`${result.stdout}\n${result.stderr}`, /noscript-bad-class/);
console.log("generator class-validation test passed");
