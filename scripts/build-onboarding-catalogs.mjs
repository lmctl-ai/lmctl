import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
const helloDir = join(root, 'helloexample');
const escape = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const sentence = (value) => typeof value === 'string' && value.trim() === value && /[.!?]$/.test(value);

function writeOrCheck(path, value) {
  if (check) {
    if (readFileSync(path, 'utf8') !== value) throw new Error(`${path.slice(root.length + 1)} is stale; run node scripts/build-onboarding-catalogs.mjs`);
  } else writeFileSync(path, value);
}

function page(title, intro, links, textUrl) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(title)}</title>
<meta name="description" content="${escape(intro)}">
</head>
<body>
<main>
<h1>${escape(title)}</h1>
<p>${escape(intro)}</p>
<ul>
${links.map(({ name, description, url }) => `<li><a href="${escape(url)}">${escape(name)}</a> — ${escape(description)}</li>`).join('\n')}
</ul>
<p><a href="${escape(textUrl)}">Plain-text catalog</a></p>
</main>
</body>
</html>
`;
}

const helloEntries = readdirSync(helloDir).filter((name) => name.endsWith('.lms') && name !== 'hello.lms').sort().map((file) => {
  const source = readFileSync(join(helloDir, file), 'utf8');
  const description = /^\/\/ description: (.+)$/m.exec(source)?.[1];
  const roleCount = [...source.matchAll(/^\/\/ autorun-role: /gm)].length;
  if (!description || !sentence(description) || roleCount !== 1) throw new Error(`${file} needs a one-sentence description and exactly one autorun role`);
  if (check) {
    const compiled = spawnSync('lmscript', ['--check', join(helloDir, file)], { encoding: 'utf8' });
    if (compiled.error || compiled.status !== 0) throw new Error(`lmscript --check failed for ${file}: ${compiled.stderr || compiled.error?.message || `exit ${compiled.status}`}`);
  }
  return { name: file.slice(0, -4), description, url: file };
});
if (!helloEntries.length) throw new Error('No provider hello scripts found.');

const tools = JSON.parse(readFileSync(join(root, 'scripts/autorun-examples.json'), 'utf8'));
const autorunEntries = [...tools, ...helloEntries.map(({ name, description, url }) => ({ name, description, url: `https://lmctl.com/helloexample/${url}` }))];
const names = new Set();
for (const entry of autorunEntries) {
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(entry.name) || names.has(entry.name) || !sentence(entry.description) || !/^https:\/\/lmctl\.com\/.+\.lms$/.test(entry.url)) {
    throw new Error(`Invalid or duplicate autorun catalog entry: ${entry.name}`);
  }
  names.add(entry.name);
  const path = entry.url.replace('https://lmctl.com/', '');
  if (!readFileSync(join(root, path), 'utf8').length) throw new Error(`Empty autorun script: ${path}`);
}

const helloTxt = helloEntries.map(({ name, description }) => `${name}\t${description}`).join('\n') + '\n';
const autorunTxt = autorunEntries.map(({ name, description, url }) => `${name}\t${description}\t${url}`).join('\n') + '\n';
writeOrCheck(join(helloDir, 'index.txt'), helloTxt);
writeOrCheck(join(helloDir, 'index.html'), page('Hello examples', 'Short, single-provider examples that seed a Lead, send one greeting prompt, and print the reply.', helloEntries, 'index.txt'));
writeOrCheck(join(root, 'autorun/index.txt'), autorunTxt);
writeOrCheck(join(root, 'autorun/index.html'), page('Autorun examples', 'Curated hosted LMScript examples. Each script is fetched and run locally by lmctl autorun.', autorunEntries, 'index.txt'));
console.log(`${check ? 'Checked' : 'Built'} ${helloEntries.length} hello examples and ${autorunEntries.length} autorun examples.`);
