#!/usr/bin/env node
// Validate the static /tools/ pages against the contract in tools/README.md.
// Zero dependencies (Node 22). Prints file:line: message for every problem
// and exits 1 when there is any.
//
//   node scripts/check-tools.mjs              check every page under tools/
//   node scripts/check-tools.mjs --selftest   every tests/tools/*.html must fail
//                                             with the message named in its
//                                             first-line <!-- expect: ... -->
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname, basename, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TOOLS = join(ROOT, 'tools');
const MAX_BYTES = 150 * 1024;
const STYLESHEET = '/tools/style.css';

const ALLOWED = new Set(('html head meta title link body header nav main section footer h1 h2 h3 h4 p ul ol li ' +
  'dl dt dd pre code kbd samp em strong a table thead tbody tr th td blockquote hr figure figcaption img').split(' '));
const VOID = new Set(['meta', 'link', 'img', 'hr']);
// Attributes allowed per element; anything else (class, style, on*, ...) is an error.
const ATTRS = {
  html: ['lang'], meta: ['charset', 'name', 'content'], link: ['rel', 'href'], a: ['href'],
  img: ['src', 'alt', 'width', 'height'], h2: ['id'], h3: ['id'], ol: ['start'],
  th: ['scope', 'colspan', 'rowspan'], td: ['colspan', 'rowspan'],
};
const HEADINGS = {
  'skill.html': ['Purpose', 'When to use it', 'Install', 'Commands', 'Inputs and outputs', 'Safety rules',
    'Worked examples', 'Errors and exit codes', 'How to verify'],
  'user-guide.html': ['Overview', 'Install', 'Concepts', 'Reference', 'Tasks', 'Limits', 'Troubleshooting'],
};

