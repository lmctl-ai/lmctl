// lmplot demo pages: send precompiled lmcode programs to the execution Worker and show what they draw.
// The page knows nothing about plotting; worker.js owns the WebAssembly host.
'use strict';
(function () {
  const $ = id => document.getElementById(id);
  const status = $('status');
  // The gallery sits one level above the example pages and the host files (data-base="browser/").
  const base = document.body.dataset.base || '';
  let worker = null, seq = 0;
  const pending = new Map();

  function startWorker() {
    worker = new Worker(base + 'worker.js');
    worker.onmessage = event => {
      const resolve = pending.get(event.data.id);
      pending.delete(event.data.id);
      if (resolve) resolve(event.data);
    };
    worker.onerror = event => {
      const message = (event && event.message) || 'the execution Worker failed to start';
      for (const resolve of pending.values()) resolve({ok: false, error: message});
      pending.clear();
      worker = null;
    };
  }
  // program: a URL relative to worker.js (examples/<name>.bin).
  function run(program, output) {
    if (!worker) startWorker();
    return new Promise(resolve => {
      const id = ++seq;
      pending.set(id, resolve);
      worker.postMessage({id, program, output});
    });
  }

  function dataUrl(buffer, mime) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return 'data:' + mime + ';base64,' + btoa(binary);
  }
  const kb = n => n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(1) + ' KB' : (n / 1048576).toFixed(2) + ' MB';
  const ms = n => n < 1000 ? Math.round(n) + ' ms' : (n / 1000).toFixed(2) + ' s';
  function failure(result) {
    if (!result.ok) return result.error;
    if (result.frame && result.frame.ok === false) return result.frame.message || result.frame.code;
    if (result.code !== 0) return 'exit code ' + result.code + (result.stderr ? ': ' + result.stderr.trim() : '');
    if (!result.images.length) return 'the program wrote no images';
    return null;
  }

  // One example page: run on load and on demand.
  function examplePage(name) {
    const button = $('run'), mode = $('output-mode'), images = $('images'), echo = $('echo');
    let first = true;
    async function go() {
      button.disabled = true;
      mode.disabled = true;
      status.textContent = first ? 'Downloading and compiling the WebAssembly host, then running examples/' + name + '.bin…' : 'Running…';
      const output = mode.value;
      const result = await run('examples/' + name + '.bin', output);
      button.disabled = false;
      mode.disabled = false;
      const problem = failure(result);
      images.replaceChildren();
      echo.hidden = true;
      if (result.ok && result.stdout && result.stdout.trim()) {
        echo.textContent = result.stdout.trim();
        echo.hidden = false;
      }
      if (problem) {
        status.textContent = 'Failed: ' + problem;
        status.classList.add('error');
        return;
      }
      status.classList.remove('error');
      for (const image of result.images) {
        const url = dataUrl(image.bytes, image.mime);
        const file = image.path.split('/').pop();
        const figure = document.createElement('figure');
        const img = document.createElement('img');
        img.src = url;
        img.alt = 'gnuplot output ' + image.path;
        const caption = document.createElement('figcaption');
        const link = document.createElement('a');
        link.href = url;
        link.download = file;
        link.textContent = 'Download';
        caption.append(image.path + ' · ' + kb(image.bytes.byteLength) + ' · ', link);
        figure.append(img, caption);
        images.append(figure);
      }
      const boot = first ? ' (first run: host ' + kb(result.wasmBytes) + ' fetched and compiled in ' + ms(result.bootMs) + ')' : '';
      status.textContent = 'Ran ' + kb(result.programBytes) + ' of bytecode in ' + ms(result.ms) + ' · ' + result.images.length +
        ' ' + output.toUpperCase() + ' file' + (result.images.length === 1 ? '' : 's') + boot;
      first = false;
    }
    button.addEventListener('click', go);
    mode.addEventListener('change', go);
    go();
  }

  // The gallery: run every example once, in order, and report.
  function galleryPage() {
    const button = $('run-all');
    button.addEventListener('click', async () => {
      button.disabled = true;
      const cards = Array.from(document.querySelectorAll('.gallery li[data-example]'));
      cards.forEach(card => { card.querySelector('.card-status').textContent = 'waiting'; card.classList.remove('passed', 'failed'); });
      let passed = 0, total = 0, files = 0;
      const t0 = performance.now();
      for (const card of cards) {
        const name = card.dataset.example;
        const note = card.querySelector('.card-status');
        note.textContent = 'running…';
        status.textContent = 'Running ' + name + ' (' + (passed + 1) + ' of ' + cards.length + ')…';
        const result = await run('examples/' + name + '.bin', 'svg');
        const problem = failure(result);
        if (problem) {
          note.textContent = 'failed: ' + problem;
          card.classList.add('failed');
        } else {
          passed++;
          total += result.ms;
          files += result.images.length;
          note.textContent = 'ok · ' + result.images.length + ' SVG · ' + ms(result.ms);
          card.classList.add('passed');
        }
      }
      status.textContent = passed + ' of ' + cards.length + ' examples ran in this tab: ' + files + ' SVG files, ' + ms(total) +
        ' of execution (' + ms(performance.now() - t0) + ' wall clock including the host download).';
      button.disabled = false;
    });
  }

  const name = document.body.dataset.example;
  if (name) examplePage(name);
  else if (document.body.dataset.page === 'gallery') galleryPage();
}());
