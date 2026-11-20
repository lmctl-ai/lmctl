// lmplot execution Worker: owns the WebAssembly host. The page never touches wasm or MEMFS.
//   in:  {id, program: URL of a bytecode file | ArrayBuffer, output: 'svg' | 'png'}
//   out: {id, ok, code, frame, stdout, stderr, ms, images: [{path, mime, bytes}]} | {id, ok: false, error}
'use strict';
importScripts('lmplot.js', 'lmplot-runner.js');

let ready = null;
function boot() {
  if (!ready) {
    ready = (async () => {
      const [wasm, manifest] = await Promise.all([
        fetch('lmplot.wasm').then(r => { if (!r.ok) throw new Error('lmplot.wasm: HTTP ' + r.status); return r.arrayBuffer(); }),
        fetch('examples.json').then(r => { if (!r.ok) throw new Error('examples.json: HTTP ' + r.status); return r.json(); }),
      ]);
      const wasmModule = await WebAssembly.compile(wasm);
      // Data files the examples read, mounted at their repository paths (examples/data/...).
      const files = await Promise.all(manifest.data.map(async d => {
        const r = await fetch(d.url);
        if (!r.ok) throw new Error(d.url + ': HTTP ' + r.status);
        return {path: d.path, bytes: new Uint8Array(await r.arrayBuffer())};
      }));
      return {wasmModule, files, wasmBytes: wasm.byteLength};
    })();
    ready.catch(() => { ready = null; });
  }
  return ready;
}

self.onmessage = async event => {
  const {id, program, output} = event.data;
  try {
    const t0 = performance.now();
    const {wasmModule, files, wasmBytes} = await boot();
    const tReady = performance.now();
    let bytes = program;
    if (typeof program === 'string') {
      const r = await fetch(program);
      if (!r.ok) throw new Error(program + ': HTTP ' + r.status);
      bytes = await r.arrayBuffer();
    }
    const tRun = performance.now();
    const result = await self.lmplotRunner.runProgram(self.createLmplot, wasmModule, {program: new Uint8Array(bytes), files, output});
    const ms = performance.now() - tRun;
    const images = result.images.map(i => ({path: i.path, mime: i.mime, bytes: i.bytes.buffer}));
    self.postMessage({id, ok: true, ...result, images, ms, bootMs: tReady - t0, programBytes: bytes.byteLength, wasmBytes},
      images.map(i => i.bytes));
  } catch (error) {
    self.postMessage({id, ok: false, error: String(error && error.message || error)});
  }
};
