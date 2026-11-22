import 'dart:convert';
import 'dart:js_interop';

import 'package:web/web.dart';

typedef XRef = ({String title, String href, String? note});

/// Job 3: fetch related items and append a cross-reference section after the static content.
Future<void> addCrossReferences() async {
  final host = document.querySelector('[data-xref-src]');
  if (host == null) return;
  await _load(host, host.getAttribute('data-xref-src')!, null);
}

Future<void> _load(Element host, String url, Element? previous) async {
  List<XRef>? items;
  try {
    final response = await window
        .fetch(url.toJS, RequestInit(signal: AbortSignal.timeout(8000)))
        .toDart;
    if (response.status == 200) {
      items = parseXRefs((await response.text().toDart).toDart);
    }
  } catch (_) {
    items = null;
  }
  previous?.remove();
  if (items == null) {
    _renderFailure(host, url);
  } else if (items.isNotEmpty) {
    _renderItems(host, items);
  } // empty: the page stays exactly as served
}

/// Returns null when the payload is not a JSON array; skips malformed or unsafe entries.
List<XRef>? parseXRefs(String text) {
  final Object? raw;
  try {
    raw = jsonDecode(text);
  } on FormatException {
    return null;
  }
  if (raw is! List) return null;
  final out = <XRef>[];
  for (final item in raw) {
    if (item is! Map) continue;
    final title = item['title'];
    final href = item['href'];
    final note = item['note'];
    if (title is! String || title.trim().isEmpty) continue;
    if (href is! String || !safeHref(href)) continue;
    out.add((
      title: title.trim(),
      href: href.trim(),
      note: note is String ? note : null
    ));
  }
  return out;
}

/// Relative links and http(s) only; rejects javascript:, data: and friends.
bool safeHref(String href) {
  final h = href.trim().toLowerCase();
  if (h.isEmpty) return false;
  final colon = h.indexOf(':');
  if (colon < 0) return true;
  final slash = h.indexOf('/');
  if (slash >= 0 && slash < colon) return true;
  return h.startsWith('http:') || h.startsWith('https:');
}

Element _section(Element host) {
  final section = document.createElement('section')..className = 'xref';
  section.setAttribute('aria-labelledby', 'xref-heading');
  final heading = document.createElement('h2')
    ..id = 'xref-heading'
    ..textContent = 'Related';
  section.append(heading);
  host.after(section);
  return section;
}

void _renderItems(Element host, List<XRef> items) {
  final section = _section(host);
  final list = document.createElement('ul');
  for (final item in items) {
    final li = document.createElement('li');
    final a = document.createElement('a') as HTMLAnchorElement
      ..href = item.href
      ..textContent = item.title;
    li.append(a);
    final note = item.note?.trim() ?? '';
    if (note.isNotEmpty) li.append(document.createTextNode(' — $note'));
    list.append(li);
  }
  section.append(list);
}

void _renderFailure(Element host, String url) {
  final section = _section(host);
  final msg = document.createElement('p')
    ..textContent = 'Related items could not be loaded. ';
  msg.setAttribute('role', 'status');
  final retry = document.createElement('button') as HTMLButtonElement
    ..type = 'button'
    ..textContent = 'Retry';
  retry.addEventListener(
      'click',
      (Event _) {
        _load(host, url, section);
      }.toJS);
  msg.append(retry);
  section.append(msg);
}
