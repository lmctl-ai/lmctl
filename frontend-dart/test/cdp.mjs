// Minimal CDP driver: node cdp.mjs <port> <url> [cpuThrottle]  -> prints JSON result of window.__check()
const [port, url, throttle, expr] = process.argv.slice(2);
const ver = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
const ws = new WebSocket(ver.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
let id = 0; const pend = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
const send = (method, params = {}, sessionId) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({id: i, method, params, sessionId})); });
await send('Browser.grantPermissions', {origin: new URL(url).origin, permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite']});
const {result: {targetId}} = await send('Target.createTarget', {url: 'about:blank'});
const {result: {sessionId}} = await send('Target.attachToTarget', {targetId, flatten: true});
await send('Page.enable', {}, sessionId); await send('Emulation.setFocusEmulationEnabled', {enabled: true}, sessionId);
await send('Network.enable', {}, sessionId); await send('Network.setCacheDisabled', {cacheDisabled: true}, sessionId);
if (throttle) await send('Emulation.setCPUThrottlingRate', {rate: +throttle}, sessionId);
await send('Page.navigate', {url}, sessionId); await new Promise(r => setTimeout(r, expr ? 500 : 1200));
const ev = await send('Runtime.evaluate', {expression: expr || 'window.__check()', awaitPromise: true, returnByValue: true}, sessionId);
console.log(JSON.stringify(ev.result.result.value ?? ev.result));
await send('Target.closeTarget', {targetId}); ws.close();
