// Unit test for infra/lmctl-www-redirect.js (CloudFront Function, no module
// syntax): load the handler and check the routing table.
// Run: node tests/infra/lmctl-www-redirect.test.mjs
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const src = readFileSync(new URL('../../infra/lmctl-www-redirect.js', import.meta.url), 'utf8');
const handler = new Function(`${src}\nreturn handler;`)();
const run = (uri, host = 'lmctl.com', querystring = {}) =>
  handler({ request: { uri, querystring, headers: { host: { value: host } } } });
const rewrites = (uri, to) => assert.equal(run(uri).uri, to, uri);
const redirects = (uri, to, qs) => {
  const r = run(uri, 'lmctl.com', qs);
  assert.equal(r.statusCode, 301, uri);
  assert.equal(r.headers.location.value, to, uri);
};

rewrites('/tools', '/tools/index.html');
rewrites('/tools/', '/tools/index.html');
rewrites('/tools/lmscript', '/tools/lmscript/index.html');
rewrites('/tools/lmscript/tutorial', '/tools/lmscript/tutorial.html');
rewrites('/tools/lmscript/tutorial.html', '/tools/lmscript/tutorial.html');
rewrites('/tools/lmscript/index.html', '/tools/lmscript/index.html');
rewrites('/tools/style.css', '/tools/style.css');
rewrites('/tools/lmcad/img/box.png', '/tools/lmcad/img/box.png');
redirects('/tools/lmscript/', '/tools/lmscript');
redirects('/tools/lmscript/user-guide/', '/tools/lmscript/user-guide', {});
redirects('/tools/lmhtml/', '/tools/lmhtml?a=1', { a: { value: '1' } });
// Existing behaviour is unchanged.
rewrites('/lmctl', '/lmctl/index.html');
rewrites('/lmprobe/guide', '/lmprobe/guide.html');
rewrites('/skills/lmctl-lead.md', '/skills/lmctl-lead.md');
rewrites('/quickrun/', '/quickrun/');
redirects('/lmctl/docs/', '/lmctl/docs');
assert.equal(run('/x', 'www.lmctl.com').headers.location.value, 'https://lmctl.com/x');
console.log('lmctl-www-redirect: all routing cases pass');
