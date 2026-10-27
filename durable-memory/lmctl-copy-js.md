# lmctl-copy.js - shared copy-to-clipboard hydration

`static/js/lmctl-copy.js` (served at https://lmctl.com/js/lmctl-copy.js) adds copy buttons to marked code at load time and after SPA navigation. Include once; mark code with a class:

- `<pre class="lm-copy">` whole-block button
- `<pre class="lm-copy" data-copy-lines="2-3,5">` button copies only those lines
- `<pre class="lm-copy lm-copy-lines">` one small button per line
- `<code class="lm-copy">` inline code

A leading `$ ` prompt is stripped from copied text. Styles are injected by the script (light/dark). Docusaurus loads it through `scripts` in `docusaurus.config.ts`. Note: GitHub READMEs cannot run JavaScript (GitHub provides its own whole-block copy button); use this script for lmctl.com, generated gallery pages and any HTML we publish. Verified headless (Chromium, localhost): block, line range, per-line and inline copies return the expected text.
