import 'package:web/web.dart';

/// Smallest thing that touches the DOM: one property write.
void main() {
  document.documentElement!.setAttribute('data-js', '1');
}
