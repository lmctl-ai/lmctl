// Run one precompiled lmcode program on the lmplot WebAssembly host.
//
// The wasm module is the fixed "system" layer (gnuplot + the lmcode VM + the Plot host functions);
// lmcode programs are application code loaded at run time as bytecode. Nothing here knows about a
// particular plot. The compiled WebAssembly.Module is reused; every run instantiates it afresh, so
// a program never sees the gnuplot variables, terminal or files of a previous run.
//
// Shared by worker.js (browser, classic Worker: a global) and the Node tests (CommonJS).
//
//   runProgram(createLmplot, wasmModule, {program, files, output: 'svg' | 'png', memoryMB})
//   -> Promise<{code, frame, stdout, stderr, images: [{path, mime, bytes}]}>
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.lmplotRunner = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const RETURN_BEGIN = 'LMCODE_RETURN_BEGIN\n';

  async function runProgram(createLmplot, wasmModule, {program, files = [], output = 'svg', memoryMB} = {}) {
    if (output !== 'svg' && output !== 'png') throw new Error('output must be svg or png');
    let stdout = '', stderr = '';
    const mod = await createLmplot({
      instantiateWasm(imports, done) {
        WebAssembly.instantiate(wasmModule, imports).then(instance => done(instance, wasmModule));
        return {};
      },
      print: line => { stdout += line + '\n'; },
      printErr: line => { stderr += line + '\n'; },
      // The C environment is built from ENV when the runtime starts, so set it in preRun.
      preRun: [m => {
        m.ENV.LMPLOT_PNG_AS = output;
        if (memoryMB) m.ENV.LMPLOT_MAX_MEMORY_MB = String(memoryMB);
      }],
    });
    const FS = mod.FS;
    FS.mkdirTree('/work/images');
    FS.mkdirTree('/work/build');
    FS.chdir('/work');
    for (const file of files) {
      const dir = file.path.split('/').slice(0, -1).join('/');
      if (dir) FS.mkdirTree('/work/' + dir);
      FS.writeFile('/work/' + file.path, file.bytes);
    }
    FS.writeFile('/work/program.dslb', program);
    let code;
    try {
      code = mod.callMain(['--lmcode', '/work/program.dslb']);
    } catch (error) {
      // exit() surfaces as an ExitStatus; anything else is a host crash and propagates.
      if (error && error.name === 'ExitStatus') code = error.status;
      else throw error;
    }
    // stdout ends with one result frame between LMCODE_RETURN_BEGIN/END; before it is plot.echo output.
    let frame = null;
    const begin = stdout.lastIndexOf(RETURN_BEGIN);
    if (begin >= 0) {
      const end = stdout.indexOf('\nLMCODE_RETURN_END', begin);
      try { frame = JSON.parse(stdout.slice(begin + RETURN_BEGIN.length, end)); } catch (e) { frame = null; }
      stdout = stdout.slice(0, begin);
    }
    const images = [];
    const walk = dir => {
      for (const name of FS.readdir(dir)) {
        if (name === '.' || name === '..') continue;
        const path = dir + '/' + name;
        if (FS.isDir(FS.stat(path).mode)) { walk(path); continue; }
        const mime = name.endsWith('.svg') ? 'image/svg+xml' : name.endsWith('.png') ? 'image/png' : null;
        if (mime) images.push({path: path.slice('/work/'.length), mime, bytes: FS.readFile(path)});
      }
    };
    walk('/work/images');
    images.sort((a, b) => a.path.localeCompare(b.path, 'en', {numeric: true}));
    return {code, frame, stdout, stderr, images};
  }

  return {runProgram};
}));
