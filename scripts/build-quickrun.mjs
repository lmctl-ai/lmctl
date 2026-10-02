import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'quickrun');
const escape = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const samples = readdirSync(root).filter(name => name.endsWith('.lms')).sort().map(file => {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*\.lms$/.test(file)) throw new Error(`Invalid sample name: ${file}`);
  const description = /^\/\/ description: (.+)$/m.exec(readFileSync(join(root, file), 'utf8'))?.[1];
  if (!description) throw new Error(`Missing description: ${file}`);
  return { file, name: file.slice(0, -4), description };
});
if (!samples.length) throw new Error('No quickrun samples');
writeFileSync(join(root, 'index.txt'), samples.map(s => `${s.name}\t${s.description}`).join('\n') + '\n');
writeFileSync(join(root, 'index.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Quickrun samples · lmctl</title><base href="/quickrun/">
<style>
body{font:16px/1.6 system-ui,sans-serif;max-width:800px;margin:3rem auto;padding:0 1.2rem;color:#202124;background:#fff}h1{font-size:2rem;margin-bottom:.3rem}h2{font-size:1.2rem}a{color:#075db9}code,pre{background:#f3f4f6;border-radius:5px}code{padding:.15em .3em}pre{padding:1rem;overflow:auto}pre code{padding:0}article{border-top:1px solid #ddd;padding:1rem 0}p{margin:.5rem 0 1rem}.muted{color:#62666d}footer{margin-top:2rem}@media(prefers-color-scheme:dark){body{background:#151619;color:#eee}a{color:#83baff}code,pre{background:#25272c}.muted{color:#bbb}article{border-color:#41434a}}
</style></head><body>
<p><a href="/lmctl/">lmctl docs</a></p><h1>Quickrun samples</h1>
<p class="muted">Small, editable scripts for getting a team ready.</p>
<pre><code>lmctl init
lmctl quickrun
lmctl quickrun solo</code></pre>
<p>Use lmctl 0.2.30 or newer. Quickrun fetches the current script each time, so new samples do not require another CLI release.</p>
${samples.map(s => `<article><h2>${escape(s.name)}</h2><p>${escape(s.description)}</p><p><code>lmctl quickrun ${escape(s.name)}</code> · <a href="${escape(s.file)}">Read the script</a></p></article>`).join('\n')}
<h2>Your providers and models</h2>
<p><code>Provider1</code> and <code>Model1</code> come from the first slot in <code>~/.lmctl/init.toml</code>. Slots 2 and 3 supply the matching variables. Scripts receive these names as variables containing your configured values.</p>
<p>The samples preserve existing teamfiles by choosing a numbered filename. They seed a tracked team before opening the terminal. With <code>lmctl --non-interactive quickrun solo</code>, they seed and print continuation commands without opening a TUI.</p>
<h2>Adapt a sample</h2>
<p>Download a script, edit it, then run <code>lmctl quickrun ./my-script.lms</code>. Explicit script URLs work too. Quickrun scripts execute locally with your permissions; read a script before running it.</p>
<footer><a href="index.txt">Plain-text catalog</a> · <a href="https://lmctl.com/lmctl/docs/manuals/cli-reference">CLI reference</a></footer>
</body></html>\n`);
console.log(`Built quickrun indexes for ${samples.length} samples`);