// ---- tokenizer: doctype, comments, start/end tags with attributes, text ----
function tokenize(src, report) {
  const tokens = [];
  let i = 0, line = 1;
  const advance = (to) => { for (; i < to; i++) if (src[i] === '\n') line++; };
  while (i < src.length) {
    if (src[i] !== '<') {
      const next = src.indexOf('<', i);
      const end = next === -1 ? src.length : next;
      tokens.push({ type: 'text', text: src.slice(i, end), line });
      advance(end);
      continue;
    }
    if (src.startsWith('<!--', i)) {
      const end = src.indexOf('-->', i + 4);
      if (end === -1) { report(line, 'unterminated comment'); break; }
      tokens.push({ type: 'comment', text: src.slice(i + 4, end), line });
      advance(end + 3);
      continue;
    }
    const m = /^<(\/?)([A-Za-z][A-Za-z0-9-]*|!doctype)/i.exec(src.slice(i, i + 40));
    if (!m) { report(line, 'unescaped "<" in text (write &lt;)'); tokens.push({ type: 'text', text: '<', line }); advance(i + 1); continue; }
    const startLine = line;
    let j = i + m[0].length, quote = null;
    for (; j < src.length; j++) {
      const c = src[j];
      if (quote) { if (c === quote) quote = null; } else if (c === '"' || c === "'") quote = c; else if (c === '>') break;
    }
    if (j >= src.length) { report(startLine, `unterminated tag <${m[2]}`); break; }
    const name = m[2].toLowerCase();
    const body = src.slice(i + m[0].length, j);
    advance(j + 1);
    if (name === '!doctype') { tokens.push({ type: 'doctype', text: body.trim(), line: startLine }); continue; }
    if (m[1]) { tokens.push({ type: 'end', name, line: startLine }); continue; }
    const attrs = new Map();
    const re = /([^\s=/"'>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
    let a;
    while ((a = re.exec(body))) {
      const key = a[1].toLowerCase();
      if (attrs.has(key)) report(startLine, `duplicate attribute ${key} on <${name}>`);
      attrs.set(key, a[2] ?? a[3] ?? a[4] ?? '');
    }
    tokens.push({ type: 'start', name, attrs, line: startLine });
  }
  return tokens;
}

const decode = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const normalize = (s) => decode(s).replace(/\s+/g, ' ').trim();

// ---- per-page checks; returns { nav, ids, links, errors } ----
function checkPage(file, opts = {}) {
  const errors = [];
  const rel = relative(ROOT, file);
  const report = (line, msg) => errors.push(`${rel}:${line}: ${msg}`);
  const src = readFileSync(file, 'utf8');
  if (Buffer.byteLength(src) > MAX_BYTES) report(1, `page is ${Buffer.byteLength(src)} bytes (limit ${MAX_BYTES})`);
  const tokens = tokenize(src, report);
  const first = tokens.find((t) => t.type !== 'comment' && !(t.type === 'text' && !t.text.trim()));
  if (!first || first.type !== 'doctype' || first.text.toLowerCase() !== 'html') report(1, 'page must start with <!doctype html>');

  const stack = [], ids = new Map(), links = [], headings = [];
  let h1 = 0, stylesheets = 0, charset = false, viewport = false, description = false, title = '', inTitle = false;
  let navText = null, navDepth = -1, navLinksTools = false, current = null;
  const bodyChildren = [];
  for (const t of tokens) {
    if (navDepth >= 0 && t !== null) {
      navText += t.type === 'start' ? `<${t.name}${[...t.attrs].map(([k, v]) => ` ${k}="${v}"`).join('')}>`
        : t.type === 'end' ? `</${t.name}>` : t.type === 'text' ? t.text : '';
    }
    if (t.type === 'start') {
      const { name, attrs, line } = t;
      if (!ALLOWED.has(name)) report(line, `forbidden element <${name}>`);
      for (const [key, value] of attrs) {
        if (!(ATTRS[name] || []).includes(key)) {
          report(line, key === 'id' ? `id is only allowed on h2/h3, not <${name}>` : `forbidden attribute ${key} on <${name}>`);
        }
        if (key === 'id') {
          if (ids.has(value)) report(line, `duplicate id "${value}"`);
          ids.set(value, line);
        }
      }
      const parent = stack.length ? stack[stack.length - 1].name : null;
      if (parent === 'body') bodyChildren.push({ name, line });
      if (name === 'html' && attrs.get('lang') !== 'en') report(line, '<html> needs lang="en"');
      if (name === 'meta') {
        if (attrs.has('charset')) { charset = true; if (attrs.get('charset').toLowerCase() !== 'utf-8') report(line, 'charset must be utf-8'); }
        if (attrs.get('name') === 'viewport') viewport = true;
        if (attrs.get('name') === 'description') { description = true; if (!attrs.get('content')?.trim()) report(line, 'empty meta description'); }
      }
      if (name === 'link') {
        stylesheets++;
        if (attrs.get('rel') !== 'stylesheet' || attrs.get('href') !== STYLESHEET) report(line, `the only <link> allowed is rel="stylesheet" href="${STYLESHEET}"`);
      }
      if (name === 'title') inTitle = true;
      if (name === 'h1') { h1++; if (!stack.some((s) => s.name === 'main')) report(line, '<h1> must be inside <main>'); }
      if (name === 'h2' || name === 'h3') current = { name, id: attrs.get('id'), text: '', line };
      if (name === 'nav' && parent === 'body') { navDepth = stack.length; navText = '<nav>'; }
      if (name === 'a') {
        const href = attrs.get('href');
        if (href === undefined || href === '') report(line, '<a> without href');
        else links.push({ href, line });
        if (navDepth >= 0 && href === '/tools/') navLinksTools = true;
      }
      if (name === 'img') {
        const src = attrs.get('src') || '';
        if (!attrs.get('alt')?.trim()) report(line, '<img> needs a non-empty alt');
        if (parent !== 'figure') report(line, '<img> must be inside <figure>');
        if (!/^\/tools\/[a-z0-9-]+\/img\/[^/]+$/.test(src)) report(line, `image must be local under /tools/<tool>/img/: ${src}`);
        else if (!existsSync(join(ROOT, src))) report(line, `image not found: ${src}`);
      }
      if (!VOID.has(name)) stack.push({ name, line });
    } else if (t.type === 'end') {
      if (VOID.has(t.name)) { report(t.line, `void element </${t.name}> must not be closed`); continue; }
      const top = stack.pop();
      if (!top || top.name !== t.name) {
        report(t.line, `</${t.name}> closes <${top ? top.name : 'nothing'}>${top ? ` from line ${top.line}` : ''}`);
        if (top) stack.push(top);
        continue;
      }
      if (t.name === 'title') inTitle = false;
      if ((t.name === 'h2' || t.name === 'h3') && current) { headings.push({ ...current, text: normalize(current.text) }); current = null; }
      if (t.name === 'nav' && navDepth === stack.length) navDepth = -1;
    } else if (t.type === 'text') {
      if (inTitle) title += t.text;
      if (current) current.text += t.text;
    }
  }
  for (const s of stack) report(s.line, `<${s.name}> is never closed`);
  if (!charset) report(1, 'missing <meta charset="utf-8">');
  if (!viewport) report(1, 'missing <meta name="viewport">');
  if (!description) report(1, 'missing <meta name="description">');
  if (!title.trim()) report(1, 'missing or empty <title>');
  if (stylesheets !== 1) report(1, `expected exactly one stylesheet <link>, found ${stylesheets}`);
  if (h1 !== 1) report(1, `expected exactly one <h1>, found ${h1}`);
  const layout = bodyChildren.map((c) => c.name).filter((n) => n !== 'header').join(',');
  if (layout !== 'nav,main,footer') report(bodyChildren[0]?.line ?? 1, `<body> must contain <nav>, <main>, <footer> in that order (found ${layout || 'nothing'})`);
  if (navText === null) report(1, 'missing <nav>');
  else {
    if (!/^<nav>\s*<ul>[\s\S]*<\/ul>\s*<\/nav>$/.test(navText.trim())) report(1, '<nav> must hold exactly one <ul>');
    if (!navLinksTools) report(1, '<nav> must link to /tools/');
  }
  // Self-test pages use a suffix (x.skill.html) to get a page type's rules.
  const page = basename(file).replace(/^.*\.(skill|user-guide|tutorial)\.html$/, '$1.html');
  if (HEADINGS[page] && !opts.standalone) {
    const want = HEADINGS[page], got = headings.filter((h) => h.name === 'h2').map((h) => h.text);
    if (got.join('|') !== want.join('|')) report(headings[0]?.line ?? 1, `${page} h2 headings must be exactly: ${want.join(', ')} (found: ${got.join(', ')})`);
  }
  if (page === 'tutorial.html' && !opts.standalone) {
    const h2s = headings.filter((h) => h.name === 'h2');
    if (!h2s.length || !/^what you learned$/i.test(h2s[h2s.length - 1].text)) report(1, 'tutorial must end with an h2 "What you learned"');
    if (!/<pre>\s*<kbd>/.test(src)) report(1, 'tutorial needs commands as <pre><kbd>…</kbd></pre>');
  }
  return { nav: navText && normalize(navText), ids, links, errors };
}

// Map a site-rooted /tools/ href to a file under tools/ (null when it cannot exist).
function targetFile(path) {
  const clean = posix.normalize(path);
  if (!clean.startsWith('/tools/') && clean !== '/tools') return null;
  const local = join(ROOT, clean);
  if (clean.endsWith('/') || clean === '/tools') return join(local, 'index.html');
  if (existsSync(local) && statSync(local).isFile()) return local;
  if (existsSync(local + '.html')) return local + '.html';
  if (existsSync(join(local, 'index.html'))) return join(local, 'index.html');
  return local;
}

function checkLinks(file, result, pages) {
  for (const { href, line } of result.links) {
    const where = `${relative(ROOT, file)}:${line}`;
    if (/^(https?:|mailto:)/i.test(href)) continue;
    if (/^[a-z][a-z0-9+.-]*:/i.test(href)) { result.errors.push(`${where}: unsupported link scheme: ${href}`); continue; }
    if (href.startsWith('#')) {
      if (!result.ids.has(href.slice(1))) result.errors.push(`${where}: no id "${href.slice(1)}" on this page`);
      continue;
    }
    if (!href.startsWith('/')) { result.errors.push(`${where}: internal links must be site-rooted (/tools/...): ${href}`); continue; }
    const [path, anchor] = href.split('#');
    if (!path.startsWith('/tools')) continue; // other site sections are not checked here
    const target = targetFile(path);
    if (!target || !existsSync(target)) { result.errors.push(`${where}: broken link ${href}`); continue; }
    if (anchor !== undefined) {
      const ids = pages.get(target)?.ids ?? checkPage(target, { standalone: true }).ids;
      if (!ids.has(anchor)) result.errors.push(`${where}: no id "${anchor}" in ${relative(ROOT, target)}`);
    }
  }
}

function htmlFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...htmlFiles(full));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out.sort();
}

