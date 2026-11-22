import 'package:web/web.dart';

/// Job 1: a page served at /tools/lmdart must resolve relative links against /tools/lmdart/.
void fixBaseUrl() {
  final loc = window.location;
  final path = loc.pathname;
  if (path.endsWith('/')) return;
  final last = path.substring(path.lastIndexOf('/') + 1);
  if (last.contains('.')) return; // a file such as demo.html already resolves against its directory
  window.history.replaceState(null, '', '$path/${loc.search}${loc.hash}');
}
