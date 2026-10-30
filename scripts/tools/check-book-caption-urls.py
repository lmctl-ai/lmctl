#!/usr/bin/env python3
"""Check every pinned raw-source caption against the generated book lock."""
import concurrent.futures
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[2]


class Captions(HTMLParser):
    def __init__(self):
        super().__init__(); self.urls = set(); self.kbd = False
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'kbd': self.kbd = True
        if tag == 'a' and attrs.get('href', '').startswith('https://raw.githubusercontent.com/'):
            self.urls.add(attrs['href'])
    def handle_endtag(self, tag):
        if tag == 'kbd': self.kbd = False
    def handle_data(self, data):
        if self.kbd:
            self.urls.update(re.findall(r'https://raw\.githubusercontent\.com/[^\s\"\'<>]+', data))


def main():
    lock = json.loads((ROOT/'tools/lmvideo/books-lock.json').read_text())
    prefix = 'https://raw.githubusercontent.com/' + lock['repository'].removeprefix('https://github.com/') + '/' + lock['commit'] + '/'
    urls = set()
    for book in lock['books']:
        for page in (ROOT/'tools/lmvideo'/book).glob('*.html'):
            parser = Captions(); parser.feed(page.read_text()); urls.update(parser.urls)
    if not urls: raise ValueError('no source captions found')
    for url in urls:
        if not url.startswith(prefix) or url[len(prefix):] not in lock['inputs']:
            raise ValueError('caption is not pinned to the book input: '+url)
    def check(url):
        for attempt in range(3):
            try:
                with urllib.request.urlopen(url, timeout=30) as response:
                    status=response.status; data=response.read(2*1024*1024+1)
                actual=hashlib.sha256(data).hexdigest()
                if status!=200 or actual!=lock['inputs'][url[len(prefix):]]:
                    raise ValueError(f'caption HTTP/hash mismatch: {status} {url}')
                return {'url':url,'status':status,'sha256':actual}
            except OSError:
                if attempt==2: raise
                time.sleep(attempt+1)
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        results=list(pool.map(check,sorted(urls)))
    report=ROOT/'build/lmvideo-caption-urls.json'; report.parent.mkdir(exist_ok=True)
    report.write_text(json.dumps({'commit':lock['commit'],'all_200':True,'count':len(results),'urls':results},indent=2)+'\n')
    print(f'PASS: all {len(results)} unique caption URLs return HTTP 200 and match pinned source hashes')


if __name__=='__main__': main()
