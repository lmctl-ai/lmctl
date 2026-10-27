/*! lmctl-copy.js - one reusable script that adds copy buttons to marked code blocks.
 *
 * Usage: include once (<script src="/js/lmctl-copy.js" defer></script>) and mark code:
 *   <pre class="lm-copy"><code>npm install -g @lmctl-ai/lmctl</code></pre>     whole-block button
 *   <pre class="lm-copy" data-copy-lines="2-3,5"><code>...</code></pre>        button copies only these lines
 *   <pre class="lm-copy lm-copy-lines"><code>...</code></pre>                  one small button per line
 *   <code class="lm-copy">lmctl autorun x.lms</code>                            inline code
 * A leading "$ " prompt is stripped from copied text. Works after SPA navigation (MutationObserver).
 */
(function () {
  'use strict';
  if (window.__lmCopyLoaded) return;
  window.__lmCopyLoaded = true;

  var css = '.lm-copy-wrap{position:relative}' +
    '.lm-copy-btn{position:absolute;top:6px;right:6px;font:12px/1 system-ui,sans-serif;padding:4px 8px;border:1px solid rgba(128,128,128,.5);border-radius:4px;background:rgba(255,255,255,.85);color:#222;cursor:pointer;opacity:.0;transition:opacity .15s}' +
    '.lm-copy-wrap:hover .lm-copy-btn,.lm-copy-btn:focus{opacity:1}' +
    '.lm-copy-btn.lm-copied{background:#2ea043;color:#fff;opacity:1}' +
    '.lm-copy-line{display:block;position:relative;padding-right:3em}' +
    '.lm-copy-line .lm-copy-btn{top:0;right:0;padding:1px 5px;font-size:11px}' +
    '.lm-copy-line:hover .lm-copy-btn{opacity:1}' +
    '@media (prefers-color-scheme:dark){.lm-copy-btn{background:rgba(30,30,30,.85);color:#eee}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function strip(t) { return t.replace(/^\$ /gm, ''); }

  function pickLines(text, spec) {
    var lines = text.replace(/\n$/, '').split('\n'), out = [];
    String(spec).split(',').forEach(function (part) {
      var m = part.trim().match(/^(\d+)(?:-(\d+))?$/);
      if (!m) return;
      var a = +m[1], b = m[2] ? +m[2] : a;
      for (var i = a; i <= b && i <= lines.length; i++) out.push(lines[i - 1]);
    });
    return out.join('\n');
  }

  function copy(text, btn) {
    var done = function () {
      var old = btn.textContent; btn.textContent = 'Copied'; btn.classList.add('lm-copied');
      setTimeout(function () { btn.textContent = old; btn.classList.remove('lm-copied'); }, 1200);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, function () { fallback(text); done(); });
    } else { fallback(text); done(); }
  }
  function fallback(text) {
    var ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(ta);
  }
  function button(label, getText) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'lm-copy-btn';
    b.textContent = label; b.setAttribute('aria-label', 'Copy to clipboard');
    b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); copy(strip(getText()), b); });
    return b;
  }

  function hydrate(el) {
    if (el.dataset.lmCopyDone) return;
    el.dataset.lmCopyDone = '1';
    var text = function () {
      var c = el.cloneNode(true);
      c.querySelectorAll('.lm-copy-btn').forEach(function (n) { n.remove(); });
      return c.textContent;
    };
    var command = el.querySelector('kbd');
    if (el.tagName === 'PRE' && command) {
      el.classList.add('lm-copy-wrap');
      el.appendChild(button('Copy', function () { return command.textContent; }));
      return;
    }
    if (el.tagName === 'PRE' && el.classList.contains('lm-copy-lines')) {
      var code = el.querySelector('code') || el;
      var lines = code.textContent.replace(/\n$/, '').split('\n');
      code.textContent = '';
      lines.forEach(function (ln) {
        var s = document.createElement('span'); s.className = 'lm-copy-line';
        s.appendChild(document.createTextNode(ln + '\n'));
        s.appendChild(button('Copy', function () { return ln; }));
        code.appendChild(s);
      });
      return;
    }
    var spec = el.getAttribute('data-copy-lines');
    var get = spec ? function () { return pickLines(text(), spec); } : text;
    if (el.tagName === 'PRE') {
      el.classList.add('lm-copy-wrap'); el.appendChild(button('Copy', get));
    } else {
      var b = button('Copy', get); b.style.position = 'static'; b.style.opacity = '1'; b.style.marginLeft = '6px';
      el.insertAdjacentElement('afterend', b);
    }
  }
  function scan(root) {
    (root || document).querySelectorAll('pre.lm-copy, code.lm-copy, .lm-copy > pre, pre:has(> kbd)').forEach(hydrate);
  }
  function start() {
    scan(document);
    new MutationObserver(function () { scan(document); }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
