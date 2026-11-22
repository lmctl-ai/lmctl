import 'dart:async';
import 'dart:js_interop';
import 'dart:js_interop_unsafe';

import 'package:web/web.dart';

const _reset = Duration(seconds: 2);

/// Job 2: add an accessible "copy to clipboard" button to every code block.
void addCopyButtons() {
  final blocks = document.querySelectorAll('pre > code');
  final total = blocks.length;
  for (var i = 0; i < total; i++) {
    _attach(blocks.item(i) as HTMLElement, i + 1, total);
  }
}

void _attach(HTMLElement code, int index, int total) {
  final pre = code.parentElement!;
  if (pre.hasAttribute('data-copy-ready')) return;
  pre.setAttribute('data-copy-ready', '');

  final button = document.createElement('button') as HTMLButtonElement
    ..type = 'button'
    ..className = 'copy-btn'
    ..textContent = 'Copy';
  button.setAttribute(
      'aria-label',
      total > 1
          ? 'Copy code block $index of $total to clipboard'
          : 'Copy code to clipboard');

  // Polite live region: announces the result without moving focus off the button.
  final status = document.createElement('span') as HTMLElement
    ..className = 'copy-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');

  final row = document.createElement('div')..className = 'copy-row';
  row.append(button);
  row.append(status);
  pre.after(row);

  button.addEventListener(
      'click',
      (Event _) {
        _copy(code.textContent ?? '').then((ok) => _report(button, status, ok));
      }.toJS);
}

Future<bool> _copy(String text) async {
  if (window.isSecureContext && window.navigator.has('clipboard')) {
    try {
      await window.navigator.clipboard.writeText(text).toDart;
      return true;
    } catch (_) {
      // permission denied or document not focused: fall through to the legacy path
    }
  }
  return _legacyCopy(text);
}

/// Fallback for insecure contexts and denied permissions; keeps focus where it was.
bool _legacyCopy(String text) {
  final active = document.activeElement;
  final ta = document.createElement('textarea') as HTMLTextAreaElement
    ..value = text
    ..readOnly = true;
  ta.style
    ..position = 'fixed'
    ..top = '-1000px';
  document.body!.append(ta);
  ta.select();
  var ok = false;
  try {
    ok = document.execCommand('copy');
  } catch (_) {}
  ta.remove();
  if (active != null && active.isA<HTMLElement>()) (active as HTMLElement).focus();
  return ok;
}

void _report(HTMLButtonElement button, HTMLElement status, bool ok) {
  button.textContent = ok ? 'Copied' : 'Copy failed';
  status.textContent = ok
      ? 'Code copied to clipboard.'
      : 'Copy failed. Select the code and copy it manually.';
  Timer(_reset, () {
    button.textContent = 'Copy';
    status.textContent = '';
  });
}
