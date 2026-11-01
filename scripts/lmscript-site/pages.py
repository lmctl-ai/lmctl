"""Shared recursive source/link and offline-output contracts for tutorial pages."""
from pathlib import Path
from html import unescape
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit, unquote
import re
import sys

class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.links, self.ids, self.base = [], set(), None
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.add(attrs['id'])
        if tag == 'base' and self.base is None:
            self.base = attrs.get('href')
        if tag in ('a', 'img'):
            self.links.append(attrs.get('href' if tag == 'a' else 'src', ''))

SCRIPT = re.compile(r'<h2\b[^>]*>Script: ([^<]+)</h2>\s*<pre><code>(.*?)</code></pre>', re.S)

def sources(path):
    return [(path.parent / 'examples' / unescape(name), unescape(code))
            for name, code in SCRIPT.findall(path.read_text())]

def offline_output(path):
    text = path.read_text()
    # A live transcript must never satisfy the offline golden assertion.
    section = re.search(r'<h2\b[^>]*>Output(?:[^<]*)</h2>(.*?)(?=<h2\b|</main>)', text, re.S)
    if not section:
        raise ValueError(f'{path}: missing offline Output section')
    samples = re.findall(r'<pre><samp>(.*?)</samp></pre>', section[1], re.S)
    if len(samples) != 1:
        raise ValueError(f'{path}: expected exactly one offline output sample')
    return unescape(samples[0]).rstrip('\n')

def check(root):
    root = root.resolve()
    for path in sorted(root.rglob('*.html')):
        text = path.read_text()
        page = Page(text)
        document_url = 'https://lmctl.com/lmscript/' + path.relative_to(root).as_posix()
        base = urljoin(document_url, page.base or document_url)
        for href in page.links:
            url = urlsplit(urljoin(base, href))
            if url.netloc != 'lmctl.com' or not url.path.startswith('/lmscript/'):
                continue
            target = (root / unquote(url.path.removeprefix('/lmscript/'))).resolve()
            if not target.is_relative_to(root):
                raise ValueError(f'{path}: link escapes tutorial root: {href}')
            if target.is_dir():
                target /= 'index.html'
            if not target.is_file():
                raise ValueError(f'{path}: broken tutorial link {href}')
            if url.fragment and unquote(url.fragment) not in Page(target.read_text()).ids:
                raise ValueError(f'{path}: missing tutorial anchor {href}')
        if re.search(r'<(?:strong|em)(?:\s|>)', text, re.I):
            raise ValueError(f'{path}: emphasis markup is not allowed')
        outside = re.sub(r'<pre\b[^>]*>.*?</pre>', '', text, flags=re.I | re.S)
        if re.search(r'<code(?:\s|>)', outside, re.I):
            raise ValueError(f'{path}: inline code markup is not allowed')
        for source, code in sources(path):
            if not source.is_file() or code != source.read_text():
                raise ValueError(f'{path}: displayed source differs from {source}')
        if sources(path) and not re.search(r'<p>Try it:.*?</p>\s*</main>', text, re.S):
            raise ValueError(f'{path}: tutorial must end with a Try it instruction')

if __name__ == '__main__':
    try:
        check(Path(sys.argv[1] if len(sys.argv) > 1 else 'lmscript-site'))
    except ValueError as error:
        sys.exit(str(error))
