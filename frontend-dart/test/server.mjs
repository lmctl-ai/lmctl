import http from 'node:http'; import {readFileSync} from 'node:fs';
const W = process.argv[2], port = +process.argv[3];
const js = { teavm: f => `${W}/teavm/target/js/${f}.js`, dart: f => `${W}/dart/build/O2/${f}.js` };
const page = (stack, xref, bundle) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>t</title></head><body>
<main data-xref-src="data/${xref}.json"><h1>Static</h1><p><a id="rel" href="guide.html">guide</a> inline <code>x</code></p>
<pre><code>alpha &lt;1&gt;</code></pre><pre><code>beta</code></pre></main>
<pre id="result"></pre>
<script src="/js/${stack}/${bundle}.js"></script>
${stack === 'teavm' ? '<script>main();</script>' : ''}
<script>window.__t1 = performance.now();</script>
<script>
window.addEventListener('error', e => (window.__errs = window.__errs || []).push(String(e.message)));
window.__check = async () => {
  const r = {};
  r.url = location.pathname + location.search; r.rel = document.getElementById('rel').href.replace(location.origin, '');
  const btns = [...document.querySelectorAll('button.copy-btn')];
  r.buttons = btns.map(b => b.getAttribute('aria-label'));
  r.order = [...document.querySelectorAll('main > *')].map(e => e.tagName + (e.className ? '.' + e.className : '')).join(' ');
  if (btns[1]) { btns[1].focus(); btns[1].click(); await new Promise(f => setTimeout(f, 500));
    r.afterClick = btns[1].textContent + ' | ' + btns[1].nextSibling.textContent + ' | focus=' + (document.activeElement === btns[1]);
    try { r.clipboard = await navigator.clipboard.readText(); } catch (e) { r.clipboard = 'ERR ' + e.name; }
    r.liveAttrs = btns[1].nextSibling.getAttribute('role') + '/' + btns[1].nextSibling.getAttribute('aria-live'); }
  const s = document.querySelector('section.xref');
  r.xref = s ? s.outerHTML : null; r.xrefAfterMain = s ? s.previousElementSibling.tagName : null;
  const retry = s && s.querySelector('button');
  if (retry) { retry.click(); await new Promise(f => setTimeout(f, 400)); r.sectionsAfterRetry = document.querySelectorAll('section.xref').length; }
  r.errors = window.__errs || [];
  r.execMs = +(window.__t1 - performance.getEntriesByType('resource').find(e => e.name.endsWith('.js')).responseEnd).toFixed(2); await new Promise(f => setTimeout(f, 2000)); if (btns[1]) r.afterReset = btns[1].textContent + '|' + btns[1].nextSibling.textContent; return r;
};
</script></body></html>`;
http.createServer((q, s) => {
  const u = new URL(q.url, 'http://x'); let m;
  if ((m = u.pathname.match(/^\/js\/(teavm|dart)\/(\w+)\.js$/))) { s.writeHead(200, {'content-type': 'text/javascript'}); return s.end(readFileSync(js[m[1]](m[2]))); }
  if (u.pathname === '/tools/demo' || u.pathname === '/tools/demo/') { s.writeHead(200, {'content-type': 'text/html'});
    return s.end(page(u.searchParams.get('stack'), u.searchParams.get('xref') || 'ok', u.searchParams.get('bundle') || 'all')); }
  if ((m = u.pathname.match(/^\/tools\/demo\/data\/(\w+)\.json$/))) {
    const k = m[1];
    if (k === 'fail') { s.writeHead(500); return s.end('boom'); }
    s.writeHead(200, {'content-type': 'application/json'});
    if (k === 'empty') return s.end('[]');
    if (k === 'bad') return s.end('{not json');
    return s.end(JSON.stringify([{title: 'One <b>', href: '../one/', note: 'n1'}, {title: 'Evil', href: 'javascript:alert(1)'}, {title: '', href: 'x'}, null, 7, {title: 'Two', href: 'https://example.com/two'}]));
  }
  s.writeHead(404); s.end('nf');   // note: /tools/data/*.json (unfixed base) is a 404
}).listen(port, '127.0.0.1');