function checkTree() {
  const files = htmlFiles(TOOLS);
  const pages = new Map(files.map((f) => [f, checkPage(f)]));
  const errors = [];
  for (const [file, result] of pages) checkLinks(file, result, pages);
  // Nav must be identical on every page of a tool.
  const byTool = new Map();
  for (const [file, result] of pages) {
    const tool = relative(TOOLS, dirname(file));
    if (!tool) continue;
    if (!byTool.has(tool)) byTool.set(tool, []);
    byTool.get(tool).push([file, result]);
  }
  for (const [tool, list] of byTool) {
    const [firstFile, first] = list[0];
    for (const [file, result] of list.slice(1)) {
      if (result.nav !== first.nav) errors.push(`${relative(ROOT, file)}:1: <nav> differs from ${relative(ROOT, firstFile)}`);
    }
    for (const page of ['index.html', 'tutorial.html', 'user-guide.html', 'skill.html']) {
      if (!existsSync(join(TOOLS, tool, page))) errors.push(`tools/${tool}/${page}:1: missing page`);
    }
  }
  // Every tool is listed on tools/index.html.
  const indexPage = pages.get(join(TOOLS, 'index.html'));
  for (const tool of byTool.keys()) {
    if (indexPage && !indexPage.links.some((l) => l.href.startsWith(`/tools/${tool}/`))) {
      errors.push(`tools/index.html:1: tool ${tool} is not listed`);
    }
  }
  for (const result of pages.values()) errors.push(...result.errors);
  return { files, errors };
}

