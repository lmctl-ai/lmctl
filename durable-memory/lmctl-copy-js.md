# lmctl-copy.js - shared copy-to-clipboard hydration

static/js/lmctl-copy.js adds copy buttons to marked code at load time and after SPA navigation. Docusaurus serves it at https://lmctl.com/js/lmctl-copy.js. Existing consumers use the lm-copy class on a pre or code element; data-copy-lines selects a line range, and lm-copy-lines adds per-line buttons.

A leading dollar prompt is stripped from copied text. Styles are injected by the script for light and dark color schemes. Docusaurus loads it through its scripts configuration. GitHub READMEs cannot run JavaScript; GitHub provides its own whole-block copy control. Prior Chromium localhost verification covered block, line range, per-line and inline copies.

For plain tools pages, the publication inventory additionally serves the canonical source at /tools/lmctl-copy.js. The only permitted script element is deferred and same-origin in head. An existing kbd directly inside pre enables copying the command without adjacent samp output; no authored classes or data attributes are needed. Runtime buttons add their wrapper class for positioning. Chromium verification covers the command-only clipboard and positioning at narrow/wide viewports. See tools-from-examples.md for the import pipeline and tests.