function selftest() {
  const dir = join(ROOT, 'tests', 'tools');
  const bad = readdirSync(dir).filter((f) => f.endsWith('.html')).sort();
  let failures = 0;
  for (const name of bad) {
    const file = join(dir, name);
    const expect = /<!--\s*expect:\s*(.*?)\s*-->/.exec(readFileSync(file, 'utf8'))?.[1];
    const result = checkPage(file);
    checkLinks(file, result, new Map());
    const hit = expect && result.errors.some((e) => e.includes(expect));
    console.log(`${hit ? 'ok  ' : 'FAIL'} ${relative(ROOT, file)} (expect: ${expect ?? 'missing <!-- expect: ... -->'})`);
    if (!hit) { failures++; for (const e of result.errors) console.log(`       got: ${e}`); }
  }
  console.log(failures ? `selftest: ${failures} failure(s)` : `selftest: ${bad.length} cases passed`);
  return failures ? 1 : 0;
}

const args = new Set(process.argv.slice(2));
if (args.has('--selftest')) process.exit(selftest());
const { files, errors } = checkTree();
for (const e of errors) console.log(e);
console.log(errors.length ? `check-tools: ${errors.length} error(s) in ${files.length} page(s)` : `check-tools: ${files.length} page(s) OK`);
process.exit(errors.length ? 1 : 0);
